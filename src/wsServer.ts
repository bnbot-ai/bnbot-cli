/**
 * Local WebSocket Server
 * Listens on localhost for BNBOT Chrome Extension connections.
 * Provides request-response matching for action execution.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import type { ActionRequest, ActionResult, IncomingMessage } from './types.js';

const DEFAULT_PORT = 18900;
const DEFAULT_TIMEOUT = 60000; // 60s default
const BUSY_RETRY_DELAY = 3000;
const MAX_BUSY_RETRIES = 10;

interface PendingRequest {
  resolve: (result: ActionResult) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

export class BnbotWsServer {
  private wss: WebSocketServer | null = null;
  private client: WebSocket | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private extensionVersion: string | null = null;
  private port: number;

  constructor(port?: number) {
    this.port = port || DEFAULT_PORT;
  }

  /**
   * Start the WebSocket server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port: this.port, host: '127.0.0.1' });

      this.wss.on('listening', () => {
        console.error(`[BNBOT MCP] WebSocket server listening on ws://localhost:${this.port}`);
        resolve();
      });

      this.wss.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`[BNBOT MCP] Port ${this.port} is already in use. Another MCP server may be running.`);
        }
        reject(error);
      });

      this.wss.on('connection', (ws) => {
        console.error('[BNBOT MCP] Extension connected');

        // Only allow one client at a time
        if (this.client && this.client.readyState === WebSocket.OPEN) {
          console.error('[BNBOT MCP] Replacing existing connection');
          this.client.close(1000, 'Replaced by new connection');
        }

        this.client = ws;

        ws.on('message', (data) => {
          try {
            const message: IncomingMessage = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (err) {
            console.error('[BNBOT MCP] Failed to parse message:', err);
          }
        });

        ws.on('close', () => {
          console.error('[BNBOT MCP] Extension disconnected');
          if (this.client === ws) {
            this.client = null;
            this.extensionVersion = null;
          }
          // Reject all pending requests
          for (const [id, pending] of this.pendingRequests) {
            clearTimeout(pending.timer);
            pending.reject(new Error('Extension disconnected'));
            this.pendingRequests.delete(id);
          }
        });

        ws.on('error', (err) => {
          console.error('[BNBOT MCP] WebSocket error:', err.message);
        });
      });
    });
  }

  /**
   * Stop the WebSocket server
   */
  stop(): void {
    if (this.client) {
      this.client.close(1000, 'Server shutting down');
      this.client = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    // Reject all pending
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Server shutting down'));
    }
    this.pendingRequests.clear();
  }

  /**
   * Handle incoming message from the extension
   */
  private handleMessage(message: IncomingMessage): void {
    switch (message.type) {
      case 'action_result': {
        const pending = this.pendingRequests.get(message.requestId);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(message.requestId);
          pending.resolve(message);
        } else {
          console.error('[BNBOT MCP] Received result for unknown request:', message.requestId);
        }
        break;
      }

      case 'status':
        this.extensionVersion = message.version;
        console.error(`[BNBOT MCP] Extension version: ${message.version}`);
        break;

      case 'heartbeat':
        // Just acknowledge
        break;
    }
  }

  /**
   * Send an action to the extension and wait for the result.
   * Automatically retries on busy responses.
   */
  async sendAction(
    actionType: string,
    params: Record<string, unknown>,
    timeout?: number
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    if (!this.client || this.client.readyState !== WebSocket.OPEN) {
      return {
        success: false,
        error: 'Extension not connected. Make sure BNBOT extension is running and OpenClaw integration is enabled in settings.',
      };
    }

    const effectiveTimeout = timeout || DEFAULT_TIMEOUT;
    let retries = 0;

    while (retries <= MAX_BUSY_RETRIES) {
      const requestId = randomUUID();
      const request: ActionRequest = {
        type: 'action',
        requestId,
        actionType,
        actionPayload: params,
      };

      try {
        const result = await this.sendAndWait(request, effectiveTimeout);

        if (!result.success && result.error === 'extension_busy') {
          retries++;
          const retryAfter = result.retryAfter || BUSY_RETRY_DELAY;
          console.error(`[BNBOT MCP] Extension busy, retrying in ${retryAfter}ms (${retries}/${MAX_BUSY_RETRIES})`);
          await new Promise((r) => setTimeout(r, retryAfter));
          continue;
        }

        return {
          success: result.success,
          data: result.data,
          error: result.error,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }

    return {
      success: false,
      error: 'Extension busy after maximum retries',
    };
  }

  /**
   * Send a request and wait for the matching response
   */
  private sendAndWait(request: ActionRequest, timeout: number): Promise<ActionResult> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(request.requestId);
        reject(new Error(`Action '${request.actionType}' timed out after ${timeout / 1000}s`));
      }, timeout);

      this.pendingRequests.set(request.requestId, { resolve, reject, timer });

      try {
        this.client!.send(JSON.stringify(request));
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(request.requestId);
        reject(err);
      }
    });
  }

  /**
   * Check if the extension is connected
   */
  isExtensionConnected(): boolean {
    return this.client !== null && this.client.readyState === WebSocket.OPEN;
  }

  /**
   * Get extension info
   */
  getExtensionInfo(): { connected: boolean; version: string | null } {
    return {
      connected: this.isExtensionConnected(),
      version: this.extensionVersion,
    };
  }
}
