import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id, email, username, first_name, last_name, telegram_id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    // Проверяем, есть ли уже такой пользователь
    const { data: existing, error: selectUserError } = await supabase.from('users').select('id').eq('id', id).single();
    if (selectUserError && selectUserError.code !== 'PGRST116') {
      console.error('Select user error:', selectUserError);
      return res.status(500).json({ error: selectUserError.message });
    }
    if (!existing) {
      const insertObj: any = { id };
      if (email) insertObj.email = email;
      if (username) insertObj.username = username;
      if (first_name) insertObj.first_name = first_name;
      if (last_name) insertObj.last_name = last_name;
      if (telegram_id) insertObj.telegram_id = telegram_id;
      const { error: userError } = await supabase.from('users').insert([insertObj]);
      if (userError) {
        console.error('Insert user error:', userError);
        return res.status(500).json({ error: userError.message });
      }
    }
    // Проверяем, есть ли уже blog_settings для этого пользователя
    const { data: blog, error: selectBlogError } = await supabase.from('blog_settings').select('id').eq('user_id', id).maybeSingle(); // исправлено на maybeSingle
    if (selectBlogError) {
      console.error('Select blog_settings error:', selectBlogError);
      return res.status(500).json({ error: selectBlogError.message });
    }
    if (!blog) {
      const { error: blogError } = await supabase.from('blog_settings').insert([{ user_id: id, title: 'Мой блог' }]);
      if (blogError) {
        console.error('Insert blog_settings error:', blogError);
        return res.status(500).json({ error: blogError.message });
      }
    }
    return res.status(201).json({ ok: true });
  } catch (e: any) {
    console.error('Unexpected error in user-init:', e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
} 