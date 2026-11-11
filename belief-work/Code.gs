function days_() {
  const properties = PropertiesService.getScriptProperties();
  const document = DocumentApp.openById(properties.getProperty('WORK_DOCUMENT_ID'));
  const days = [];
  for (const paragraph of document.getBody().getParagraphs()) {
    const text = paragraph.getText().trim();
    const heading = text.match(/^(\d+)日目ー(.+)/);
    if (heading) {
      days.push({ title: heading[2], body: [], questions: [] });
      continue;
    }
    const day = days[days.length - 1];
    if (!day || !text) continue;
    const lines = text.split(/[\u000b\n]/);
    day.body.push(lines.join('\n'));
    day.questions.push(...lines.filter(line => /^[①②③④]/.test(line.trim())).map(line => line.trim()));
  }
  if (days.length !== 14 || days.some((day, index) => day.questions.length !== (index === 13 ? 4 : 3))) {
    throw new Error('ワークの設問を読み込めませんでした。運営へお問い合わせください。');
  }
  return days;
}

function doGet(e) {
  const page = HtmlService.createTemplateFromFile('Index');
  page.loginUrl = '';
  page.session = '';
  page.registered = false;
  page.loginError = '';
  try {
    const config = oauthConfig_();
    const params = e && e.parameter || {};
    if (params.code && params.state) {
      const identity = completeLogin_(config, params.code, params.state);
      const book = book_();
      assertAllowed_(book, identity.email);
      page.registered = Boolean(participant_(book, identity.sub));
      page.session = random_();
      CacheService.getScriptCache().put('work-session-' + page.session, JSON.stringify(identity), 7200);
    } else {
      page.loginUrl = loginUrl_(config);
      if (params.error) page.loginError = 'Googleログインを完了できませんでした。';
    }
  } catch (error) {
    page.loginError = 'ログインできませんでした。受講者登録に使ったGoogleアカウントをご確認ください。';
    try { page.loginUrl = loginUrl_(oauthConfig_()); } catch (_) {}
  }
  return page.evaluate().setTitle('思い込みを手放す14日ワーク');
}

function start(session, name, pin) {
  name = String(name || '').trim();
  pin = String(pin || '');
  if (!name || name.length > 80 || !/^\d{4}$/.test(pin)) throw new Error('氏名と4桁の暗証番号を確認してください。');
  return locked_(() => {
    const book = book_();
    const sheet = book.getSheetByName('参加者');
    const identity = sessionIdentity_(book, session);
    if (participant_(book, identity.sub)) throw new Error('登録済みです。続きから開いてください。');
    const id = Utilities.getUuid();
    const state = state_(book, id);
    sheet.appendRow([id, literal_(name), literal_(pin), new Date(), literal_(identity.email), literal_(identity.sub)]);
    return state;
  });
}

function loadWork(session, pin) {
  return locked_(() => {
    const book = book_();
    const { id } = authenticate_(book, session, pin);
    return state_(book, id);
  });
}

function submitWork(session, pin, day, answers) {
  return locked_(() => {
    const book = book_();
    const { id, name } = authenticate_(book, session, pin);
    const state = state_(book, id);
    if (Number.isInteger(day) && state.entries[day - 1]?.submitted) {
      summarize_(book, id, name, state);
      return state;
    }
    if (!Number.isInteger(day) || day !== state.next || !state.available) throw new Error('このワークはまだ提出できません。');
    if (!Array.isArray(answers) || answers.length !== state.entries[day - 1].questions.length ||
        answers.some(value => typeof value !== 'string' || !value.trim() || value.length > 3000)) {
      throw new Error('各回答を1〜3000文字で入力してください。');
    }
    book.getSheetByName('Day ' + day).appendRow([id, literal_(name), new Date(), ...answers.map(literal_)]);
    const updated = state_(book, id);
    summarize_(book, id, name, updated);
    return updated;
  });
}

function book_() {
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('WORK_SHEET_ID'));
}
function locked_(operation) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const result = operation();
    SpreadsheetApp.flush();
    return result;
  } finally {
    lock.releaseLock();
  }
}
function literal_(value) {
  return "'" + value;
}
function row_(sheet, id) {
  if (sheet.getLastRow() < 2) return null;
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
}
function authenticate_(book, session, pin) {
  const identity = sessionIdentity_(book, session);
  const row = participant_(book, identity.sub);
  if (!row) throw new Error('最初にワークを始めてください。');
  const [id, name, stored] = row;
  const cache = CacheService.getScriptCache();
  const key = 'pin-fail-' + id;
  const failures = Number(cache.get(key) || 0);
  if (failures >= 5) throw new Error('時間をおいて、もう一度お試しください。');
  if (stored !== String(pin)) {
    cache.put(key, String(failures + 1), 900);
    throw new Error('暗証番号を確認してください。');
  }
  cache.remove(key);
  return { id, name };
}

function participant_(book, subject) {
  const sheet = book.getSheetByName('参加者');
  if (sheet.getLastRow() < 2) return null;
  const match = sheet.getRange(2, 6, sheet.getLastRow() - 1, 1)
    .createTextFinder(subject).matchEntireCell(true).findNext();
  return match ? sheet.getRange(match.getRow(), 1, 1, 3).getDisplayValues()[0] : null;
}

