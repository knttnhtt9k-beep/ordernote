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

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('思い込みを手放す14日ワーク');
}

function start(name, email, pin) {
  email = email_(email);
  name = String(name || '').trim();
  pin = String(pin || '');
  if (!name || name.length > 80 || !/^\d{4}$/.test(pin)) throw new Error('氏名と4桁の暗証番号を確認してください。');
  return locked_(() => {
    const book = book_();
    const sheet = book.getSheetByName('参加者');
    if (account_(sheet, email)) throw new Error('このメールアドレスでは作成できません。登録済みの方はログインしてください。');
    const id = Utilities.getUuid();
    const state = state_(book, id);
    sheet.appendRow([id, literal_(name), literal_(pin), new Date(), literal_(email)]);
    return state;
  });
}

function loadWork(email, pin) {
  return locked_(() => {
    const book = book_();
    const { id } = authenticate_(book, email, pin);
    return state_(book, id);
  });
}

function submitWork(email, pin, day, answers) {
  return locked_(() => {
    const book = book_();
    const { id, name } = authenticate_(book, email, pin);
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
function email_(input) {
  const email = String(input || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('メールアドレスを確認してください。');
  }
  return email;
}
function account_(sheet, email) {
  if (sheet.getLastRow() < 2) return null;
  return sheet.getRange(2, 5, sheet.getLastRow() - 1, 1)
    .createTextFinder(email).matchEntireCell(true).findNext();
}
function authenticate_(book, email, pin) {
  const message = 'メールアドレスまたは暗証番号をご確認ください。';
  if (!/^\d{4}$/.test(String(pin))) throw new Error(message);
  const sheet = book.getSheetByName('参加者');
  const match = account_(sheet, email_(email));
  if (!match) throw new Error(message);
  const row = match.getRow();
  const [id, name, stored] = sheet.getRange(row, 1, 1, 3).getDisplayValues()[0];
  const attempts = sheet.getRange(row, 7, 1, 2);
  const [count, until] = attempts.getValues()[0];
  const now = Date.now();
  if (until > now && count >= 5) throw new Error('15分ほど待ってからお試しください。');
  if (stored !== String(pin)) {
    attempts.setValues([[until > now ? Number(count) + 1 : 1, until > now ? until : now + 900000]]);
    SpreadsheetApp.flush();
    throw new Error(message);
  }
  if (count) attempts.clearContent();
  return { id, name };
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
