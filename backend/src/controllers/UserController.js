import Usuarios from "../models/Usuario.js";
import generarId from "../helpers/GenerarId.js";
import generarJWT from "../helpers/GenerarJWT.js";
import emailRegistro from "../helpers/emailRegistro.js";
import emailOlvidePassword from "../helpers/emailOlvidePassword.js";
import TerminosExcluidosAdmin from "../models/TerminsExcluidos.js";

const registrar = async (req, res) => {
    const {email, nombre } = req.body;
    // Prevenir Usuarios registrados
    const existeUsuario = await Usuarios.findOne({ email });

    if (existeUsuario) {
        const error = new Error("Usuario ya registrado");
        return res.status(400).json({msg: error.message});
    }

    try { 
        // Registrar usuario (por defecto será 'user')
        const usuario = new Usuarios(req.body);
        const UsuarioGuardado = await usuario.save();

        // Enviar el Email
        emailRegistro({
            email,
            nombre,
            token: UsuarioGuardado.token,
        })

        res.json(UsuarioGuardado);

    } catch (error) {
        console.log(error);
    }
}

const perfil = (req, res) => {
    const { usuario } = req;
    
    res.json(usuario);
}

// Confirmar la cuenta del usuario 
const confirmar = async (req, res) => {
    const { token } = req.params;

    const usuarioConfirmar = await Usuarios.findOne({ token });

    if(!usuarioConfirmar) {
        const error = new Error('Token no Valido');
        return res.status(404).json({ msg: error.message });
    }
    
    try {
        usuarioConfirmar.token = null;
        usuarioConfirmar.confirmado = true;
        await usuarioConfirmar.save()

        res.json({ msg: "Usuario confirmado correctamente" })
    } catch (error) {
        console.log(error);
    }
};

const autenticar = async (req, res) => {
    const { email, password} = req.body
    
    // Comprobamos si existe el usuario 
    const usuario = await Usuarios.findOne({email})

    if (!usuario) {
        const error = new Error('El Usuario no Existe');
        return res.status(404).json({ msg: error.message });
    }
    
    // Comprobar si el usuario está confirmado 
    if(!usuario.confirmado) {
        const error = new Error("Tu cuenta no está confirmada");
        return res.status(403).json({msg: error.message})
    }

    // Revisar el password 
    if (await usuario.comprobarPassword(password)) {
        // Autenticar con jwt incluyendo el rol
        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol, // Incluimos el rol en la respuesta
            token: generarJWT(usuario.id, usuario.rol) // Pasamos el rol al JWT
        });
        
    } else {
        const error = new Error("Password Incorrecto");
        return res.status(403).json({ msg: error.message })
    }
};

// 🔥 FUNCIÓN CORREGIDA: olvidePassword
const olvidePassword = async(req, res) => {
    const { email } = req.body;

    const existeUsuario = await Usuarios.findOne({email})
    if(!existeUsuario) {
        const error = new Error('El usuario no existe');
        return res.status(404).json({ msg: error.message})
    }
    
    try {
        // Generar nuevo token
        existeUsuario.token = generarId();
        await existeUsuario.save();

        // Enviar Email con las Instrucciones (con manejo de errores)
        try {
            await emailOlvidePassword({
                email,
                nombre: existeUsuario.nombre,
                token: existeUsuario.token
            });
            
            console.log('✅ Email de recuperación enviado a:', email);
            res.json({
                success: true,
                msg: "Hemos enviado un email con las instrucciones para restablecer tu contraseña"
            });
            
        } catch (emailError) {
            console.error('❌ Error al enviar email:', emailError);
            
            // Limpiar el token si no se pudo enviar el email
            existeUsuario.token = null;
            await existeUsuario.save();
            
            return res.status(500).json({ 
                success: false,
                msg: "Error al enviar el email. Por favor, inténtalo de nuevo más tarde." 
            });
        }

    } catch (error) {
        console.error('❌ Error en olvidePassword:', error);
        res.status(500).json({ 
            success: false,
            msg: "Error interno del servidor" 
        });
    }
}

// 🔥 FUNCIÓN CORREGIDA: comprobarToken
const comprobarToken = async (req, res) => {
    const { token } = req.params;

    try {
        const usuario = await Usuarios.findOne({ token });
        
        if(usuario){  
            // Verificamos que el token sea válido
            res.json({ 
                success: true,
                msg: "Token válido y el usuario existe",
                usuario: {
                    _id: usuario._id,
                    nombre: usuario.nombre,
                    email: usuario.email
                }
            });

        } else {
            const error = new Error('Token no válido o expirado');
            return res.status(404).json({ 
                success: false,
                msg: error.message 
            });
        }
    } catch (error) {
        console.error('❌ Error en comprobarToken:', error);
        res.status(500).json({ 
            success: false,
            msg: "Error interno del servidor" 
        });
    }
}

