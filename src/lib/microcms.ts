// microCMS から記事を取得する

import { translatePost } from './translate';

// 管理画面の「API 設定 → 基本情報 → エンドポイント」と同じ名前にする
const ENDPOINT = 'ask';

export type Image = {
	url: string;
	width: number;
	height: number;
};

// カテゴリーは「セレクト」なら文字列の配列、「コンテンツ参照」なら name を持つオブジェクトで返ってくる
type Category = string[] | { name: string } | null;

export type Post = {
	id: string;
	title: string;
	description?: string;
	category?: Category;
	eyecatch?: Image;
	content: string; // リッチエディタの HTML
	publishedAt: string;
};

type ListResponse<T> = {
	contents: T[];
	totalCount: number;
	offset: number;
	limit: number;
};

const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY;

async function request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
	if (!serviceDomain || !apiKey) {
		throw new Error('.env に MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を設定してください');
	}

	const url = new URL(`https://${serviceDomain}.microcms.io/api/v1/${path}`);
	url.search = new URLSearchParams(params).toString();

	const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': apiKey } });
	if (!res.ok) {
		// 401: API キーが違う / 404: エンドポイント名が違う、など
		const detail = await res.text();
		throw new Error(`microCMS の取得に失敗しました（${res.status}）: ${url.pathname} ${detail}`);
	}
	return res.json();
}

// 新しい順に記事を取得し、英語に翻訳して返す（limit は最大 100）
export async function getPosts(limit = 100): Promise<Post[]> {
	const data = await request<ListResponse<Post>>(ENDPOINT, {
		limit: String(limit),
		orders: '-publishedAt',
	});

	// DeepL の同時リクエスト制限にかからないよう 1 件ずつ翻訳
	const posts: Post[] = [];
	for (const post of data.contents) {
		const en = await translatePost(post.id, {
			title: post.title,
			description: post.description ?? '',
			content: post.content ?? '',
		});
		posts.push({ ...post, ...en });
	}
	return posts;
}

// カテゴリーの表示名
export function categoryName(category: Category | undefined): string {
	if (!category) return '';
	if (Array.isArray(category)) return category[0] ?? '';
	return category.name;
}

// カード用に説明文を max 文字までに切る（英語なので単語の途中では切らない）
export function excerpt(text: string, max = 120): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, '')}…`;
}

// 投稿日付（例: 2026.10.19）
export function formatDate(iso: string): string {
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}
