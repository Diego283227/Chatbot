// ChatbotLayout.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import clienteAxios from '../config/axios';

const ChatbotLayout = ({ children }) => {
  const { auth, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Cargar conversaciones
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await clienteAxios.get('/conversations');
        setConversations(data.data);
      } catch (error) {
        console.error('Error al cargar conversaciones:', error);
      }
    };
    
    fetchConversations();
  }, []);

  const handleNewConversation = async () => {
    try {
      const { data } = await clienteAxios.post('/conversations');
      navigate(`/chat/${data.data.id}`);
    } catch (error) {
      console.error('Error al crear conversación:', error);
    }
  };

  const handleLogout = () => {
    cerrarSesion();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar con animación */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-800">
            <button 
              onClick={handleNewConversation}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-white">Nueva conversación</span>
              </div>
              <span className="text-gray-500 group-hover:text-gray-300">⌘N</span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Hoy
              </p>
              {conversations.filter(c => {
                const today = new Date().toDateString();
                return new Date(c.fecha_actualizacion).toDateString() === today;
              }).map(conv => (
                <Link
                  key={conv.id}
                  to={`/chat/${conv.id}`}
                  className="block w-full text-left px-3 py-2 rounded-lg mb-1 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <p className="text-sm truncate">
                        {conv.ultima_pregunta || 'Nueva conversación'}
                      </p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </Link>
              ))}
              
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
                Anteriores
              </p>
              {conversations.filter(c => {
                const today = new Date().toDateString();
                return new Date(c.fecha_actualizacion).toDateString() !== today;
              }).map(conv => (
                <Link
                  key={conv.id}
                  to={`/chat/${conv.id}`}
                  className="block w-full text-left px-3 py-2 rounded-lg mb-1 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {conv.ultima_pregunta || 'Conversación'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(conv.fecha_actualizacion).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar conversaciones
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">
                        {auth?.nombre?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="truncate">{auth?.nombre || 'Usuario'}</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg shadow-lg py-1">
                    <Link
                      to="/admin/perfil"
                      className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      to="/admin/configuracion"
                      className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Configuración
                    </Link>
                    <hr className="my-1 border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors lg:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="ml-4 text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                VetBot Assistant
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Claude-3</option>
                <option>GPT-4</option>
              </select>
            </div>
          </div>
        </header>

        {/* Content Area - Aquí se renderiza el componente hijo */}
        {children}
      </div>
    </div>
  );
};

export default ChatbotLayout;