// 🔥 FUNCIÓN CORREGIDA: nuevoPassword
const nuevoPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // Validar que se envió la contraseña
    if (!password) {
        return res.status(400).json({ 
            success: false,
            msg: "La contraseña es requerida" 
        });
    }

    // Validar longitud mínima
    if (password.length < 6) {
        return res.status(400).json({ 
            success: false,
            msg: "La contraseña debe tener al menos 6 caracteres" 
        });
    }

    try {
        const usuario = await Usuarios.findOne({ token });
        
        if(!usuario) {
            const error = new Error('Token no válido o expirado');
            return res.status(404).json({ 
                success: false,
                msg: error.message 
            });
        }

        // Actualizar contraseña y limpiar token
        usuario.token = null;
        usuario.password = password;
        await usuario.save();
        
        console.log('✅ Contraseña actualizada para usuario:', usuario.email);
        
        res.json({ 
            success: true,
            msg: "Contraseña restablecida correctamente" 
        });
        
    } catch (error) {
        console.error('❌ Error en nuevoPassword:', error);
        res.status(500).json({ 
            success: false,
            msg: "Error interno del servidor" 
        });
    }
};

const actualizarPerfil = async (req, res) => {
    const usuario = await Usuarios.findById(req.params.id);
    if(!usuario){
        const error = new Error('Hubo un Error')
        return res.status(400).json({msg: error.message})
    }
    
    const { email } = req.body
    if(usuario.email !== req.body.email){
        const existeEmail = await Usuarios.findOne({email})
        if(existeEmail){
            const error = new Error('Email en Uso')
            return res.status(400).json({ msg: error.message })
        }
    }
    
    try {
        usuario.nombre = req.body.nombre;
        usuario.email = req.body.email;
        usuario.web = req.body.web;
        usuario.telefono = req.body.telefono;

        const usuarioActualizado = await usuario.save()
        res.json(usuarioActualizado);
    } catch (error) {
        console.log(error);
    }
}
   
const actualizarPassword = async (req, res) => {
    // Leemos los datos
    const { id } = req.usuario
    const {pwd_actual, pwd_nuevo} = req.body

    // Comprobamos que el usuario exista
    const usuario = await Usuarios.findById(id);
    if (!usuario) {
        const error = new Error('Hubo un Error')
        return res.status(400).json({ msg: error.message })
    }
    
    // Comprobamos su password
    if(await usuario.comprobarPassword(pwd_actual)){
        // Almacenar el nuevo password
        usuario.password = pwd_nuevo;
        await usuario.save()
        res.json({ msg: "Password Almacenado Correctamente"})
        
    } else {
        const error = new Error('El Password Actual es Incorrecto')
        return res.status(400).json({ msg: error.message })
    }
}

// Nueva función para cambiar rol (solo admin puede hacerlo)
const cambiarRol = async (req, res) => {
    const { userId, nuevoRol } = req.body;
    
    // Verificar que el usuario que hace la petición es admin
    if (req.usuario.rol !== 'admin') {
        const error = new Error('No tienes permisos para realizar esta acción');
        return res.status(403).json({ msg: error.message });
    }
    
    // Validar que el nuevo rol sea válido
    if (!['user', 'admin'].includes(nuevoRol)) {
        const error = new Error('Rol no válido');
        return res.status(400).json({ msg: error.message });
    }
    
    try {
        const usuario = await Usuarios.findById(userId);
        
        if (!usuario) {
            const error = new Error('Usuario no encontrado');
            return res.status(404).json({ msg: error.message });
        }
        
        usuario.rol = nuevoRol;
        await usuario.save();
        
        res.json({ 
            msg: `Rol actualizado correctamente a ${nuevoRol}`,
            usuario: {
                _id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al actualizar el rol' });
    }
}

// Nueva función para obtener todos los usuarios (solo admin)
const obtenerUsuarios = async (req, res) => {
    // Verificar que el usuario que hace la petición es admin
    if (req.usuario.rol !== 'admin') {
        const error = new Error('No tienes permisos para ver esta información');
        return res.status(403).json({ msg: error.message });
    }
    
    try {
        const usuarios = await Usuarios.find()
            .select('-password -token -__v')
            .sort({ createdAt: -1 });
            
        res.json(usuarios);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener usuarios' });
    }
}

export {
    registrar,
    perfil,
    confirmar,
    autenticar,
    olvidePassword,
    comprobarToken,
    nuevoPassword,
    actualizarPerfil,
    actualizarPassword,
    cambiarRol,
    obtenerUsuarios,
}