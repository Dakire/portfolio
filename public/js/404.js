// Page 404 : tire une excuse au hasard (le HTML contient déjà la première, la page reste complète sans JavaScript).
(() => {
  const target = document.getElementById('excuse');
  const source = document.getElementById('excuses');
  if (!target || !source) return;
  try {
    const excuses = JSON.parse(source.textContent);
    target.textContent = excuses[Math.floor(Math.random() * excuses.length)];
  } catch {
    // on garde l'excuse par défaut
  }
})();
