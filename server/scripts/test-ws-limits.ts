import assert from 'assert/strict';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import WebSocket from 'ws';

const port = process.env.WS_LIMIT_TEST_PORT || String(8800 + Math.floor(Math.random() * 500));
const url = `ws://127.0.0.1:${port}`;
const httpUrl = `http://127.0.0.1:${port}`;
const serverDir = path.resolve(__dirname, '..');
const logs: string[] = [];

function appendLog(chunk: Buffer): void {
    logs.push(chunk.toString());
    if (logs.length > 200) logs.shift();
}

async function waitForHealth(child: ChildProcess, timeoutMs = 15000): Promise<void> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        if (child.exitCode !== null) {
            throw new Error(`server exited early with code ${child.exitCode}\n${logs.join('')}`);
        }
        try {
            const response = await fetch(`${httpUrl}/health`);
            if (response.ok) return;
        } catch {
            // retry until the server is listening
        }
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error(`server did not become healthy\n${logs.join('')}`);
}

async function main(): Promise<void> {
    const child = spawn(process.execPath, ['-r', 'ts-node/register', 'src/index.ts'], {
        cwd: serverDir,
        env: {
            ...process.env,
            PORT: port,
            NODE_ENV: 'test',
            TRUST_PROXY: 'true',
            MAX_WS_CONNECTIONS: '10',
            MAX_WS_CONNECTIONS_PER_IP: '1',
            ALLOWED_ORIGINS: ''
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout?.on('data', appendLog);
    child.stderr?.on('data', appendLog);

    const hardTimeout = setTimeout(() => {
        console.error('[ws-limits] timeout');
        child.kill('SIGKILL');
        process.exit(1);
    }, 30000);

    try {
        await waitForHealth(child);

        const first = new WebSocket(url);
        await new Promise<void>((resolve, reject) => {
            first.once('open', () => resolve());
            first.once('error', reject);
        });

        // The second connection is over the per-IP cap. Send an oversized frame
        // immediately. Before the fix, the rejected socket had no error listener
        // and this could crash the whole server.
        const second = new WebSocket(url);
        await new Promise<void>((resolve) => {
            const finish = () => resolve();
            second.once('open', () => {
                try {
                    second.send('x'.repeat(70 * 1024));
                } catch {
                    // The server may terminate the socket before the send lands.
                }
                setTimeout(finish, 500);
            });
            second.once('error', finish);
            second.once('close', finish);
            setTimeout(finish, 2000);
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await fetch(`${httpUrl}/health`);
        assert.equal(response.status, 200, 'server should stay alive after the rejected oversized frame');

        first.close();
        second.close();
        console.log('[ws-limits] PASS: rejected connection with an oversized frame did not crash the server');
    } finally {
        clearTimeout(hardTimeout);
        child.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (child.exitCode === null) {
            child.kill('SIGKILL');
        }
        if (process.env.WS_LIMIT_TEST_DEBUG) {
            console.log(logs.join(''));
        }
    }
}

main().catch(error => {
    console.error('[ws-limits] FAIL:', error instanceof Error ? error.message : error);
    process.exit(1);
});
