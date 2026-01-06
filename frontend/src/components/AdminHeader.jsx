import { Link, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const AdminHeader = () => {
  const { auth, cerrarSesion } = useAuth()
  const location = useLocation()

  const handleLogout = () => {
    cerrarSesion()
  }

  // Navegación del admin
  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Usuarios', href: '/admin/usuarios', icon: '👥' },
    { name: 'Prompts', href: '/admin/prompts', icon: '💬' },
    { name: 'Contexto', href: '/admin/prompt-contexto', icon: '🧠' },
    { name: 'Términos Excluidos', href: '/admin/terminos-excluidos', icon: '🚫' },
  ]

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <Link to="/admin" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AirbnbBot Admin</h1>
                <p className="text-xs text-gray-500">Panel de administración</p>
              </div>
            </Link>
          </div>

          {/* Navegación principal */}
          <nav className="hidden md:flex items-center space-x-1">
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isActive(item.href)
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Menú de usuario */}
          <div className="flex items-center space-x-4">
            {/* Notificaciones (placeholder) */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Separador */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Información del usuario */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {auth?.nombre?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {auth?.nombre || 'Administrador'}
                </p>
                <p className="text-xs text-red-600 font-medium">
                  Administrador
                </p>
              </div>
            </div>

            {/* Botón de logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Navegación móvil */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 whitespace-nowrap ${
                  isActive(item.href)
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader