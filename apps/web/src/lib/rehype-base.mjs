// Plugin rehype : préfixe les liens et images internes des articles (« /outils/dns/ ») par la base du site
// (« /preprod » en préproduction). Sans effet en production, où la base est vide.

export default function rehypeBase({ base = '' } = {}) {
  const prefix = base.replace(/\/$/, '');
  return (tree) => {
    if (!prefix) return;
    const walk = (node) => {
      if (node.type === 'element') {
        for (const key of ['href', 'src']) {
          const value = node.properties?.[key];
          if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//'))
            node.properties[key] = prefix + value;
        }
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
