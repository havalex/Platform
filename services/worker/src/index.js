/**
 * Forge Worker — background jobs (publish static, module install, backups).
 * Phase 1: health stub. Connect Redis queue in phase 4.
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log(`⚙️  Forge Worker started (redis: ${REDIS_URL})`);
console.log('   Jobs: publish-static, install-module, backup — implement in phase 4');

setInterval(() => {
  // heartbeat for docker healthcheck
}, 30_000);
