import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  const { data, error } = await supabase.from('channels').select('*').eq('user_id', user_id).eq('status', 'confirmed').order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ channel: data });
} 