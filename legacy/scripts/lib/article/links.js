// Vérifie que les liens externes cités existent : un modèle peut inventer une adresse plausible. Le résultat alimente le rapport
// de la PR (rien ne bloque : certains sites refusent les requêtes automatiques) ; c'est au relecteur de trancher.

const check = async (url, fetchImpl, timeoutMs) => {
  const attempt = async (method) => {
    const response = await fetchImpl(url, { method, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': 'grichard.eu article check (+https://grichard.eu)' } });
    return response.status;
  };
  try {
    let status = await attempt('HEAD');
    if (status === 405 || status === 403 || status === 501) status = await attempt('GET'); // certains serveurs refusent HEAD
    return { url, status, ok: status >= 200 && status < 400 };
  } catch (error) {
    return { url, status: 0, ok: false, error: error.name === 'TimeoutError' ? 'délai dépassé' : error.cause?.code ?? error.message };
  }
};

/** @returns {Promise<{ url: string, status: number, ok: boolean, error?: string }[]>} */
export async function checkLinks(urls, { fetchImpl = fetch, timeoutMs = 10_000 } = {}) {
  return Promise.all([...new Set(urls)].map((url) => check(url, fetchImpl, timeoutMs)));
}
