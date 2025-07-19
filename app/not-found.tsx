export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Página não encontrada</p>
        <a 
          href="/login" 
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Voltar ao Login
        </a>
      </div>
    </div>
  )
}
