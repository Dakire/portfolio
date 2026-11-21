import type { Page } from '@playwright/test';

/**
 * Choisit le papier du site avant la navigation. Le sombre est le défaut (rien en mémoire) ; le clair est un choix explicite
 * du visiteur (localStorage « theme »). Le système simulé suit le même thème : il ne doit de toute façon pas influencer le défaut.
 */
export async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript((value) => {
    try {
      if (value === 'light') localStorage.setItem('theme', 'light');
      else localStorage.removeItem('theme');
    } catch {
      // stockage indisponible : thème par défaut
    }
  }, theme);
  await page.emulateMedia({ colorScheme: theme });
}
