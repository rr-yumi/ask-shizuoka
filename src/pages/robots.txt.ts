// /robots.txt（サイトの URL は astro.config.mjs の site から作る）
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
	const body = ['User-agent: *', 'Allow: /', 'Disallow: /search/', '', `Sitemap: ${new URL('/sitemap.xml', site)}`, ''].join('\n');
	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
