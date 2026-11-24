import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { coversUpdate, refreshLicence, verifyLicence } from '../src/licence.js';

// Jetons signés par le portail PHP (LicenceSigner) avec la clé RÉSERVÉE AUX TESTS de apps/portal/phpunit.xml.dist :
// la vérification JavaScript doit accepter exactement ce que produit le serveur.
const TEST_PUBLIC_KEY = 'VV9GnCIYjpABW92FuIlnjUWfhr349700lxsQubOFhgk=';
const PHP_PERPETUAL =
  'GRL1.eyJ2IjoxLCJraWQiOiI3MTg1N2QxZCIsImxpYyI6IkdSLVRFU1QtUEVSUC1FVFVFLUxMRTIiLCJwcm9kIjoicHJldmVuZXotbW9pLXJ1cHR1cmUiLCJwbGFuIjoibGljZW5jZSIsImlhdCI6MTc5NTAwMDAwMCwiZXhwIjpudWxsLCJ1cGQiOjE4MjY1MzYwMDB9.6H-5LFDklEcf08S0_inL5eBNd6UvXKon2eTjJFX_3RS3uiffqc0dd_YmnbnfXVSXkAeGew3mtdHuN7pvKFnWBg';
const PHP_SUBSCRIPTION =
  'GRL1.eyJ2IjoxLCJraWQiOiI3MTg1N2QxZCIsImxpYyI6IkdSLVRFU1QtQUJPTi1ORU1FLU5UMjIiLCJwcm9kIjoieW91dHViZS1yZWdhcmRlci1wbHVzLXRhcmQiLCJwbGFuIjoicHJvIiwiaWF0IjoxNzk1MDAwMDAwLCJleHAiOjE3OTU2MDQ4MDAsInVwZCI6bnVsbH0.I-J2axagpIB5GRNkXwj_IGbqvro05vrwxFcAGLn1Hr8TqByNbuJdgpFoE_3dTPsYzLWsXUHCKLQmGKNX-JRvAA';

const b64url = (buffer) => Buffer.from(buffer).toString('base64url');

/** Jeton signé par une autre clé (Node), même format que le serveur. */
function forge(payload) {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const body = b64url(JSON.stringify(payload));
  const signature = sign(null, Buffer.from(`GRL1.${body}`), privateKey);
  const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
  return {
    token: `GRL1.${body}.${b64url(signature)}`,
    publicKey: Buffer.from(raw).toString('base64'),
  };
}

describe('vérification hors ligne', () => {
  it('accepte un jeton perpétuel signé par le portail PHP', async () => {
    const check = await verifyLicence(PHP_PERPETUAL, {
      publicKey: TEST_PUBLIC_KEY,
      product: 'prevenez-moi-rupture',
      now: 1795000100,
    });
    expect(check).toMatchObject({ valid: true, reason: 'ok', needsRefresh: false });
    expect(check.payload?.lic).toBe('GR-TEST-PERP-ETUE-LLE2');
    expect(coversUpdate(check.payload, 1826536000)).toBe(true);
    expect(coversUpdate(check.payload, 1826536001)).toBe(false);
  });

  it('refuse un autre produit, une signature d’une autre clé et un jeton altéré', async () => {
    const options = {
      publicKey: TEST_PUBLIC_KEY,
      product: 'prevenez-moi-rupture',
      now: 1795000100,
    };
    expect(
      (await verifyLicence(PHP_PERPETUAL, { ...options, product: 'standup-slack' })).reason,
    ).toBe('produit');
    const other = forge({
      v: 1,
      kid: 'x',
      lic: 'GR-A',
      prod: 'prevenez-moi-rupture',
      plan: 'licence',
      iat: 1,
      exp: null,
      upd: null,
    });
    expect((await verifyLicence(other.token, options)).reason).toBe('signature');
    const [prefix, body, signature] = PHP_PERPETUAL.split('.');
    const tampered = `${prefix}.${body.slice(0, -2)}fQ.${signature}`;
    expect((await verifyLicence(tampered, options)).valid).toBe(false);
    expect((await verifyLicence('pas un jeton', options)).reason).toBe('format');
  });

  it('abonnement : valable jusqu’à l’échéance, à renouveler à l’approche, refusé ensuite', async () => {
    const options = { publicKey: TEST_PUBLIC_KEY, product: 'youtube-regarder-plus-tard' };
    expect(await verifyLicence(PHP_SUBSCRIPTION, { ...options, now: 1795000100 })).toMatchObject({
      valid: true,
      needsRefresh: false,
    });
    expect(
      await verifyLicence(PHP_SUBSCRIPTION, { ...options, now: 1795604800 - 3600 }),
    ).toMatchObject({ valid: true, needsRefresh: true });
    expect(await verifyLicence(PHP_SUBSCRIPTION, { ...options, now: 1795604800 })).toMatchObject({
      valid: false,
      reason: 'expiree',
      needsRefresh: true,
    });
  });

  it('demande un renouvellement quand le jeton a plus de 7 jours', async () => {
    const check = await verifyLicence(PHP_PERPETUAL, {
      publicKey: TEST_PUBLIC_KEY,
      product: 'prevenez-moi-rupture',
      now: 1795000000 + 8 * 86400,
    });
    expect(check).toMatchObject({ valid: true, needsRefresh: true });
  });
});

describe('renouvellement', () => {
  const reply = (status, body) => async () => new Response(JSON.stringify(body), { status });

  it('renvoie le nouveau jeton, null si la licence ne vaut plus rien, et lève si le site est injoignable', async () => {
    expect(
      await refreshLicence('t', { fetch: reply(200, { statut: 'active', jeton: 'GRL1.nouveau' }) }),
    ).toBe('GRL1.nouveau');
    expect(await refreshLicence('t', { fetch: reply(410, { statut: 'revoked' }) })).toBeNull();
    expect(
      await refreshLicence('t', { fetch: reply(401, { erreur: 'jeton invalide' }) }),
    ).toBeNull();
    await expect(refreshLicence('t', { fetch: reply(503, {}) })).rejects.toThrow('503');
  });

  it('appelle l’API avec le jeton dans l’en-tête Authorization', async () => {
    let seen;
    await refreshLicence('GRL1.abc', {
      api: 'https://exemple.test/api',
      fetch: async (url, init) => {
        seen = { url, auth: init.headers.Authorization };
        return new Response(JSON.stringify({ jeton: 'x' }), { status: 200 });
      },
    });
    expect(seen).toEqual({
      url: 'https://exemple.test/api/licence/renouveler',
      auth: 'Licence GRL1.abc',
    });
  });
});
