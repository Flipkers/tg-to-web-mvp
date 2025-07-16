import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import fetch from 'node-fetch';

// === НАСТРОЙКИ ===
const TELEGRAM_BOT_TOKEN = import.meta.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const POSTS_PATH = 'posts.json';

declare global {
  interface ImportMetaEnv {
    readonly TELEGRAM_BOT_TOKEN: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

async function savePost(post: any) {
  let posts = [];
  try {
    const data = await fs.readFile(POSTS_PATH, 'utf-8');
    posts = JSON.parse(data);
  } catch {}
  posts.push(post);
  await fs.writeFile(POSTS_PATH, JSON.stringify(posts, null, 2), 'utf-8');
}

async function getPhotoUrl(fileId: string): Promise<string | null> {
  const resp = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const data = await resp.json() as any;
  if (!data.ok) return null;
  const filePath = data.result.file_path;
  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Получен запрос от Telegram!');
    const update = await request.json();
    console.log('Тело запроса:', JSON.stringify(update, null, 2));
    const msg = update.message;
    // Проверяем, что это пересланный пост из канала
    if (!msg || !msg.forward_from_chat || msg.forward_from_chat.type !== 'channel') {
      return new Response('Not a forwarded channel post', { status: 200 });
    }

    const text = msg.text || msg.caption || '';
    const date = msg.forward_date || msg.date;
    const channel_id = msg.forward_from_chat.id;
    let photo_url = null;
    if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
      // Берём самое большое фото
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      photo_url = await getPhotoUrl(fileId);
    }

    const post = { text, date, channel_id, photo_url };
    await savePost(post);

    // Ответ пользователю
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: msg.chat.id,
        text: '✅ Пост сохранён в блоге',
      }),
    });

    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error('Ошибка в обработчике Telegram:', e);
    return new Response('fail', { status: 200 }); // Не возвращай 403!
  }
}; 