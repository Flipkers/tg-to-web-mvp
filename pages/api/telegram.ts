import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getPhotoUrl(fileId: string, botToken: string): Promise<string | null> {
  const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;
  const resp = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const data = await resp.json();
  if (!data.ok) return null;
  const filePath = data.result.file_path;
  return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Логируем сырое сообщение из Telegram
  console.log('RAW TELEGRAM UPDATE:', JSON.stringify(req.body, null, 2));

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return res.status(500).json({ error: 'Bot token not set' });
  }

  try {
    const update = req.body;
    const msg = update.message;
    if (!msg || !msg.chat || msg.chat.type !== 'channel') {
      return res.status(200).json({ result: 'Not a channel post' });
    }

    const text = msg.text || msg.caption || '';
    const date = msg.date;
    const channel_id = msg.chat.id;
    let photo_url = null;
    if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      photo_url = await getPhotoUrl(fileId, TELEGRAM_BOT_TOKEN);
    }

    // Найти user_id по channel_id
    const { data: channel } = await supabase
      .from('channels')
      .select('user_id')
      .eq('channel_id', channel_id)
      .maybeSingle();
    const user_id = channel?.user_id || null;

    // Сохраняем пост в Supabase с user_id
    const { error } = await supabase.from('posts').insert([
      { text, date: new Date(date * 1000), channel_id, photo_url, user_id }
    ]);
    if (error) {
      console.error('Ошибка при сохранении в Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Ошибка в обработчике Telegram:', e);
    return res.status(200).json({ ok: false });
  }
} 