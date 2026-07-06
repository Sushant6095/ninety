// WS client with per-channel seq resume (README data-flow rule 2).
// sub: {op:"sub", ch:[...], since_seq?} — server backfills from Redis stream, then live.
export type Frame = { ch: string; seq: number; t: number; d: unknown };
export function connect(url: string, channels: string[], onFrame: (f: Frame) => void) {
  const last: Record<string, number> = {};
  let ws: WebSocket;
  const open = () => {
    ws = new WebSocket(url);
    ws.onopen = () => ws.send(JSON.stringify({ op: "sub", ch: channels, since: last }));
    ws.onmessage = (e) => { const f = JSON.parse(e.data) as Frame; last[f.ch] = f.seq; onFrame(f); };
    ws.onclose = () => setTimeout(open, 1000); // resume with last seqs — zero loss
  };
  open();
  return () => ws?.close();
}
