// E2E test runner.
//
// Why this wrapper exists: the e2e suite boots a fresh NestJS app per spec file,
// and each boot opens new Postgres connections whose host (`localhost`) is resolved
// via dns.lookup on the libuv threadpool. Native bcrypt (auth register/login, cost
// 12) runs on that same threadpool, and at its default size of 4 it starves the DNS
// resolution needed for cold DB connections — surfacing as intermittent HTTP 401s
// (the JWT-validation query fails to get a connection in time). Raising
// UV_THREADPOOL_SIZE removes the contention. It must be set before the Node process
// starts, so we set it here and spawn jest as a child.
const { spawnSync } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const jestBin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  isWin ? 'jest.cmd' : 'jest',
);

const args = [
  '--config',
  'test/jest-e2e.json',
  '--runInBand',
  ...process.argv.slice(2),
];

const result = spawnSync(jestBin, args, {
  stdio: 'inherit',
  shell: isWin, // .cmd shim requires a shell on Windows
  env: { ...process.env, UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || '64' },
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
