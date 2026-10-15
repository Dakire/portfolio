import { describe, expect, it } from 'vitest';
import { TOOL_GROUPS } from '../../src/tools/hub';
import { TOOLS } from '../../src/tools/registry';

describe('catégories de la page Outils', () => {
  it('chaque outil du registre figure dans un seul groupe, et aucun groupe ne cite un outil inconnu', () => {
    const grouped = TOOL_GROUPS.flatMap((g) => [...g.tools]);
    expect([...grouped].sort()).toEqual(TOOLS.map((t) => t.id).sort());
  });
});
