// middleware/adminMiddleware.js
const checkAdmin = async (req, res, next) => {
    try {
        // Verificar que existe req.usuario (viene del middleware checkAuth)
        if (!req.usuario) {
            return res.status(401).json({ 
                msg: 'No hay token válido' 
            });
        }

        // Verificar que el usuario tenga rol de admin
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({ 
                msg: 'No tienes permisos de administrador para acceder a esta ruta' 
            });
        }
        
        next();
    } catch (error) {
        console.error('Error en checkAdmin:', error);
        return res.status(500).json({ 
            msg: 'Error al verificar permisos de administrador' 
        });
    }
};

export default checkAdmin;