// Minimal MCP client (streamable HTTP, JSON-RPC 2.0) for Anchor's hosted browser MCP server.
// Edge invocations are short, so each one opens a fresh MCP connection and re-attaches to the
// same Anchor browser with the `anchor-session-id` header.
export const ANCHOR_BROWSER_MCP = 'https://api.anchorbrowser.io/v1/mcp/browser';

export interface McpTool { name: string; description?: string; inputSchema?: Record<string, unknown> }
export interface McpContent { type: string; text?: string; data?: string; mimeType?: string }
export interface McpResult { content: McpContent[]; isError?: boolean }

export class McpError extends Error { constructor(public code: string, public detail = '') { super(code); } }

function parseBody(contentType: string, raw: string): any {
  if (contentType.includes('text/event-stream')) {
    // Last JSON-RPC message carrying a result or error wins.
    let found: any = null;
    for (const line of raw.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue;
      try { const msg = JSON.parse(line.slice(5).trim()); if (msg && ('result' in msg || 'error' in msg)) found = msg; } catch { /* keep-alive */ }
    }
    return found;
  }
  try { return JSON.parse(raw); } catch { return null; }
}

export class McpClient {
  private sessionId: string | null = null;
  private nextId = 1;
  constructor(private url: string, private headers: Record<string, string>) {}

  private async post(body: unknown, timeoutMs: number): Promise<{ msg: any; headers: Headers }> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { ...this.headers, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
        ...(this.sessionId ? { 'mcp-session-id': this.sessionId } : {}) },
      body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs), redirect: 'error',
    });
    const raw = await response.text();
    if (!response.ok) throw new McpError(response.status === 401 || response.status === 403 ? 'mcp_auth_rejected' : 'mcp_http_' + response.status, raw.slice(0, 300));
    return { msg: parseBody(response.headers.get('content-type') || '', raw), headers: response.headers };
  }

  private async request(method: string, params: unknown, timeoutMs = 60000): Promise<any> {
    const { msg, headers } = await this.post({ jsonrpc: '2.0', id: this.nextId++, method, params }, timeoutMs);
    const sid = headers.get('mcp-session-id');
    if (sid) this.sessionId = sid;
    if (!msg) throw new McpError('mcp_invalid_response');
    if (msg.error) throw new McpError('mcp_error', String(msg.error.message || '').slice(0, 300));
    return msg.result;
  }

  async connect(): Promise<void> {
    await this.request('initialize', {
      protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'skillsurger-agent', version: '1.0.0' },
    }, 30000);
    await this.post({ jsonrpc: '2.0', method: 'notifications/initialized' }, 15000).catch(() => undefined);
  }

  async listTools(): Promise<McpTool[]> {
    const tools: McpTool[] = [];
    let cursor: string | undefined;
    for (let i = 0; i < 5; i++) {
      const page = await this.request('tools/list', cursor ? { cursor } : {});
      tools.push(...(Array.isArray(page?.tools) ? page.tools : []));
      cursor = page?.nextCursor; if (!cursor) break;
    }
    return tools;
  }

  async callTool(name: string, args: Record<string, unknown>, timeoutMs = 90000): Promise<McpResult> {
    const result = await this.request('tools/call', { name, arguments: args }, timeoutMs);
    return { content: Array.isArray(result?.content) ? result.content : [], isError: !!result?.isError };
  }
}

/** A browser MCP connection attached to an existing Anchor session. */
export async function anchorBrowserMcp(sessionId?: string): Promise<McpClient> {
  const key = Deno.env.get('ANCHOR_API_KEY');
  if (!key) throw new McpError('anchor_not_configured');
  const client = new McpClient(ANCHOR_BROWSER_MCP, { 'anchor-api-key': key, ...(sessionId ? { 'anchor-session-id': sessionId } : {}) });
  await client.connect();
  return client;
}

export function textOf(result: McpResult, max = 20000): string {
  return result.content.filter((c) => c.type === 'text' && c.text).map((c) => c.text).join('\n').slice(0, max);
}
