const [url, top, bottom, left = '0', right = '0'] = process.argv.slice(2);
const ws = new WebSocket(url);
let id = 0; const pending = new Map();
const send = (method, params = {}, sessionId) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
ws.onopen = async () => {
  const { result } = await send('Target.getTargets');
  const pages = result.targetInfos.filter((t) => t.type === 'page' && t.url.includes('localhost:5288'));
  for (const p of pages) {
    const a = await send('Target.attachToTarget', { targetId: p.targetId, flatten: true });
    const r = await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: +top, bottom: +bottom, left: +left, right: +right } }, a.result.sessionId);
    console.log(p.url, JSON.stringify(r.error || 'ok'));
  }
  ws.close();
};
