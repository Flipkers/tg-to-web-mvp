import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const update = req.body;
    const msg = update.message;
    if (!msg || !msg.forward_from_chat || msg.forward_from_chat.type !== 'channel') {
      return res.status(200).json({ result: 'Not a forwarded channel post' });
    }

    const text = msg.text || msg.caption || '';
    const date = msg.forward_date || msg.date;
    const channel_id = msg.forward_from_chat.id;
    let photo_url = null;
    if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
      // Можно реализовать получение ссылки на фото через Telegram API, если нужно
      photo_url = null;
    }

    // Сохраняем пост в Supabase
    const { error } = await supabase.from('posts').insert([
      { text, date: new Date(date * 1000), channel_id, photo_url }
    ]);
    if (error) {
      console.error('Ошибка при сохранении в Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    // Ответ пользователю (опционально)
    // ...код для ответа в Telegram...

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Ошибка в обработчике Telegram:', e);
    return res.status(200).json({ ok: false });
  }
} 