import type { Page } from '@playwright/test';

/**
 * Choisit le papier du site avant la navigation. Le clair est le défaut (rien en mémoire) ; le sombre est un choix explicite
 * du visiteur (localStorage « theme »). Le système simulé suit le même thème : il ne doit de toute façon pas influencer le défaut.
 */
export async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript((value) => {
    try {
      if (value === 'dark') localStorage.setItem('theme', 'dark');
      else localStorage.removeItem('theme');
    } catch {
      // stockage indisponible : thème par défaut
    }
  }, theme);
  await page.emulateMedia({ colorScheme: theme });
}
