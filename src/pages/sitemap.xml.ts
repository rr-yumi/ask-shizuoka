// /sitemap.xml（固定ページと microCMS の全記事。検索結果ページは載せない）
import type { APIRoute } from 'astro';
import { getPosts } from '../lib/microcms';

export const GET: APIRoute = async ({ site }) => {
	const posts = await getPosts();

	const pages = [
		{ path: '/', lastmod: posts[0]?.revisedAt ?? posts[0]?.publishedAt },
		{ path: '/list/', lastmod: posts[0]?.revisedAt ?? posts[0]?.publishedAt },
		{ path: '/about/' },
		{ path: '/contact/' },
		...posts.map((post) => ({ path: `/ask/${post.id}/`, lastmod: post.revisedAt ?? post.publishedAt })),
	];

	const urls = pages
		.map(({ path, lastmod }) => {
			const loc = `<loc>${new URL(path, site)}</loc>`;
			return `\t<url>${loc}${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
		})
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
	return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
