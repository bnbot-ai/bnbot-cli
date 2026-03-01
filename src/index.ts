#!/usr/bin/env node

/**
 * BNBOT MCP Server
 *
 * Bridges AI assistants (like OpenClaw/Claude) with the BNBOT Chrome Extension
 * for controlling Twitter/X.
 *
 * Architecture:
 *   AI Assistant ←→ MCP Server (stdio) ←→ WebSocket Server ←→ Chrome Extension
 *
 * Usage:
 *   npx bnbot-mcp-server              # Start with defaults (port 18900)
 *   npx bnbot-mcp-server --port 9999  # Custom port
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BnbotWsServer } from './wsServer.js';
import { registerAllTools } from './tools/index.js';

const DEFAULT_PORT = 18900;

async function main() {
  // Parse args
  const args = process.argv.slice(2);
  let port = DEFAULT_PORT;
  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    port = parseInt(args[portIndex + 1], 10);
    if (isNaN(port)) port = DEFAULT_PORT;
  }

  // Create WebSocket server (for extension communication)
  const wsServer = new BnbotWsServer(port);

  try {
    await wsServer.start();
  } catch (err) {
    console.error('[BNBOT MCP] Failed to start WebSocket server:', err);
    process.exit(1);
  }

  // Create MCP server (for AI assistant communication via stdio)
  const mcpServer = new McpServer({
    name: 'bnbot',
    version: '0.1.0',
  });

  // Register all tools
  registerAllTools(mcpServer, wsServer);

  // Connect MCP server to stdio transport
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);

  console.error('[BNBOT MCP] Server started. Waiting for extension connection...');

  // Handle graceful shutdown
  const shutdown = () => {
    console.error('[BNBOT MCP] Shutting down...');
    wsServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[BNBOT MCP] Fatal error:', err);
  process.exit(1);
});
