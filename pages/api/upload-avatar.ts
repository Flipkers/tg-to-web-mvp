import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const busboy = require('busboy');
  const bb = busboy({ headers: req.headers });
  let fileBuffer = Buffer.from([]);
  let fileName = '';

  bb.on('file', (name: string, file: any, info: any) => {
    fileName = Date.now() + '-' + info.filename.replace(/[^a-zA-Z0-9.]/g, '_');
    file.on('data', (data: Buffer) => {
      fileBuffer = Buffer.concat([fileBuffer, data]);
    });
  });

  bb.on('finish', async () => {
    if (!fileBuffer.length) return res.status(400).json({ error: 'No file' });
    const { error } = await supabase.storage.from('blog-public').upload('avatar/' + fileName, fileBuffer, {
      contentType: 'image/png',
      upsert: true,
    });
    if (error) return res.status(500).json({ error: error.message });
    const { data } = supabase.storage.from('blog-public').getPublicUrl('avatar/' + fileName);
    return res.status(200).json({ url: data.publicUrl });
  });

  req.pipe(bb);
} 