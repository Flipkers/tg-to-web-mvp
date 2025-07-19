import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Telegraf } from 'telegraf';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id, channel } = req.body;
  if (!user_id || !channel) return res.status(400).json({ error: 'user_id and channel required' });

  try {
    // Пробуем отправить сообщение в канал
    const sent = await bot.telegram.sendMessage(channel, 'Канал успешно привязан к вашему аккаунту!');
    console.log('Ответ sendMessage:', JSON.stringify(sent, null, 2));
    // Сразу удаляем сообщение через 500 мс
    setTimeout(() => {
      bot.telegram.deleteMessage(channel, sent.message_id).catch(() => {});
    }, 500);
    // Только если сообщение отправлено — сохраняем в базу
    const { error: upsertError } = await supabase.from('channels').upsert({
      user_id,
      channel_id: sent.chat.id,
      channel_title: (sent.chat as any).title || '',
      channel_username: channel,
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'channel_id' });
    if (upsertError) {
      console.error('Ошибка upsert в channels:', upsertError);
      return res.status(500).json({ error: upsertError.message });
    }
    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error('Ошибка отправки сообщения ботом:', e);
    return res.status(400).json({ error: e.message });
  }
} 