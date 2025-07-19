import { GetServerSideProps } from 'next';
import Link from 'next/link';
import PostCard from '../../components/PostCard';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { user_id } = ctx.params!;
  const supa = require('@supabase/supabase-js');
  const supabaseSrv = supa.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  let posts = [];
  let blogTitle = 'Блог пользователя';
  let blogAvatar = '';
  let error = null;

  if (user_id) {
    const { data: userPosts, error: postsError } = await supabaseSrv.from('posts').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
    posts = userPosts || [];
    error = postsError ? postsError.message : null;
    const { data: settings } = await supabaseSrv.from('blog_settings').select('*').eq('user_id', user_id).order('id', { ascending: true }).limit(1).single();
    blogTitle = settings?.title || 'Блог пользователя';
    blogAvatar = settings?.avatar_url || '';
  }
  return {
    props: {
      posts,
      error,
      blogTitle,
      blogAvatar,
      userId: user_id,
    },
  };
};

export default function UserBlog({ posts, error, blogTitle: initialTitle, blogAvatar, userId }: any) {
  const latest = posts[0];
  const rest = posts.slice(1);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [currentUser, setCurrentUser] = useState<string|null>(null);
  const [currentEmail, setCurrentEmail] = useState<string|null>(null);
  const [blogTitle, setBlogTitle] = useState(initialTitle);
  const [showTitleModal, setShowTitleModal] = useState(initialTitle === 'Мой блог');
  const [newTitle, setNewTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data?.user?.id || null);
      setCurrentEmail(data?.user?.email || null);
    });
  }, []);
  const filteredPosts = selectedCat === 'all' ? rest : rest.filter((p: any) => p.category === selectedCat);
  const isOwner = currentUser === userId;

  async function saveTitle(e: React.FormEvent) {
    e.preventDefault();
    setSavingTitle(true);
    await fetch('/api/blog-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, user_id: userId }),
    });
    window.location.reload(); // reload для актуализации blogTitle и скрытия модалки
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 md:px-0 text-gray-900">
      {/* Модалка для ввода названия блога */}
      {isOwner && showTitleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form onSubmit={saveTitle} className="bg-white rounded-xl shadow p-8 flex flex-col gap-4 min-w-[320px] max-w-sm w-full">
            <h2 className="text-xl font-bold mb-2">Как назвать ваш блог?</h2>
            <input
              type="text"
              className="border rounded px-3 py-2"
              placeholder="Название блога"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              autoFocus
            />
            <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition" disabled={savingTitle || !newTitle.trim()}>
              {savingTitle ? 'Сохраняю…' : 'Сохранить'}
            </button>
          </form>
        </div>
      )}
      {/* Header */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex items-center gap-4">
          {blogAvatar ? (
            <img src={blogAvatar} alt="Аватарка" className="w-12 h-12 rounded-full object-cover border border-gray-300" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400">🧑‍💻</div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{blogTitle}</h1>
        </div>
        {isOwner ? (
          <div className="flex items-center gap-4">
            {currentEmail && <span className="text-gray-600 text-sm">{currentEmail}</span>}
            <Link href="/admin" className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold shadow hover:bg-gray-300 transition">Настройки</Link>
            <button onClick={handleLogout} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Выйти</button>
          </div>
        ) : (
          <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Зарегистрироваться / Войти</Link>
        )}
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
      {/* Пустой блог */}
      {posts.length === 0 && (
        <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-xl shadow text-center text-lg text-gray-700">
          <div className="mb-2 font-bold text-2xl">Блог пока пуст</div>
          {isOwner ? (
            <div className="mb-4">Чтобы наполнить его, отправьте 5-10 постов нашему Telegram-боту:<br /><span className="font-mono text-blue-600">@yourbot</span></div>
          ) : (
            <div className="mb-4 text-gray-500">Постов пока нет</div>
          )}
          <div className="text-gray-500 text-sm">Посты появятся здесь автоматически после отправки</div>
        </div>
      )}
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