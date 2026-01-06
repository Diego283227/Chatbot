// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthLayout from './layout/AuthLayout'
import Login from './paginas/Login'
import Registrar from './paginas/Registrar'
import Chat from './paginas/chat/Chat'
import RecuperarCuenta from './paginas/Recuperar-cuenta'
import { AuthProvider } from './context/AuthProvider'
import ConfirmarCuenta from './paginas/ConfirmarCuenta'
import RutaProtegida from './secure/RutaProtegida'
import RutaProtegidaAdmin from './secure/RutaProtegidaAdmin'
import RestablecerPassword from './paginas/ReestablecerPassword'
import Perfil from './paginas/Perfil'
import PromptsAdmin from './paginas/admin/AdminPrompts'
import AdminDashboard from './paginas/admin/AdminDashboard'
import UsuariosAdmin from './paginas/admin/UsuariosAdmin'
import LayoutSinSidebar from './layout/LayoutsinSidebar'
import PromptContextoAdmin from './paginas/admin/PromptContextoAdmin'
import TerminosExcluidosAdmin from './paginas/admin/TerminosExcluidos'


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Login />} />
            <Route path="registrar" element={<Registrar />} />
            <Route path="recuperar-cuenta" element={<RecuperarCuenta />} />
            <Route path="confirmar/:token" element={<ConfirmarCuenta />} />
            <Route path="olvide-password/:token" element={<RestablecerPassword/>} />
          </Route>
                   
          <Route element={<RutaProtegida />}>
          {/* Rutas de chat - REQUIEREN sidebar */}
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
        </Route>
          
        <Route element={<LayoutSinSidebar />}>
        <Route path="/perfil" element={<Perfil />} />
         {/* <Route path="/configuracion" element={<Configuracion />} /> */}
         {/* <Route path="/ayuda" element={<Ayuda />} /> */}
         {/* <Route path="/privacidad" element={<Privacidad />} /> */}
      </Route>
          
          {/* Rutas protegidas para admin */}
          <Route element={<RutaProtegidaAdmin />}>
            {/* Descomenta estas rutas cuando tengas los componentes listos */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/prompts" element={<PromptsAdmin />} />
            <Route path="/admin/usuarios" element={<UsuariosAdmin />} />
            <Route path="/admin/prompt-contexto" element={<PromptContextoAdmin />} />
            <Route path="/admin/terminos-excluidos" element={<TerminosExcluidosAdmin />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App