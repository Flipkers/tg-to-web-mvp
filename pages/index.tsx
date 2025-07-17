import { createClient } from '@supabase/supabase-js';
import type { GetServerSideProps } from 'next';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! // Для SSR можно использовать anon_key
);

export const getServerSideProps: GetServerSideProps = async () => {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  return {
    props: {
      posts: posts || [],
      error: error ? error.message : null,
    },
  };
};

export default function Blog({ posts, error }: any) {
  return (
    <html>
      <head>
        <title>Блог из Telegram</title>
        <meta charSet="utf-8" />
      </head>
      <body>
        <h1>Блог из Telegram</h1>
        {error && <div style={{color: 'red'}}>Ошибка: {error}</div>}
        <ul>
          {posts.map((post: any) => (
            <li key={post.id} style={{marginBottom: 24}}>
              <div><b>Дата:</b> {post.date ? new Date(post.date).toLocaleString() : '—'}</div>
              <div><b>Канал:</b> {post.channel_id}</div>
              <div><b>Текст:</b> {post.text}</div>
              {post.photo_url && <div><img src={post.photo_url} alt="Фото" style={{maxWidth: 400}} /></div>}
            </li>
          ))}
        </ul>
      </body>
    </html>
  );
}
