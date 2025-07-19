export default function EmailConfirmed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <h2 className="text-2xl font-bold mb-4">Email подтверждён!</h2>
        <p className="mb-4">Теперь вы можете войти в свой аккаунт.</p>
        <a href="/login" className="text-blue-600 underline">Перейти к входу</a>
      </div>
    </div>
  );
} 