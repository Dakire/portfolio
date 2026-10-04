import { describe, expect, it } from 'vitest';
import { toIso } from '../../scripts/lib/dates.js';

describe('toIso', () => {
  it('applique le décalage horaire d\'hiver (UTC+1)', () => {
    expect(toIso('2026-01-15')).toBe('2026-01-15T00:00:00+01:00');
  });

  it('applique le décalage horaire d\'été (UTC+2)', () => {
    expect(toIso('2026-07-15')).toBe('2026-07-15T00:00:00+02:00');
  });

  it('gère le jour du changement d\'heure de printemps (30 mars 2025)', () => {
    // À midi UTC ce jour-là, Paris est déjà en heure d'été.
    expect(toIso('2025-03-30')).toBe('2025-03-30T00:00:00+02:00');
  });

  it('laisse une date déjà complète intacte', () => {
    expect(toIso('2026-07-15T10:00:00Z')).toBe('2026-07-15T10:00:00Z');
  });
});
