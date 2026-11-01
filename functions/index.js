const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const REMINDERS = [7, 3, 1, 0];
const REM_LABEL = { 7: 'en 1 semana', 3: 'en 3 días', 1: 'mañana', 0: 'hoy' };
const TYPE_LABEL = { quiz: 'Quiz', parcial: 'Parcial', trabajo: 'Trabajo', tarea: 'Tarea' };
const CLASS_LEAD_MIN = 15;
const TASK_HOUR_MIN = 8 * 60;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function localParts(tz, date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(date).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute), wd: WEEKDAYS.indexOf(p.weekday) };
}
const dayNum = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
const toMin = hhmm => { const [h, m] = String(hhmm || '').split(':').map(Number); return Number.isFinite(h) ? h * 60 + (m || 0) : null; };

function dueNotifications(data, now, sent) {
  const out = [];
  for (const c of data.classes || []) {
    const start = toMin(c.start);
    if (start === null || c.day !== now.wd) continue;
    const key = `c:${c.id}:${now.date}`;
    if (sent[key] || now.min < start - CLASS_LEAD_MIN || now.min >= start) continue;
    out.push({
      key, kind: 'class', title: `Clase de ${c.subject || 'tu horario'} en ${start - now.min} min`,
      body: [c.start + (c.end ? '–' + c.end : ''), c.room, c.mode === 'virtual' ? 'Virtual' : ''].filter(Boolean).join(' · '),
    });
  }
  for (const t of data.tasks || []) {
    if (t.done || !t.date || now.min < TASK_HOUR_MIN) continue;
    const d = dayNum(t.date) - dayNum(now.date);
    if (!REMINDERS.includes(d)) continue;
    const key = `t:${t.id}:${d}`;
    if (sent[key]) continue;
    out.push({
      key, kind: 'task', title: `${TYPE_LABEL[t.type] || 'Pendiente'} ${REM_LABEL[d]}`,
      body: [t.title, t.subject, t.time].filter(Boolean).join(' · '),
    });
  }
  return out;
}

exports.sendReminders = onSchedule({ schedule: 'every 1 minutes', timeZone: 'America/Bogota', maxInstances: 1 }, async () => {
  const tokenSnap = await db.collectionGroup('tokens').get();
  const byUser = new Map();
  tokenSnap.forEach(doc => {
    const uid = doc.ref.parent.parent.id;
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid).push({ token: doc.id, tz: doc.get('tz') || 'America/Bogota', ref: doc.ref });
  });

  const nowDate = new Date();
  for (const [uid, devices] of byUser) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) continue;
      let data; try { data = JSON.parse(userDoc.get('data')); } catch { continue; }
      const sentRef = db.collection('users').doc(uid).collection('private').doc('sent');
      const sent = (await sentRef.get()).data() || {};
      const due = dueNotifications(data, localParts(devices[0].tz, nowDate), sent);
      if (!due.length) continue;

      for (const n of due) {
        const res = await admin.messaging().sendEachForMulticast({
          tokens: devices.map(d => d.token),
          data: { title: n.title, body: n.body, tag: n.key, kind: n.kind },
          webpush: { headers: { Urgency: 'high', TTL: '3600' } },
        });
        res.responses.forEach((r, i) => {
          if (!r.success && /registration-token-not-registered|invalid-argument|invalid-registration-token/.test(r.error?.code || ''))
            devices[i].ref.delete().catch(() => {});
        });
        sent[n.key] = Date.now();
      }
      const cutoff = Date.now() - 10 * 864e5;
      for (const k of Object.keys(sent)) if (sent[k] < cutoff) delete sent[k];
      await sentRef.set(sent);
    } catch (e) {
      console.error('Error con el usuario', uid, e);
    }
  }
});
