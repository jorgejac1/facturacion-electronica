'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Credenciales inválidas')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  function quickLogin(quickEmail: string, quickPassword: string) {
    setEmail(quickEmail)
    setPassword(quickPassword)
    setLoading(true)
    setError('')
    signIn('credentials', {
      email: quickEmail,
      password: quickPassword,
      redirect: false,
    }).then((result) => {
      if (result?.error) {
        setError('Credenciales inválidas')
        setLoading(false)
      } else {
        router.push('/dashboard')
      }
    })
  }

  const demoUsers = [
    { label: 'Admin', email: 'admin@shp.gob.mx', password: 'admin123', role: 'Administrador' },
    { label: 'Operador', email: 'operador@shp.gob.mx', password: 'operador123', role: 'Operador' },
    { label: 'Consultor', email: 'consultor@shp.gob.mx', password: 'operador123', role: 'Consultor' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-xl mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Facturación Electrónica</h1>
            <p className="text-gray-500 mt-1">Sistema de Timbrado CFDI</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-gray-900 bg-white"
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-gray-900 bg-white"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">Acceso rápido (demo)</p>
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  disabled={loading}
                  onClick={() => quickLogin(user.email, user.password)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.label}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Sistema de Timbrado CFDI — SHP
        </p>
      </div>
    </div>
  )
}
