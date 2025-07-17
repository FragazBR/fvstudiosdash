export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-red-600">Acesso negado</h1>
        <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
      </div>
    </div>
  )
}