function assertAllowed_(book, email) {
  const sheet = book.getSheetByName('受講者アクセス');
  const count = sheet ? sheet.getLastRow() - 1 : 0;
  if (count < 1 || !sheet.getRange(2, 1, count, 1).getDisplayValues()
    .some(([value]) => value.trim().toLowerCase() === email)) {
    throw new Error('受講者として登録されていないGoogleアカウントです。');
  }
}

function sessionIdentity_(book, session) {
  const raw = typeof session === 'string' && /^[a-f0-9]{64}$/.test(session)
    && CacheService.getScriptCache().get('work-session-' + session);
  if (!raw) throw new Error('Googleログインの有効期限が切れました。ワークのURLを開き直してください。');
  const identity = JSON.parse(raw);
  assertAllowed_(book, identity.email);
  return identity;
}

function oauthConfig_() {
  const settings = PropertiesService.getScriptProperties();
  const config = {
    id: settings.getProperty('GOOGLE_OAUTH_CLIENT_ID'),
    secret: settings.getProperty('GOOGLE_OAUTH_CLIENT_SECRET'),
    redirect: settings.getProperty('GOOGLE_OAUTH_REDIRECT_URI')
  };
  if (!config.id || !config.secret || !config.redirect) throw new Error('Googleログインが未設定です。');
  return config;
}

function random_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

function loginUrl_(config) {
  const state = random_();
  const verifier = random_();
  CacheService.getScriptCache().put('work-oauth-' + state, verifier, 600);
  const challenge = Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, verifier)
  ).replace(/=+$/, '');
  const parameters = {
    client_id: config.id, redirect_uri: config.redirect, response_type: 'code',
    scope: 'openid email', state, code_challenge: challenge,
    code_challenge_method: 'S256', prompt: 'select_account'
  };
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + Object.keys(parameters)
    .map(key => key + '=' + encodeURIComponent(parameters[key])).join('&');
}

function completeLogin_(config, code, state) {
  if (!/^[a-f0-9]{64}$/.test(state)) throw new Error('ログインをやり直してください。');
  const verifier = locked_(() => {
    const cache = CacheService.getScriptCache();
    const key = 'work-oauth-' + state;
    const value = cache.get(key);
    cache.remove(key);
    return value;
  });
  if (!verifier) throw new Error('ログインをやり直してください。');
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      code, client_id: config.id, client_secret: config.secret,
      redirect_uri: config.redirect, code_verifier: verifier, grant_type: 'authorization_code'
    }
  });
  if (response.getResponseCode() !== 200) throw new Error('Googleログインに失敗しました。');
  const accessToken = JSON.parse(response.getContentText()).access_token;
  if (!accessToken) throw new Error('Googleログインに失敗しました。');
  const profileResponse = UrlFetchApp.fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: 'Bearer ' + accessToken },
    muteHttpExceptions: true
  });
  if (profileResponse.getResponseCode() !== 200) throw new Error('本人確認に失敗しました。');
  const profile = JSON.parse(profileResponse.getContentText());
  if (profile.email_verified !== true || typeof profile.email !== 'string' || !/^\d+$/.test(profile.sub)) {
    throw new Error('確認済みのGoogleアカウントが必要です。');
  }
  return { email: profile.email.trim().toLowerCase(), sub: profile.sub };
}

function state_(book, id) {
  let unlockAt = 0;
  let next = null;
  const days = days_();
  const entries = days.map((day, index) => {
    const sheet = book.getSheetByName('Day ' + (index + 1));
    const row = row_(sheet, id);
    if (row) {
      const [submitted, ...answers] = sheet.getRange(row.getRow(), 3, 1, 1 + day.questions.length).getValues()[0];
      const date = Utilities.formatDate(submitted, 'Asia/Tokyo', 'yyyy-MM-dd');
      unlockAt = Date.parse(date + 'T00:00:00+09:00') + 86400000;
      return { ...day, submitted: submitted.toISOString(), answers };
    }
    if (next === null) next = index + 1;
    return { title: day.title };
  });
  const available = next !== null && Date.now() >= unlockAt;
  if (available) entries[next - 1] = days[next - 1];
  return { entries, next, available, unlockAt };
}
function summarize_(book, id, name, state) {
  const sheet = book.getSheetByName('ワークまとめ');
  const row = row_(sheet, id);
  const submitted = state.entries.map((entry, index) => ({...entry, day: index + 1})).filter(entry => entry.submitted);
  const sections = state.entries.map(entry => entry.submitted ? entry.title + '\n' +
    entry.questions.map((question, index) => question + '\n' + entry.answers[index]).join('\n') : '');
  const notes = [[1,5,'出来事と解釈の違い'],[2,8,'本音と実際の行動の違い'],[9,10,'理想と大切にしたい価値観'],[12,13,'考えた選択と試した行動']].filter(([a,b]) =>
    state.entries[a-1].submitted && state.entries[b-1].submitted
  ).map(([a,b,label]) => 'Day ' + a + '・' + b + '｜' + label + 'を見比べる');
  const values = [id, literal_(name), submitted.length, literal_(notes.join('\n')), ...sections.map(literal_)];
  if (row) sheet.getRange(row.getRow(), 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);
}
