import { createClient } from '@supabase/supabase-js';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();
  return {
    props: {
      post: post || null,
      error: error ? error.message : null,
    },
  };
};

function getTitle(post: any) {
  if (post.title && post.title.trim()) return post.title;
  if (!post.text) return 'Без заголовка';
  const match = post.text.match(/^(.+?[.!?])(?=\s|$)/);
  return match ? match[1] : post.text.slice(0, 60) + (post.text.length > 60 ? '…' : '');
}

export default function PostPage({ post, error }: any) {
  if (error) {
    return <div className="max-w-2xl mx-auto py-10 text-center text-red-600">Ошибка: {error}</div>;
  }
  if (!post) {
    return <div className="max-w-2xl mx-auto py-10 text-center text-gray-500">Пост не найден</div>;
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 md:px-0">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 border border-gray-200">
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:underline text-sm">← На главную</Link>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs text-gray-400">{post.date ? new Date(post.date).toISOString().replace('T', ' ').slice(0, 16) : '—'}</div>
          {post.category && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{post.category}</span>}
        </div>
        <div className="font-bold text-2xl mb-3 text-gray-900">{getTitle(post)}</div>
        {post.photo_url && <img src={post.photo_url} alt="Фото" className="rounded-lg max-w-full mb-4" />}
        <div className="text-gray-800 whitespace-pre-line mb-6">{post.text}</div>
      </div>
    </div>
  );
} 