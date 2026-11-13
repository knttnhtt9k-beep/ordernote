import { days } from './lessons.mjs';

const encoder = new TextEncoder();

async function hash(pin, salt, pepper) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pepper + ':' + pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:encoder.encode(salt), iterations:100000}, key, 256);
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2,'0')).join('');
}

function sameHash(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

function unlockTime(time) {
  const offset = 9 * 3600000;
  return (Math.floor((time + offset) / 86400000) + 1) * 86400000 - offset;
}

async function state(db, id) {
  const { results } = await db.prepare('SELECT day, answers_json, submitted_at FROM submissions WHERE participant_id = ? ORDER BY day').bind(id).all();
  const completed = new Map(results.map(row => [row.day, row]));
  const next = days.findIndex((_, index) => !completed.has(index + 1)) + 1 || null;
  const unlockAt = next > 1 ? unlockTime(completed.get(next - 1).submitted_at) : 0;
  return {
    next, unlockAt, available: next !== null && Date.now() >= unlockAt,
    entries: days.map((lesson, index) => {
      const row = completed.get(index + 1);
      return row ? {...lesson, answers:JSON.parse(row.answers_json), submitted:new Date(row.submitted_at).toISOString()} : lesson;
    })
  };
}

function response(data, status, origin) {
  return Response.json(data, {status,headers:{'Access-Control-Allow-Origin':origin,'Cache-Control':'no-store','Vary':'Origin'}});
}

export default {
  async fetch(request, env) {
    const origin = 'https://knttnhtt9k-beep.github.io';
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/api/work') return response({ok:false},404,origin);
    if (!env.DB || !env.PIN_PEPPER) return response({ok:false,message:'ワークは準備中です。'},503,origin);
    const reject = message => response({ok:false,message},400,origin);
    const authError = 'メールアドレスまたは暗証番号をご確認ください。';
    try {
      const raw = await request.text();
      if (raw.length > 80000) return reject('送信内容をご確認ください。');
      const {action,args} = JSON.parse(raw);
      if (!Array.isArray(args) || !['start','loadWork','submitWork'].includes(action)) return reject('送信内容をご確認ください。');
      const [name, input, pin] = action === 'start' ? args : [null,...args];
      const email = typeof input === 'string' ? input.trim().toLowerCase() : '';
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) return reject(authError);
      const db = env.DB.withSession('first-primary');
      let id;
      if (action === 'start') {
        if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) return reject('氏名をご確認ください。');
        id = crypto.randomUUID();
        const salt = crypto.randomUUID();
        const digest = await hash(pin,salt,env.PIN_PEPPER);
        const inserted = await db.prepare('INSERT INTO participants(id,email,name,pin_hash,pin_salt,registered_at) VALUES(?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING').bind(id,email,name.trim(),digest,salt,Date.now()).run();
        if (!inserted.meta.changes) return reject('登録済みの方はログインしてください。');
        return response({ok:true,data:{next:1,unlockAt:0,available:true,entries:days}},200,origin);
      } else {
        const now = Date.now();
        const account = await db.prepare('SELECT id,pin_hash,pin_salt FROM participants WHERE email = ?').bind(email).first();
        if (!account) return reject(authError);
        id = account.id;
        // Reserve an attempt atomically before checking the PIN.
        const attempt = await db.prepare('UPDATE participants SET failed_attempts = CASE WHEN locked_until <= ? THEN 1 ELSE failed_attempts + 1 END, locked_until = CASE WHEN locked_until <= ? THEN ? ELSE locked_until END WHERE id = ? AND (locked_until <= ? OR failed_attempts < 5)').bind(now,now,now+900000,id,now).run();
        if (!attempt.meta.changes) return reject('15分ほど待ってからお試しください。');
        if (!sameHash(account.pin_hash,await hash(pin,account.pin_salt,env.PIN_PEPPER))) return reject(authError);
        await db.prepare('UPDATE participants SET failed_attempts = 0, locked_until = 0 WHERE id = ?').bind(id).run();
        if (action === 'submitWork') {
          const [, , day, answers] = args;
          if (!Number.isInteger(day) || day < 1 || day > days.length || !Array.isArray(answers) || answers.length !== days[day-1].questions.length || answers.some(answer=>typeof answer!=='string'||!answer.trim()||answer.length>3000)) return reject('回答をご確認ください。');
          const current = await state(db,id);
          if (current.entries[day-1].submitted) return response({ok:true,data:current},200,origin);
          if (day !== current.next || !current.available) return reject('このワークはまだ提出できません。');
          await db.prepare('INSERT INTO submissions(participant_id,day,answers_json,submitted_at) VALUES(?,?,?,?) ON CONFLICT(participant_id,day) DO NOTHING').bind(id,day,JSON.stringify(answers),Date.now()).run();
        }
      }
      return response({ok:true,data:await state(db,id)},200,origin);
    } catch {
      return response({ok:false,message:'処理に失敗しました。時間をおいて再度お試しください。'},500,origin);
    }
  }
};
