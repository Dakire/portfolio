// Appel à l'API Claude : un seul échange, réponse structurée (JSON) contenant l'article en français et en anglais.
import Anthropic from '@anthropic-ai/sdk';

export const MODEL = process.env.ARTICLE_MODEL || 'claude-opus-5-5';

const articleSchema = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    body: { type: 'string' },
  },
  required: ['slug', 'title', 'description', 'body'],
  additionalProperties: false,
};

export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    fr: articleSchema,
    en: articleSchema,
    claims_to_verify: { type: 'array', items: { type: 'string' } },
  },
  required: ['fr', 'en', 'claims_to_verify'],
  additionalProperties: false,
};

/**
 * Demande un article. Streaming (réponse longue) ; refus et troncature sont des erreurs explicites.
 * `fallbacks: "default"` : si les classificateurs de sécurité déclinent la demande, l'API la rejoue côté serveur sur le modèle de repli recommandé.
 * @returns {Promise<{ data: object, usage: object, model: string }>}
 */
export async function requestArticle({ system, user, client = new Anthropic() }) {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 32_000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') throw new Error(`Demande refusée par le modèle (${message.stop_details?.category ?? 'raison inconnue'}).`);
  if (message.stop_reason === 'max_tokens') throw new Error('Réponse tronquée (max_tokens atteint).');
  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  try {
    return { data: JSON.parse(text), usage: message.usage, model: message.model };
  } catch {
    throw new Error('La réponse du modèle n\'est pas du JSON valide.');
  }
}
