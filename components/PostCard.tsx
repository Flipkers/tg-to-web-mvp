import Link from 'next/link';

function getTitle(post: any) {
  if (post.title && post.title.trim()) return post.title;
  if (!post.text) return 'Без заголовка';
  const match = post.text.match(/^(.+?[.!?])(?=\s|$)/);
  return match ? match[1] : post.text.slice(0, 60) + (post.text.length > 60 ? '…' : '');
}

export default function PostCard({ post }: { post: any }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-0 border border-gray-200 flex flex-col overflow-hidden transition max-w-md w-full mx-auto">
      <Link href={`/post/${post.id}`} className="block h-full">
        {post.photo_url ? (
          <img src={post.photo_url} alt="Фото" className="w-full h-48 object-cover bg-gray-100" />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-4xl text-gray-300">🖼️</div>
        )}
        <div className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">{post.date ? new Date(post.date).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</div>
            {post.category && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{post.category}</span>}
          </div>
          <div className="font-bold text-2xl text-gray-900 mb-1 line-clamp-2">{getTitle(post)}</div>
          <div className="text-gray-800 text-base line-clamp-3">{post.text?.length > 180 ? post.text.slice(0, 180) + '…' : post.text}</div>
        </div>
      </Link>
    </div>
  );
} 