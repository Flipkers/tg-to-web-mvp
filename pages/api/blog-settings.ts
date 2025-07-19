import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PATCH') {
    const { title, description, avatar_url, user_id } = req.body;
    if (!title && !description && !avatar_url) return res.status(400).json({ error: 'No data to update' });
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const { error } = await supabase
      .from('blog_settings')
      .update({ title, description, avatar_url, updated_at: new Date().toISOString() })
      .eq('user_id', user_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  if (req.method === 'GET') {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const { data, error } = await supabase
      .from('blog_settings')
      .select('title, description, avatar_url')
      .eq('user_id', user_id)
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  res.status(405).end();
} 