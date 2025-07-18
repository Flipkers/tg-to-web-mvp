import { createClient } from '@supabase/supabase-js';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import PostCard from '../components/PostCard';
import { useState, useEffect } from 'react';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const getServerSideProps: GetServerSideProps = async () => {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  const { data: settings } = await supabase
    .from('blog_settings')
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .single();
  return {
    props: {
      posts: posts || [],
      error: error ? error.message : null,
      blogTitle: settings?.title || 'Мой блог',
      blogAvatar: settings?.avatar_url || '',
    },
  };
};

export default function Blog({ posts, error, blogTitle, blogAvatar }: any) {
  const latest = posts[0];
  const rest = posts.slice(1);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
  }, []);
  const filteredPosts = selectedCat === 'all' ? rest : rest.filter((p: any) => p.category === selectedCat);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(blogTitle);
  const [saving, setSaving] = useState(false);

  async function saveTitle() {
    setSaving(true);
    await fetch('/api/blog-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 md:px-0 text-gray-900">
      {/* Header */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex items-center gap-4">
          {blogAvatar ? (
            <img src={blogAvatar} alt="Аватарка" className="w-12 h-12 rounded-full object-cover border border-gray-300" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400">🧑‍💻</div>
          )}
          {editing ? (
            <div className="flex gap-2 items-center">
              <input
                className="border rounded px-2 py-1 text-lg font-bold"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={saving}
                autoFocus
              />
              <button onClick={saveTitle} disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">{saving ? '...' : 'Сохранить'}</button>
              <button onClick={() => { setEditing(false); setTitle(blogTitle); }} className="text-gray-400 hover:text-gray-600 text-sm">Отмена</button>
            </div>
          ) : (
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight cursor-pointer" onClick={() => setEditing(true)} title="Редактировать название">{title}</h1>
          )}
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Подписаться</button>
      </div>
      {/* Latest post */}
      {latest && (
        <div className="max-w-6xl mx-auto mb-12 p-8 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-1/3 w-full flex justify-center items-center">
            {latest.photo_url ? (
              <img src={latest.photo_url} alt="Фото" className="rounded-lg w-full max-w-xs object-cover" />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-5xl text-gray-300">🖼️</div>
            )}
          </div>
          <div className="md:w-2/3 w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xs text-gray-500">{latest.date ? new Date(latest.date).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</div>
              {latest.category && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{latest.category}</span>}
            </div>
            <Link href={`/post/${latest.id}`} className="font-bold text-2xl md:text-3xl mb-2 hover:underline">{latest.title || 'Без заголовка'}</Link>
            <div className="text-gray-800 text-lg mb-2 line-clamp-4">{latest.text}</div>
            <Link href={`/post/${latest.id}`} className="text-blue-600 hover:underline text-sm font-semibold mt-auto">Читать полностью →</Link>
          </div>
        </div>
      )}
      {/* Категории фильтра */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap gap-2">
        <button onClick={() => setSelectedCat('all')} className={`px-3 py-1 rounded-full border ${selectedCat==='all'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-200'} transition`}>Все</button>
        {categories.map((cat: any) => (
          <button key={cat.id} onClick={() => setSelectedCat(cat.name)} className={`px-3 py-1 rounded-full border ${selectedCat===cat.name?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-200'} transition`}>
            {cat.name}
          </button>
        ))}
      </div>
      {/* Grid of other posts */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-12">
        {filteredPosts.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {error && <div className="text-red-600 text-center mt-8">Ошибка: {error}</div>}
    </div>
  );
}
