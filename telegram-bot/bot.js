const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL; // например, https://yourdomain.com/api/claim-channel

const bot = new Telegraf(BOT_TOKEN);

bot.command('claim', async (ctx) => {
  const chat = ctx.chat;
  const userIdFromCommand = ctx.message.text.split(' ')[1];

  // Удалить команду пользователя быстро
  setTimeout(() => {
    ctx.deleteMessage(ctx.message.message_id).catch(() => {});
  }, 300);

  console.log('Получена команда /claim:', {
    userIdFromCommand,
    chatId: chat.id,
    chatTitle: chat.title,
    from: ctx.from,
    messageId: ctx.message.message_id
  });

  if (!userIdFromCommand) {
    console.log('Нет userId в команде /claim');
    return;
  }

  try {
    const member = await ctx.telegram.getChatMember(chat.id, ctx.botInfo.id);
    console.log('Права бота в чате:', member.status);
    if (member.status !== 'administrator' && member.status !== 'creator') {
      console.log('Бот не админ в этом чате!');
      return;
    }
  } catch (e) {
    console.log('Ошибка проверки прав бота:', e);
    return;
  }

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userIdFromCommand,
        channel_id: chat.id,
        channel_title: chat.title,
      }),
    });
    let data = null;
    try { data = await resp.json(); } catch {}
    console.log('Ответ от API:', resp.status, data);
  } catch (e) {
    console.log('Ошибка запроса к API:', e);
  }
});

bot.launch();
console.log('✅ Telegram-бот успешно запущен!'); 