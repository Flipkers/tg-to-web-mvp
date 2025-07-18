import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id, email } = req.body;
  if (!id || !email) return res.status(400).json({ error: 'id and email required' });
  // Проверяем, есть ли уже такой пользователь
  const { data: existing } = await supabase.from('users').select('id').eq('id', id).single();
  if (existing) return res.status(200).json({ ok: true, already: true });
  // Создаём пользователя
  const { error } = await supabase.from('users').insert([{ id, email }]);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ ok: true });
} 