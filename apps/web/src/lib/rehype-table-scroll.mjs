// Plugin rehype : enveloppe chaque <table> d'un conteneur défilant atteignable au clavier (WCAG 2.1.1, règle axe scrollable-region-focusable).
// La langue de l'étiquette est déduite du chemin du fichier (les articles anglais sont dans un dossier « en/»).

const LABELS = { fr: 'Tableau (défilement horizontal)', en: 'Table (scrolls horizontally)' };

export default function rehypeTableScroll() {
  return (tree, file) => {
    const lang = /[\\/]en[\\/]/.test(file.path ?? '') ? 'en' : 'fr';
    const wrap = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        wrap(child);
        if (child.type !== 'element' || child.tagName !== 'table') return child;
        return {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['table-scroll'],
            tabIndex: 0,
            role: 'region',
            ariaLabel: LABELS[lang],
          },
          children: [child],
        };
      });
    };
    wrap(tree);
  };
}
