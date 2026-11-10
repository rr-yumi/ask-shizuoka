// DeepL API で記事を日本語 → 英語に翻訳する（ビルド時）
// 翻訳結果は translations.json に保存し、原文が変わったときだけ翻訳し直す

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

type Fields = { title: string; description: string; content: string };
type CacheEntry = Fields & { hash: string };

const CACHE_FILE = 'translations.json';
const deeplKey = import.meta.env.DEEPL_API_KEY;

// 無料プランのキーは末尾が「:fx」で、API の URL が違う
const endpoint = deeplKey?.endsWith(':fx')
	? 'https://api-free.deepl.com/v2/translate'
	: 'https://api.deepl.com/v2/translate';

const cache: Record<string, CacheEntry> = existsSync(CACHE_FILE)
	? JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
	: {};

// 同じビルド中に同じ記事を二重に翻訳しないため
const pending = new Map<string, Promise<Fields>>();

// HTML 用の文字参照（&quot; など）を普通の文字に戻す
function decodeEntities(text: string): string {
	return text
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

// タイトル・説明文はプレーンテキストとして返す（保存済みの訳にも適用）
function toPlain(fields: Fields): Fields {
	return { ...fields, title: decodeEntities(fields.title), description: decodeEntities(fields.description) };
}

async function deepl(texts: string[], html: boolean): Promise<string[]> {
	const res = await fetch(endpoint, {
		method: 'POST',
		headers: {
			Authorization: `DeepL-Auth-Key ${deeplKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			text: texts,
			source_lang: 'JA',
			target_lang: 'EN-US',
			// 本文はリッチエディタの HTML タグを保ったまま訳す
			...(html && { tag_handling: 'html' }),
		}),
	});
	if (!res.ok) {
		// 403: キーが違う / 456: 今月の無料枠（50 万字）を使い切った、など
		throw new Error(`DeepL の翻訳に失敗しました（${res.status}）: ${await res.text()}`);
	}
	const data: { translations: { text: string }[] } = await res.json();
	return data.translations.map((t) => t.text);
}

export async function translatePost(id: string, source: Fields): Promise<Fields> {
	if (!deeplKey) {
		// 本番ビルドで日本語のまま公開されないよう止める。開発中は日本語のまま表示
		if (import.meta.env.PROD) throw new Error('.env に DEEPL_API_KEY を設定してください');
		console.warn('[translate] DEEPL_API_KEY がないため日本語のまま表示します');
		return source;
	}

	const hash = createHash('sha256').update(JSON.stringify(source)).digest('hex');
	const cached = cache[id];
	if (cached?.hash === hash) return toPlain(cached);

	const key = `${id}:${hash}`;
	if (!pending.has(key)) {
		pending.set(key, (async () => {
			const [title, description] = await deepl([source.title, source.description], false);
			const [content] = await deepl([source.content], true);
			const result = toPlain({ title, description, content });
			cache[id] = { ...result, hash };
			writeFileSync(CACHE_FILE, JSON.stringify(cache, null, '\t') + '\n');
			console.log(`[translate] 翻訳しました: ${id}`);
			return result;
		})());
	}
	return pending.get(key)!;
}
