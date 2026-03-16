import { createInterface } from 'readline';
import WebSocket from 'ws';
import { randomUUID } from 'crypto';

const API_BASE = 'https://api.bnbot.ai';
const DEFAULT_PORT = 18900;

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function runLogin(argv: string[]): Promise<void> {
  // Parse --email from argv, or prompt for it
  let email = '';
  const emailIdx = argv.indexOf('--email');
  if (emailIdx !== -1 && argv[emailIdx + 1]) {
    email = argv[emailIdx + 1];
  }
  if (!email) {
    email = await prompt('Email: ');
  }
  if (!email) {
    console.error('Email is required.');
    process.exit(1);
  }

  // Parse --port
  let port = DEFAULT_PORT;
  const portIdx = argv.indexOf('--port');
  if (portIdx !== -1 && argv[portIdx + 1]) {
    port = parseInt(argv[portIdx + 1], 10) || DEFAULT_PORT;
  }

  // Step 1: Send verification code
  console.error(`Sending verification code to ${email}...`);
  const sendRes = await fetch(`${API_BASE}/api/v1/send-verification-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!sendRes.ok) {
    console.error(`Failed to send verification code: HTTP ${sendRes.status}`);
    process.exit(1);
  }

  console.error('Verification code sent! Check your email.');

  // Step 2: Prompt for code
  const code = await prompt('Enter verification code: ');
  if (!code) {
    console.error('Verification code is required.');
    process.exit(1);
  }

  // Step 3: Verify and get tokens
  console.error('Verifying code...');
  const loginRes = await fetch(`${API_BASE}/api/v1/email-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  if (!loginRes.ok) {
    const errData = await loginRes.json().catch(() => ({})) as any;
    console.error(`Login failed: ${errData.detail || `HTTP ${loginRes.status}`}`);
    process.exit(1);
  }

  const loginData = await loginRes.json() as {
    access_token: string;
    refresh_token: string;
    user: { email: string; full_name?: string; name?: string };
  };

  console.error(`Logged in as ${loginData.user.email}`);

  // Step 4: Send tokens to extension via WebSocket
  console.error('Sending auth to extension...');
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  const requestId = randomUUID();

  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'cli_action',
      requestId,
      actionType: 'inject_auth_tokens',
      actionPayload: {
        access_token: loginData.access_token,
        refresh_token: loginData.refresh_token,
        user: loginData.user,
      },
    }));
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.requestId === requestId) {
        if (msg.success !== false) {
          console.error('Extension authenticated successfully!');
          console.log(JSON.stringify({ success: true, email: loginData.user.email }));
        } else {
          console.error('Extension auth failed:', msg.error);
          console.log(JSON.stringify({ success: false, error: msg.error }));
        }
        ws.close();
        process.exit(0);
      }
    } catch {}
  });

  ws.on('error', () => {
    // Extension not connected, just save locally
    console.error('Extension not connected. Login successful but tokens not synced to extension.');
    console.log(JSON.stringify({ success: true, email: loginData.user.email, extensionSynced: false }));
    process.exit(0);
  });

  // Timeout after 10s
  setTimeout(() => {
    console.error('Timeout waiting for extension response. Login successful but tokens may not be synced.');
    console.log(JSON.stringify({ success: true, email: loginData.user.email, extensionSynced: false }));
    ws.close();
    process.exit(0);
  }, 10000);
}
