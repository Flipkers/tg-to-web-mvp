import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';

const POSTS_PATH = 'posts.json';

async function savePost(post: any) {
  let posts = [];
  try {
    const data = await fs.readFile(POSTS_PATH, 'utf-8');
    posts = JSON.parse(data);
  } catch {}
  posts.push(post);
  await fs.writeFile(POSTS_PATH, JSON.stringify(posts, null, 2), 'utf-8');
}

async function getPhotoUrl(fileId: string, TELEGRAM_BOT_TOKEN: string) {
  const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
  const resp = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const data = await resp.json();
  if (!data.ok) return null;
  const filePath = data.result.file_path;
  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return res.status(500).json({ error: 'Bot token not set' });
  }
  const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
  try {
    const update = req.body;
    console.log('Тело запроса:', JSON.stringify(update, null, 2));
    const msg = update.message;
    if (!msg || !msg.forward_from_chat || msg.forward_from_chat.type !== 'channel') {
      return res.status(200).json({ result: 'Not a forwarded channel post' });
    }
    const text = msg.text || msg.caption || '';
    const date = msg.forward_date || msg.date;
    const channel_id = msg.forward_from_chat.id;
    let photo_url = null;
    if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      photo_url = await getPhotoUrl(fileId, TELEGRAM_BOT_TOKEN);
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
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Ошибка в обработчике Telegram:', e);
    return res.status(200).json({ ok: false });
  }
} 