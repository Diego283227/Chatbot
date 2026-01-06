import { useState, useEffect, createContext } from 'react';
import clienteAxios from '../config/axios';
import Swal from 'sweetalert2';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [cargando, setCargando] = useState(true);
    const [auth, setAuth] = useState({});

    useEffect(() => {
        const autenticarUsuario = async () => {
            const token = localStorage.getItem('token');
            const usuarioGuardado = localStorage.getItem('usuario');
                        
            if (!token) {
                setCargando(false);
                return;
            }

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            try {
                const { data } = await clienteAxios('/usuarios/perfil', config);
                                
                // Si hay datos guardados del usuario, incluir el rol
                if (usuarioGuardado) {
                    const usuario = JSON.parse(usuarioGuardado);
                    data.rol = usuario.rol || 'usuario';
                }
                                
                setAuth(data);
            } catch (error) {
                console.log(error.response?.data?.msg);
                setAuth({});
                                
                // Si hay error de autenticación, limpiar localStorage
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('usuario');
                }
            }

            setCargando(false);
        };

        autenticarUsuario();
    }, []);

    // 🔥 FUNCIÓN DE CERRAR SESIÓN CON CONFIRMACIÓN
    const cerrarSesion = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: "¿Estás seguro que deseas cerrar tu sesión actual?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            backdrop: true,
            allowOutsideClick: false,
            customClass: {
                popup: 'rounded-lg',
                title: 'text-gray-800 font-semibold',
                content: 'text-gray-600',
                confirmButton: 'font-medium px-4 py-2 rounded-lg',
                cancelButton: 'font-medium px-4 py-2 rounded-lg'
            }
        });

        // Si el usuario confirma, proceder con el cierre de sesión
        if (result.isConfirmed) {
            try {
                // Mostrar loading mientras se cierra la sesión
                Swal.fire({
                    title: 'Cerrando sesión...',
                    text: 'Por favor espera un momento',
                    icon: 'info',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    timer: 1000,
                    timerProgressBar: true,
                    customClass: {
                        popup: 'rounded-lg',
                        title: 'text-gray-800 font-semibold',
                        content: 'text-gray-600'
                    }
                });

                // Limpiar datos después del timer
                setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('usuario');
                    setAuth({});
                    
                    // Mensaje de despedida
                    Swal.fire({
                        title: '¡Hasta pronto!',
                        text: 'Tu sesión se ha cerrado correctamente',
                        icon: 'success',
                        timer: 2000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'rounded-lg',
                            title: 'text-gray-800 font-semibold',
                            content: 'text-gray-600'
                        }
                    });
                }, 1000);

            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un problema al cerrar la sesión',
                    icon: 'error',
                    confirmButtonColor: '#ef4444',
                    customClass: {
                        popup: 'rounded-lg',
                        title: 'text-gray-800 font-semibold',
                        content: 'text-gray-600',
                        confirmButton: 'font-medium px-4 py-2 rounded-lg'
                    }
                });
            }
        }
        // Si cancela, no hacer nada (el modal se cierra automáticamente)
    };

    // 🔥 FUNCIÓN SIMPLE PARA CERRAR SESIÓN SIN CONFIRMACIÓN (por si la necesitas)
    const cerrarSesionDirecto = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setAuth({});
    };

    const actualizarPerfil = async (datos) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setCargando(false);
            return;
        }

        const config = {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        };

        try {
            const url = `/usuarios/perfil/${datos._id}`;
            await clienteAxios.put(url, datos, config);
                        
            // Actualizar el estado y localStorage
            const usuarioActualizado = { ...auth, ...datos };
            setAuth(usuarioActualizado);
                        
            localStorage.setItem('usuario', JSON.stringify({
                _id: usuarioActualizado._id,
                nombre: usuarioActualizado.nombre,
                email: usuarioActualizado.email,
                rol: usuarioActualizado.rol
            }));
                        
            return {
                msg: 'Perfil actualizado correctamente',
                error: false
            };
        } catch (error) {
            return {
                msg: error.response?.data?.msg || 'Error al actualizar perfil',
                error: true
            };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                auth,
                setAuth,
                cargando,
                cerrarSesion,
                cerrarSesionDirecto, // Por si necesitas cerrar sin confirmación
                actualizarPerfil
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export {
    AuthProvider
};

export default AuthContext;