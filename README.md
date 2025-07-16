# TgToWeb MVP

## Как запустить

1. Установи зависимости:
   ```bash
   npm install
   ```
2. В файле `src/pages/api/telegram.ts` вставь свой Telegram Bot Token:
   ```ts
   const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN';
   ```
3. Запусти Astro:
   ```bash
   npm run dev
   ```
4. Прокинь webhook через ngrok или другой сервис:
   ```bash
   ngrok http 4321
   ```
5. Установи webhook для Telegram:
   ```bash
   curl -F "url=https://<ngrok-url>/api/telegram" https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
   ```

## Как пользоваться

- Просто пересылай посты из каналов своему боту.
- Посты сохраняются в `posts.json`.
- После сохранения бот отвечает: `✅ Пост сохранён в блоге`. 

## 🚀 Деплой на Vercel

1. Зарегистрируйся на [vercel.com](https://vercel.com/) и подключи свой GitHub-репозиторий с этим проектом.
2. Деплой произойдёт автоматически (Astro поддерживается из коробки).
3. После деплоя получишь публичный адрес вида:
   ```
   https://your-vercel-project.vercel.app
   ```
4. Установи Telegram webhook:
   ```bash
   curl -F "url=https://your-vercel-project.vercel.app/api/telegram" https://api.telegram.org/bot<ТВОЙ_ТОКЕН>/setWebhook
   ```
5. Теперь Telegram будет слать запросы на твой Vercel endpoint!

**Важно:**
- Для секретов (токен бота) используй переменные окружения Vercel: Settings → Environment Variables → TELEGRAM_BOT_TOKEN
- Локальный posts.json на Vercel не будет сохраняться между деплоями! Для продакшена лучше использовать БД или облачное хранилище. 