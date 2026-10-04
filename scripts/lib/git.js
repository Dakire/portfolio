import { execFileSync } from 'node:child_process';
import { root } from './paths.js';

const NOW = new Date().toISOString();

/** Date et heure (ISO 8601 complète) du dernier commit touchant ces chemins ; maintenant s'ils ont des modifications non commitées. */
export function gitDate(...paths) {
  try {
    const git = (...args) => execFileSync('git', args, { cwd: root('.'), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (git('status', '--porcelain', '--', ...paths)) return NOW;
    return git('log', '-1', '--format=%cI', '--', ...paths) || NOW;
  } catch {
    return NOW;
  }
}
