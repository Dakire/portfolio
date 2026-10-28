// Liens entre compétences, réalisations et le reste du site (articles, outils, cheatsheets).
// Les articles sont désignés par le slug français ; la version anglaise est retrouvée par `translationOf`.
import { getPosts, postPath, type Post } from '../lib/blog';
import { projectPath, type Lang } from '../lib/i18n';
import { PORTFOLIO_DATA } from './content';
import { refIdFor, refPath, refsFor } from '../reference/refs';
import { TOOLS, toolPath, toolUi } from '../tools/registry';
import type { SkillId } from './profile';

export interface Related {
  posts?: string[];
  tools?: string[];
  refs?: string[];
  /** Slugs de réalisations. */
  projects?: string[];
}

export const SKILL_RELATED: Record<SkillId, Related> = {
  network: {
    tools: ['subnet'],
    refs: ['active-directory', 'reseau', 'linux-proxmox', 'evenements-windows', 'bios-uefi'],
  },
  security: {
    posts: [
      'securiser-microsoft-365-google-workspace-reglages-de-base',
      'spf-dkim-dmarc-expliques',
    ],
    tools: ['password', 'email-headers'],
  },
  messaging: {
    posts: [
      'migration-messagerie-google-workspace-microsoft-365',
      'delivrabilite-diagnostiquer-mails-spam-rejetes',
      'diagnostic-dns-dig-nslookup-propagation-ttl',
      'spf-dkim-dmarc-expliques',
    ],
    tools: ['dns', 'propagation', 'email-headers'],
    refs: ['powershell-m365', 'gam'],
  },
  training: {},
  dev: { tools: ['json', 'encoder', 'seo', 'sitemap'], refs: ['git-claude-code'] },
  support: {
    posts: ['fin-support-windows-10-passer-a-windows-11'],
    refs: ['windows-11', 'evenements-windows', 'bios-uefi'],
  },
};

export const PROJECT_RELATED: Record<string, Related> = {
  'homelab-proxmox': { refs: ['linux-proxmox', 'reseau'], tools: ['subnet'] },
  'deploiement-windows-server': { refs: ['active-directory', 'windows-11', 'evenements-windows'] },
  'migrations-messagerie': {
    posts: [
      'migration-messagerie-google-workspace-microsoft-365',
      'delivrabilite-diagnostiquer-mails-spam-rejetes',
      'spf-dkim-dmarc-expliques',
    ],
    tools: ['dns', 'propagation', 'email-headers'],
    refs: ['powershell-m365', 'gam'],
  },
  'support-n1-n3': {
    posts: ['fin-support-windows-10-passer-a-windows-11'],
    refs: ['windows-11', 'evenements-windows'],
  },
  'pc-sur-mesure': { refs: ['bios-uefi'] },
  'automatisation-scripts': { refs: ['powershell-m365', 'gam', 'git-claude-code'] },
};

/** Liens depuis une cheatsheet (identifiants français) vers les articles, outils et autres cheatsheets qui la complètent. */
export const REF_RELATED: Record<string, Related> = {
  gam: {
    posts: [
      'migration-messagerie-google-workspace-microsoft-365',
      'securiser-microsoft-365-google-workspace-reglages-de-base',
    ],
    tools: ['email-headers', 'dns'],
    refs: ['powershell-m365'],
  },
  'powershell-m365': {
    posts: [
      'securiser-microsoft-365-google-workspace-reglages-de-base',
      'migration-messagerie-google-workspace-microsoft-365',
    ],
    tools: ['email-headers'],
    refs: ['gam'],
  },
  'windows-11': {
    posts: ['fin-support-windows-10-passer-a-windows-11'],
    refs: ['evenements-windows', 'bios-uefi', 'active-directory'],
  },
  'active-directory': { refs: ['evenements-windows', 'reseau', 'windows-11'] },
  reseau: { tools: ['dns', 'propagation', 'subnet'], refs: ['linux-proxmox', 'windows-11'] },
  'linux-proxmox': { tools: ['subnet'], refs: ['reseau'] },
  'git-claude-code': { tools: ['json'] },
  'bios-uefi': {
    posts: ['fin-support-windows-10-passer-a-windows-11'],
    refs: ['windows-11'],
  },
  'evenements-windows': { refs: ['active-directory', 'windows-11'] },
};

