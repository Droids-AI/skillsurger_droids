// Minimal Chrome DevTools Protocol client for one job: attach a file uploaded to the Anchor session
// (POST /v1/sessions/{id}/uploads) to the page's resume <input type=file> with DOM.setFileInputFiles,
// as Anchor documents. Anchor's MCP file tool only reads its own sandbox, so uploads go this way.
// Searches every page and out-of-process iframe (embedded Greenhouse/Lever/Workday forms).

type Node = { nodeId: number; backendNodeId: number; nodeName: string; attributes?: string[]; children?: Node[]; contentDocument?: Node; shadowRoots?: Node[] };

class Cdp {
  private ws!: WebSocket;
  private id = 0;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  async open(url: string) {
    this.ws = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('cdp_connect_timeout')), 20000);
      this.ws.onopen = () => { clearTimeout(t); resolve(); };
      this.ws.onerror = () => { clearTimeout(t); reject(new Error('cdp_connect_failed')); };
    });
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(String(e.data));
      const p = msg.id && this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      msg.error ? p.reject(new Error('cdp_' + String(msg.error.message).slice(0, 120))) : p.resolve(msg.result);
    };
  }
  send(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<any> {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => { if (this.pending.delete(id)) reject(new Error('cdp_timeout ' + method)); }, 20000);
    });
  }
  close() { try { this.ws.close(); } catch { /* closed */ } }
}

function fileInputs(node: Node | undefined, out: Node[] = []): Node[] {
  if (!node) return out;
  if (node.nodeName === 'INPUT') {
    const a = node.attributes || [];
    const type = a[a.indexOf('type') + 1];
    if (a.includes('type') && String(type).toLowerCase() === 'file') out.push(node);
  }
  for (const c of node.children || []) fileInputs(c, out);
  for (const s of node.shadowRoots || []) fileInputs(s, out);
  fileInputs(node.contentDocument, out);
  return out;
}

/** Higher is more likely the resume field. */
export function resumeScore(attributes: string[], hint = ''): number {
  const text = attributes.join(' ').toLowerCase();
  let score = 0;
  if (/resume|résumé|\bcv\b|curriculum/.test(text)) score += 3;
  if (/pdf|\.doc|application\/msword|wordprocessing/.test(text)) score += 1;
  if (/cover|letter|photo|avatar|image\/|portfolio|transcript/.test(text)) score -= 3;
  if (hint && hint.length > 2 && text.includes(hint.toLowerCase())) score += 2;
  return score;
}

/** Attach `path` to the best resume file input. Returns how many inputs were seen. */
export async function attachFile(sessionId: string, path: string, hint = ''): Promise<{ attached: boolean; inputs: number; where: string | null }> {
  const key = Deno.env.get('ANCHOR_API_KEY');
  if (!key) throw new Error('anchor_not_configured');
  const cdp = new Cdp();
  // Built at call time from the key and session id; never stored or logged.
  await cdp.open(`wss://connect.anchorbrowser.io?apiKey=${encodeURIComponent(key)}&sessionId=${encodeURIComponent(sessionId)}`);
  try {
    const { targetInfos } = await cdp.send('Target.getTargets');
    const targets = (targetInfos as any[]).filter((t) => ['page', 'iframe'].includes(t.type) && /^https:/.test(t.url));
    let best: { score: number; sid: string; node: Node; url: string } | null = null;
    let seen = 0;
    for (const t of targets) {
      let sid: string;
      try { sid = (await cdp.send('Target.attachToTarget', { targetId: t.targetId, flatten: true })).sessionId; } catch { continue; }
      try {
        const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true }, sid);
        for (const node of fileInputs(root)) {
          seen++;
          const score = resumeScore(node.attributes || [], hint);
          if (!best || score > best.score) best = { score, sid, node, url: t.url };
        }
      } catch { /* target went away */ }
    }
    if (!best || (seen > 1 && best.score <= 0)) return { attached: false, inputs: seen, where: null };
    await cdp.send('DOM.setFileInputFiles', { files: [path], backendNodeId: best.node.backendNodeId }, best.sid);
    return { attached: true, inputs: seen, where: new URL(best.url).hostname };
  } finally { cdp.close(); }
}
