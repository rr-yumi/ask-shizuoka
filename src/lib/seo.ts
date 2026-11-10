// SEO 用の共通設定

import type { Post } from './microcms';

export const SITE_NAME = 'Ask Shizuoka';

export const DEFAULT_DESCRIPTION =
	'Real travel questions about eastern Shizuoka — Izu, Mt. Fuji, Mishima, Numazu, Gotenba and Atami — answered by a local who has lived here for over 30 years.';

export const DEFAULT_OG_IMAGE = '/img/index/hero.webp';

// HTML を取り除いて max 文字までの説明文にする（単語の途中では切らない）
export function plainText(html: string, max = 160): string {
	const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, '')}…`;
}

// 記事の説明文（description が空なら本文の冒頭）
export function postDescription(post: Post): string {
	return plainText(post.description || post.content);
}

// SNS 用の画像（microCMS の画像変換で 1200×630 に切り抜く）
export function postOgImage(post: Post): string {
	return post.eyecatch ? `${post.eyecatch.url}?fm=jpg&w=1200&h=630&fit=crop` : DEFAULT_OG_IMAGE;
}
