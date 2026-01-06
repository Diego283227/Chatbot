import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const Header = ({
  sidebarOpen,
  setSidebarOpen,
  showSidebarToggle = true,
  className = "" // Prop para clases adicionales
}) => {
  const { auth, cerrarSesion } = useAuth()

  const handleLogout = () => {
    cerrarSesion()
  }

  return (
    <header className={`bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between relative z-30 ${className}`}>
      {/* ☝️ CLAVE: z-30 siempre, más className personalizable */}
      
      {/* Lado izquierdo */}
      <div className="flex items-center space-x-4">
        {/* Botón para toggle sidebar - Solo si se debe mostrar */}
        {showSidebarToggle && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        {/* Logo/Título */}
        <Link to="/chat" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-800">AirbnbBot</span>
        </Link>
      </div>

      {/* Lado derecho */}
      <div className="flex items-center space-x-4">
        {/* Navegación rápida */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/chat"
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Chat
          </Link>
          <Link
            to="/perfil"
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Perfil
          </Link>
        </nav>

        {/* Menú de usuario */}
        <div className="relative flex items-center space-x-3">
          {/* Avatar y nombre */}
          <Link
            to="/perfil"
            className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {auth?.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {auth?.nombre || 'Usuario'}
            </span>
          </Link>

          {/* Botón de logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header