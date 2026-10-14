// Liens entre compétences, réalisations et le reste du site (articles, outils, cheatsheets).
// Les articles sont désignés par le slug français ; la version anglaise est retrouvée par `translationOf`.
import { getPosts, postPath, type Post } from '../lib/blog';
import type { Lang } from '../lib/i18n';
import { refPath, refsFor } from '../reference/refs';
import { TOOLS, toolPath, toolUi } from '../tools/registry';
import type { SkillId } from './profile';

export interface Related {
  posts?: string[];
  tools?: string[];
  refs?: string[];
}

export const SKILL_RELATED: Record<SkillId, Related> = {
  network: {
    posts: ['touches-bios-uefi-boot-menu-par-marque'],
    tools: ['subnet'],
    refs: ['active-directory', 'reseau', 'linux-proxmox', 'evenements-windows'],
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
    posts: ['fin-support-windows-10-passer-a-windows-11', 'touches-bios-uefi-boot-menu-par-marque'],
    refs: ['windows-11', 'evenements-windows'],
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
  'pc-sur-mesure': { posts: ['touches-bios-uefi-boot-menu-par-marque'] },
  'automatisation-scripts': { refs: ['powershell-m365', 'gam', 'git-claude-code'] },
};

export interface ResolvedLink {
  label: string;
  href: string;
}
export interface ResolvedRelated {
  posts: ResolvedLink[];
  tools: ResolvedLink[];
  refs: ResolvedLink[];
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
    refs: (related.refs ?? []).flatMap((id) => {
      const ref = refs.find((r) => r.id === id);
      return ref ? [{ label: ref.h1, href: refPath(ref) }] : [];
    }),
  };
}

export const hasRelated = (r: ResolvedRelated) =>
  r.posts.length + r.tools.length + r.refs.length > 0;
