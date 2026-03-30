/**
 * Bridge — WebSocket server + client for Chrome Extension communication.
 * Auto-starts server if none running, waits for extension to connect.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync, createReadStream, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { homedir } from 'node:os';

const DEFAULT_PORT = 18900;
const ACTION_TIMEOUT = 60000;

interface PendingRequest {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

export class BridgeServer {
  private httpServer: Server | null = null;
  private wss: WebSocketServer | null = null;
  private extensionClient: WebSocket | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private extensionVersion: string | null = null;
  private port: number;
  private autoLoginDone: boolean = false;

  constructor(port?: number) {
    this.port = port || DEFAULT_PORT;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer = createServer((req, res) => this.handleHttp(req, res));
      this.wss = new WebSocketServer({ noServer: true });

      // Only upgrade WebSocket requests, let HTTP pass through to handleHttp
      this.httpServer.on('upgrade', (request, socket, head) => {
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.wss!.emit('connection', ws, request);
        });
      });

      this.httpServer.listen(this.port, '127.0.0.1', () => resolve());
      this.httpServer.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} already in use`));
        } else {
          reject(error);
        }
      });

      this.wss.on('connection', (ws) => {
        ws.on('message', (data) => {
          try {
            this.handleMessage(ws, JSON.parse(data.toString()));
          } catch { /* ignore */ }
        });
        ws.on('close', () => {
          if (this.extensionClient === ws) {
            this.extensionClient = null;
            this.extensionVersion = null;
            for (const [id, pending] of this.pendingRequests) {
              clearTimeout(pending.timer);
              pending.reject(new Error('Extension disconnected'));
              this.pendingRequests.delete(id);
            }
          }
        });
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'status':
        if (this.extensionClient && this.extensionClient !== ws && this.extensionClient.readyState === WebSocket.OPEN) {
          this.extensionClient.close(1000, 'Replaced');
        }
        this.extensionClient = ws;
        this.extensionVersion = message.version;
        this.autoLoginDone = false;
        this.tryAutoLogin();
        break;

      case 'action': {
        if (!this.extensionClient || this.extensionClient.readyState !== WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'action_result', requestId: message.requestId, success: false, error: 'Extension not connected' }));
          return;
        }
        const timer = setTimeout(() => {
          this.pendingRequests.delete(message.requestId);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'action_result', requestId: message.requestId, success: false, error: 'Timeout' }));
          }
        }, ACTION_TIMEOUT);
        this.pendingRequests.set(message.requestId, {
          resolve: (result) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(result)); },
          reject: (error) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'action_result', requestId: message.requestId, success: false, error: error.message })); },
          timer,
        });
        this.extensionClient.send(JSON.stringify(message));
        break;
      }

      case 'action_result': {
        const pending = this.pendingRequests.get(message.requestId);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(message.requestId);
          pending.resolve(message);
        }
        break;
      }

      case 'heartbeat':
        break;
    }
  }

  stop(): void {
    this.extensionClient?.close(1000, 'Shutdown');
    this.wss?.close();
    this.httpServer?.close();
    for (const [, p] of this.pendingRequests) { clearTimeout(p.timer); p.reject(new Error('Shutdown')); }
    this.pendingRequests.clear();
  }

  /**
   * HTTP handler — serves local media files at /media?path=<abs_path>
   */
  private handleHttp(req: IncomingMessage, res: ServerResponse): void {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      });
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://localhost:${this.port}`);
    if (url.pathname !== '/media' || req.method !== 'GET') {
      res.writeHead(404);
      res.end();
      return;
    }

    const filePath = url.searchParams.get('path');
    if (!filePath || !existsSync(filePath)) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    const mimeMap: Record<string, string> = {
      '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
      '.avi': 'video/x-msvideo', '.mkv': 'video/x-matroska',
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.gif': 'image/gif', '.webp': 'image/webp',
    };
    const ext = extname(filePath).toLowerCase();
    const contentType = mimeMap[ext] || 'application/octet-stream';
    const stat = statSync(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Access-Control-Allow-Origin': '*',
    });
    createReadStream(filePath).pipe(res);
  }

  /**
   * Auto-login extension using clawmoney API key if available.
   */
  private async tryAutoLogin(): Promise<void> {
    const configPath = join(homedir(), '.clawmoney', 'config.yaml');
    if (!existsSync(configPath)) return;

    try {
      const content = readFileSync(configPath, 'utf-8');
      const match = content.match(/^api_key:\s*(.+)$/m);
      const apiKey = match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
      if (!apiKey) return;

      const res = await fetch('https://api.bnbot.ai/api/v1/claw-agents/auth/login-extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      });

      if (!res.ok) return;

      const data = await res.json() as { access_token: string; refresh_token: string; user: { email: string } };
      const requestId = randomUUID();

      if (this.extensionClient && this.extensionClient.readyState === WebSocket.OPEN) {
        this.extensionClient.send(JSON.stringify({
          type: 'action',
          requestId,
          actionType: 'inject_auth_tokens',
          actionPayload: { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user },
        }));
        this.autoLoginDone = true;
        console.error(`[bnbot] Auto-login: ${data.user.email}`);
      }
    } catch { /* silent */ }
  }

  isExtensionConnected(): boolean {
    return this.extensionClient !== null && this.extensionClient.readyState === WebSocket.OPEN;
  }

  getExtensionVersion(): string | null { return this.extensionVersion; }
  getPort(): number { return this.port; }
}

// Singleton
let _server: BridgeServer | null = null;

async function ensureBridge(port: number): Promise<BridgeServer | null> {
  if (_server) return _server;

  const existing = await new Promise<boolean>((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const t = setTimeout(() => { ws.close(); resolve(false); }, 1000);
    ws.on('open', () => { clearTimeout(t); ws.close(); resolve(true); });
    ws.on('error', () => { clearTimeout(t); resolve(false); });
  });

  if (existing) return null; // Use existing server as client

  const server = new BridgeServer(port);
  await server.start();
  _server = server;
  return server;
}

/**
 * Send an action to the Chrome Extension.
 * Auto-starts bridge if needed, waits for extension connection.
 */
export async function sendAction(
  actionType: string,
  params: Record<string, unknown>,
  port?: number
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const wsPort = port || DEFAULT_PORT;
  const server = await ensureBridge(wsPort).catch(() => null);

  if (server && _server === server) {
    const start = Date.now();
    while (!server.isExtensionConnected() && Date.now() - start < 30000) {
      await new Promise(r => setTimeout(r, 500));
    }
    if (!server.isExtensionConnected()) {
      return { success: false, error: 'Chrome Extension not connected. Open Twitter in Chrome with BNBot extension enabled.' };
    }
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${wsPort}`);
    const requestId = randomUUID();
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; ws.close(); reject(new Error(`Timeout`)); } }, ACTION_TIMEOUT);

    ws.on('open', () => { ws.send(JSON.stringify({ type: 'action', requestId, actionType, actionPayload: params })); });
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'action_result' && msg.requestId === requestId) {
          settled = true; clearTimeout(timer); ws.close();
          resolve({ success: msg.success, data: msg.data, error: msg.error });
        }
      } catch { /* ignore */ }
    });
    ws.on('error', () => { if (!settled) { settled = true; clearTimeout(timer); reject(new Error('Cannot connect to bridge')); } });
    ws.on('close', () => { if (!settled) { settled = true; clearTimeout(timer); reject(new Error('Connection closed')); } });
  });
}
