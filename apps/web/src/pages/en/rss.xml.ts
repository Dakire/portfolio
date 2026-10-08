import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { PORTFOLIO_DATA } from '../../data/content';
import { getPosts, postPath } from '../../lib/blog';

export async function GET(context: APIContext) {
  const posts = await getPosts('en');
  return rss({
    title: PORTFOLIO_DATA.en.blog.siteName,
    description: PORTFOLIO_DATA.en.blog.pageDescription,
    site: context.site ?? 'https://grichard.eu',
    customData: '<language>en-GB</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postPath('en', post.slug),
      categories: post.data.tags,
    })),
  });
}