/** Article (slug français) -> outils et cheatsheets à proposer en fin d'article (le sens inverse de `tools` et `refs` ci-dessus). */
export const POST_RELATED: Record<string, Related> = {
  'spf-dkim-dmarc-expliques': { tools: ['dns', 'email-headers'] },
  'diagnostic-dns-dig-nslookup-propagation-ttl': {
    tools: ['dns', 'propagation'],
    refs: ['reseau'],
  },
  'delivrabilite-diagnostiquer-mails-spam-rejetes': { tools: ['email-headers', 'dns'] },
  'migration-messagerie-google-workspace-microsoft-365': {
    tools: ['dns', 'propagation'],
    refs: ['powershell-m365', 'gam'],
  },
  'securiser-microsoft-365-google-workspace-reglages-de-base': {
    tools: ['password'],
    refs: ['powershell-m365', 'gam'],
  },
  'fin-support-windows-10-passer-a-windows-11': { refs: ['windows-11', 'bios-uefi'] },
  'faille-uefi-pxe-edk2-cve-2026-97631': { refs: ['bios-uefi', 'windows-11'] },
  'cyberattaque-frigos-supermarches-controleurs-froid': { tools: ['subnet'], refs: ['reseau'] },
};

/** Cheatsheet -> réalisations où ces commandes servent. */
export const REF_PROJECTS: Record<string, string[]> = {
  gam: ['migrations-messagerie', 'automatisation-scripts'],
  'powershell-m365': ['migrations-messagerie', 'automatisation-scripts'],
  'windows-11': ['support-n1-n3', 'deploiement-windows-server'],
  'active-directory': ['deploiement-windows-server'],
  reseau: ['homelab-proxmox'],
  'linux-proxmox': ['homelab-proxmox'],
  'git-claude-code': ['creation-web', 'automatisation-scripts'],
  'bios-uefi': ['pc-sur-mesure', 'support-n1-n3'],
  'evenements-windows': ['support-n1-n3'],
};

export interface ResolvedLink {
  label: string;
  href: string;
}
export interface ResolvedRelated {
  posts: ResolvedLink[];
  tools: ResolvedLink[];
  refs: ResolvedLink[];
  projects: ResolvedLink[];
}

/** Transforme des identifiants en liens dans la langue demandée ; ce qui n'existe pas dans cette langue est omis. */
export async function resolveRelated(lang: Lang, related: Related = {}): Promise<ResolvedRelated> {
  const posts = await getPosts(lang);
  const pick = (slug: string): Post | undefined =>
    lang === 'fr'
      ? posts.find((p) => p.slug === slug)
      : posts.find((p) => p.data.translationOf === slug);
  const refs = refsFor(lang);
  return {
    posts: (related.posts ?? []).flatMap((slug) => {
      const post = pick(slug);
      return post ? [{ label: post.data.title, href: postPath(lang, post.slug) }] : [];
    }),
    tools: (related.tools ?? []).flatMap((id) => {
      const tool = TOOLS.find((t) => t.id === id);
      return tool ? [{ label: toolUi(tool, lang).name, href: toolPath(tool, lang) }] : [];
    }),
    projects: (related.projects ?? []).flatMap((slug) => {
      const project = PORTFOLIO_DATA[lang].projects.find((p) => p.slug === slug);
      return project ? [{ label: project.title, href: projectPath(lang, project.slug) }] : [];
    }),
    refs: (related.refs ?? []).flatMap((id) => {
      const ref = refs.find((r) => r.id === refIdFor(lang, id));
      return ref ? [{ label: ref.h1, href: refPath(ref) }] : [];
    }),
  };
}

export const hasRelated = (r: ResolvedRelated) =>
  r.posts.length + r.tools.length + r.refs.length + r.projects.length > 0;
