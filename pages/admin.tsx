import { useState, useEffect, useRef } from 'react';
import PostCard from '../components/PostCard';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  // Blog settings state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ok = localStorage.getItem('admin_auth') === '1';
      setAuth(ok);
    }
  }, []);

  useEffect(() => {
    if (auth) {
      setLoading(true);
      fetch('/api/blog-settings')
        .then(res => res.json())
        .then(data => {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setAvatar(data.avatar_url || '');
        })
        .finally(() => setLoading(false));
    }
  }, [auth]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      localStorage.setItem('admin_auth', '1');
      setAuth(true);
      setError('');
    } else {
      setError('Неверный пароль');
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin_auth');
    setAuth(false);
    setInput('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    let avatar_url = avatar;
    // Если выбрана новая аватарка — загружаем в Supabase Storage
    if (avatarFile) {
      const formData = new FormData();
      formData.append('file', avatarFile);
      const upload = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      const res = await upload.json();
      if (res.url) avatar_url = res.url;
    }
    await fetch('/api/blog-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, avatar_url }),
    });
    setAvatar(avatar_url);
    setAvatarFile(null);
    setSaving(false);
  }

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow max-w-xs w-full flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2">Вход в админку</h2>
          <input
            type="password"
            className="border rounded px-3 py-2"
            placeholder="Пароль"
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition">Войти</button>
        </form>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Загрузка…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="bg-white rounded-xl shadow p-8 border border-gray-200 flex flex-col gap-10 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Настройки блога</h2>
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-900 text-sm">Выйти</button>
        </div>
        <form className="flex flex-col gap-4 max-w-2xl" onSubmit={handleSave}>
          <label className="flex flex-col gap-2">
            <span className="font-semibold text-gray-900">Аватарка блога</span>
            <div className="flex items-center gap-4">
              {avatar || avatarFile ? (
                <img
                  src={avatarFile ? URL.createObjectURL(avatarFile) : avatar}
                  alt="Аватарка"
                  className="w-16 h-16 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400">🧑‍💻</div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm text-gray-900">Выбрать файл</button>
              {avatar && (
                <button type="button" onClick={() => { setAvatar(''); setAvatarFile(null); }} className="text-xs text-red-500 ml-2">Удалить</button>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) setAvatarFile(e.target.files[0]);
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-gray-900">Название блога</span>
            <input
              type="text"
              className="border rounded px-3 py-2 bg-white text-gray-900"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-gray-900">Описание блога</span>
            <textarea
              className="border rounded px-3 py-2 bg-white text-gray-900"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition mt-2" disabled={saving}>{saving ? 'Сохраняю…' : 'Сохранить'}</button>
        </form>
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Рубрики (категории)</h3>
          <CategoryManager />
        </div>
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Посты</h3>
          <PostCategoryManager />
        </div>
      </div>
    </div>
  );
}

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editId, setEditId] = useState<number|null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);
  async function fetchCategories() {
    setLoading(true);
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }
  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    });
    setName(''); setSlug(''); setSaving(false); fetchCategories();
  }
  async function startEdit(cat: any) {
    setEditId(cat.id); setEditName(cat.name); setEditSlug(cat.slug);
  }
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, name: editName, slug: editSlug }),
    });
    setEditId(null); setEditName(''); setEditSlug(''); setSaving(false); fetchCategories();
  }
  async function delCategory(id: number) {
    if (!confirm('Удалить рубрику?')) return;
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchCategories();
  }
  return (
    <div>
      <form onSubmit={addCategory} className="flex gap-2 mb-4">
        <input type="text" className="border rounded px-2 py-1" placeholder="Название" value={name} onChange={e => setName(e.target.value)} required />
        <input type="text" className="border rounded px-2 py-1" placeholder="slug" value={slug} onChange={e => setSlug(e.target.value)} required />
        <button type="submit" className="bg-blue-600 text-white rounded px-3 py-1 font-semibold hover:bg-blue-700 transition" disabled={saving}>Добавить</button>
      </form>
      {loading ? <div className="text-gray-400">Загрузка…</div> : (
        <ul className="space-y-2">
          {categories.map((cat: any) => (
            <li key={cat.id} className="flex items-center gap-2">
              {editId === cat.id ? (
                <form onSubmit={saveEdit} className="flex gap-2 items-center">
                  <input type="text" className="border rounded px-2 py-1" value={editName} onChange={e => setEditName(e.target.value)} required />
                  <input type="text" className="border rounded px-2 py-1" value={editSlug} onChange={e => setEditSlug(e.target.value)} required />
                  <button type="submit" className="bg-green-600 text-white rounded px-2 py-1 text-sm">Сохранить</button>
                  <button type="button" onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-700 text-sm">Отмена</button>
                </form>
              ) : (
                <>
                  <span className="font-semibold">{cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.slug}</span>
                  <button onClick={() => startEdit(cat)} className="text-blue-600 hover:underline text-xs">Редактировать</button>
                  <button onClick={() => delCategory(cat.id)} className="text-red-500 hover:underline text-xs">Удалить</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PostCategoryManager() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string|null>(null);
  useEffect(() => {
    fetchPosts();
    fetch('/api/categories').then(r => r.json()).then(setCategories);
  }, []);
  async function fetchPosts() {
    setLoading(true);
    const res = await fetch('/api/admin-posts');
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }
  async function changeCategory(postId: string, category: string) {
    setSavingId(postId);
    await fetch('/api/admin-posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId, category }),
    });
    setSavingId(null);
    fetchPosts();
  }
  return (
    <div>
      {loading ? <div className="text-gray-400">Загрузка…</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {posts.map((post: any) => (
            <div key={post.id} className="relative">
              <PostCard post={post} />
              <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded shadow p-1">
                <select
                  className="border rounded px-2 py-1 bg-white text-gray-900 text-sm"
                  value={post.category || ''}
                  onChange={e => changeCategory(post.id, e.target.value)}
                  disabled={savingId === post.id}
                >
                  <option value="">Без рубрики</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 