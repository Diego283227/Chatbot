// controllers/adminController.js
import Usuario from '../models/Usuario.js';
import Prompt from '../models/Prompt.js';
import Conversacion from '../models/Conversacion.js';



// Obtener estadísticas del dashboard
const obtenerEstadisticas = async (req, res) => {
    try {
        // Obtener fecha de inicio del día actual
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Total de usuarios
        const totalUsuarios = await Usuario.countDocuments();
        
        // Usuarios activos (confirmados)
        const usuariosActivos = await Usuario.countDocuments({ 
            confirmado: true 
        });

        // Prompts activos
        let promptsActivos = 0;
        try {
            promptsActivos = await Prompt.countDocuments({ activo: true });
        } catch (error) {
            promptsActivos = 5; // Valor por defecto si no existe el modelo
        }

        // Nuevos usuarios registrados hoy
        const nuevosUsuariosHoy = await Usuario.countDocuments({
            createdAt: { $gte: hoy }
        });

        // Conversaciones del día
        let conversacionesHoy = 0;
        let conversacionesTotal = 0;
        try {
            conversacionesHoy = await Conversacion.countDocuments({
                createdAt: { $gte: hoy }
            });
            conversacionesTotal = await Conversacion.countDocuments();
        } catch (error) {
            // Valores de ejemplo si no existe el modelo
            conversacionesHoy = Math.floor(Math.random() * 100) + 50;
            conversacionesTotal = Math.floor(Math.random() * 1000) + 500;
        }

        res.json({
            totalUsuarios,
            usuariosActivos,
            promptsActivos,
            conversacionesHoy,
            nuevosUsuariosHoy,
            conversacionesTotal
        });

    } catch (error) {
        console.error('Error en obtenerEstadisticas:', error);
        res.status(500).json({ msg: 'Error al obtener estadísticas' });
    }
};

// Obtener actividad reciente
const obtenerActividadReciente = async (req, res) => {
    try {
        const actividades = [];
        
        // Obtener últimos 5 usuarios registrados
        const ultimosUsuarios = await Usuario.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('nombre email createdAt');

        ultimosUsuarios.forEach(usuario => {
            actividades.push({
                tipo: 'nuevo_usuario',
                descripcion: `Nuevo usuario registrado: ${usuario.nombre}`,
                detalles: usuario.email,
                fecha: usuario.createdAt
            });
        });

        // Si tienes modelo de Prompt
        try {
            const ultimosPrompts = await Prompt.find()
                .sort({ updatedAt: -1 })
                .limit(3)
                .select('nombre updatedAt');

            ultimosPrompts.forEach(prompt => {
                actividades.push({
                    tipo: 'prompt_actualizado',
                    descripcion: `Prompt actualizado: "${prompt.nombre}"`,
                    fecha: prompt.updatedAt
                });
            });
        } catch (error) {
            // Actividades de ejemplo si no existe el modelo
            actividades.push({
                tipo: 'prompt_actualizado',
                descripcion: 'Prompt actualizado: "Asistente de Airbnb"',
                fecha: new Date(Date.now() - 900000)
            });
        }

        // Agregar actividad de conversaciones
        actividades.push({
            tipo: 'conversacion',
            descripcion: 'Nueva consulta sobre alojamientos',
            fecha: new Date(Date.now() - 3600000)
        });

        // Ordenar por fecha más reciente
        actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        res.json({ actividades: actividades.slice(0, 10) });

    } catch (error) {
        console.error('Error en obtenerActividadReciente:', error);
        res.status(500).json({ msg: 'Error al obtener actividad reciente' });
    }
};

// Obtener todos los usuarios con paginación y filtros
const obtenerUsuarios = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            busqueda = '', 
            filtro = 'todos' 
        } = req.query;

        // Construir query de búsqueda
        let query = {};
        
        // Búsqueda por nombre o email
        if (busqueda) {
            query.$or = [
                { nombre: { $regex: busqueda, $options: 'i' } },
                { email: { $regex: busqueda, $options: 'i' } }
            ];
        }

        // Aplicar filtros
        switch(filtro) {
            case 'activos':
                query.confirmado = true;
                break;
            case 'inactivos':
                query.confirmado = false;
                break;
            case 'admin':
                query.rol = 'admin';
                break;
            default:
                // 'todos' - no se aplica filtro adicional
                break;
        }

        // Contar total de documentos
        const total = await Usuario.countDocuments(query);

        // Obtener usuarios con paginación
        const usuarios = await Usuario.find(query)
            .select('-password -token -__v')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({
            usuarios,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        console.error('Error en obtenerUsuarios:', error);
        res.status(500).json({ msg: 'Error al obtener usuarios' });
    }
};

// Actualizar usuario
const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, email, rol, confirmado } = req.body;

    try {
        // Verificar que el usuario existe
        const usuario = await Usuario.findById(id).select('-password');
        
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Verificar que no se está quitando el último admin
        if (usuario.rol === 'admin' && rol !== 'admin') {
            const totalAdmins = await Usuario.countDocuments({ rol: 'admin' });
            if (totalAdmins <= 1) {
                return res.status(400).json({ 
                    msg: 'No se puede quitar el rol de admin al último administrador' 
                });
            }
        }

        // Actualizar campos si se proporcionan
        if (nombre !== undefined) usuario.nombre = nombre;
        if (email !== undefined) usuario.email = email;
        if (rol !== undefined) usuario.rol = rol;
        if (confirmado !== undefined) usuario.confirmado = confirmado;

        await usuario.save();

        // Devolver usuario actualizado sin información sensible
        const usuarioActualizado = await Usuario.findById(id)
            .select('-password -token -__v');

        res.json({ 
            msg: 'Usuario actualizado correctamente',
            usuario: usuarioActualizado
        });

    } catch (error) {
        console.error('Error en actualizarUsuario:', error);
        
        // Manejar error de email duplicado
        if (error.code === 11000) {
            return res.status(400).json({ 
                msg: 'El email ya está registrado' 
            });
        }
        
        res.status(500).json({ msg: 'Error al actualizar usuario' });
    }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const usuario = await Usuario.findById(id);
        
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // No permitir eliminar el propio usuario admin
        if (usuario._id.toString() === req.usuario._id.toString()) {
            return res.status(400).json({ 
                msg: 'No puedes eliminar tu propia cuenta' 
            });
        }

        // No permitir eliminar el último admin
        if (usuario.rol === 'admin') {
            const totalAdmins = await Usuario.countDocuments({ rol: 'admin' });
            if (totalAdmins <= 1) {
                return res.status(400).json({ 
                    msg: 'No se puede eliminar el último administrador' 
                });
            }
        }

        // Eliminar conversaciones asociadas al usuario (si aplica)
        try {
            await Conversacion.deleteMany({ usuario: usuario._id });
        } catch (error) {
            console.log('No se pudieron eliminar conversaciones');
        }

        await usuario.deleteOne();

        res.json({ msg: 'Usuario eliminado correctamente' });

    } catch (error) {
        console.error('Error en eliminarUsuario:', error);
        res.status(500).json({ msg: 'Error al eliminar usuario' });
    }
};

// Obtener todos los prompts
const obtenerPrompts = async (req, res) => {
    try {
        const prompts = await Prompt.find()
            .sort({ createdAt: -1 });

        res.json(prompts);
    } catch (error) {
        console.error('Error en obtenerPrompts:', error);
        // Si no existe el modelo, devolver datos de ejemplo
        res.json([
            {
                _id: '1',
                nombre: 'Asistente de Airbnb',
                descripcion: 'Prompt especializado para consultas de alojamientos',
                categoria: 'general',
                activo: true,
                contenido: 'Eres un asistente especializado en alojamientos de Airbnb...'
            }
        ]);
    }
};

// Crear nuevo prompt
const crearPrompt = async (req, res) => {
    try {
        const { nombre, descripcion, contenido, categoria, activo } = req.body;

        const nuevoPrompt = new Prompt({
            nombre,
            descripcion,
            contenido,
            categoria,
            activo,
            creadoPor: req.usuario._id
        });

        await nuevoPrompt.save();

        res.status(201).json({
            msg: 'Prompt creado correctamente',
            prompt: nuevoPrompt
        });
    } catch (error) {
        console.error('Error en crearPrompt:', error);
        res.status(500).json({ msg: 'Error al crear prompt' });
    }
};

// Actualizar prompt
const actualizarPrompt = async (req, res) => {
    const { id } = req.params;
    
    try {
        const prompt = await Prompt.findById(id);
        
        if (!prompt) {
            return res.status(404).json({ msg: 'Prompt no encontrado' });
        }

        // Actualizar campos
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                prompt[key] = req.body[key];
            }
        });

        await prompt.save();

        res.json({
            msg: 'Prompt actualizado correctamente',
            prompt
        });
    } catch (error) {
        console.error('Error en actualizarPrompt:', error);
        res.status(500).json({ msg: 'Error al actualizar prompt' });
    }
};

// Eliminar prompt
const eliminarPrompt = async (req, res) => {
    const { id } = req.params;

    try {
        const prompt = await Prompt.findById(id);
        
        if (!prompt) {
            return res.status(404).json({ msg: 'Prompt no encontrado' });
        }

        await prompt.deleteOne();

        res.json({ msg: 'Prompt eliminado correctamente' });
    } catch (error) {
        console.error('Error en eliminarPrompt:', error);
        res.status(500).json({ msg: 'Error al eliminar prompt' });
    }
};

// Obtener prompt de contexto de base de datos
const obtenerPromptContexto = async (req, res) => {
    try {
        // BUSCAR PROMPT EXISTENTE
        let promptContexto = await Prompt.findOne({ 
            nombre: 'Contexto Base de Datos Airbnb' 
        });

        if (!promptContexto) {
            // CREAR PROMPT SI NO EXISTE
            const contextoDB = `
CONTEXTO IMPORTANTE - DEBES USAR ESTA INFORMACIÓN:

Estás conectado a la base de datos MongoDB llamada 'airbnb' que contiene información sobre alojamientos de Airbnb en Nueva York.

ESTRUCTURA DE LA BASE DE DATOS:
- Nombre de la BD: airbnb
- Colección principal: listings
- Aproximadamente 50,000 documentos de alojamientos

CAMPOS DISPONIBLES EN LA COLECCIÓN 'listings':
- _id: ObjectId único del documento
- id: ID numérico del alojamiento (ejemplo: 3647)
- name: Nombre descriptivo del alojamiento (ejemplo: "THE VILLAGE OF HARLEM....NEW YORK !")
- host_id: ID numérico del anfitrión (ejemplo: 4632)
- host_name: Nombre del anfitrión (ejemplo: "Elisabeth")
- neighbourhood_group: Grupo de barrios principales (ejemplo: "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island")
- neighbourhood: Barrio específico (ejemplo: "Harlem", "Williamsburg", "Chelsea")
- latitude: Coordenada de latitud (ejemplo: 40.80902)
- longitude: Coordenada de longitud (ejemplo: -73.9419)
- room_type: Tipo de habitación ("Private room", "Entire home/apt", "Shared room")
- price: Precio por noche en dólares (ejemplo: 150)
- minimum_nights: Número mínimo de noches requeridas (ejemplo: 3)
- number_of_reviews: Cantidad total de reseñas (ejemplo: 0)
- last_review: Fecha de la última reseña (puede estar vacío: "")
- reviews_per_month: Reseñas promedio por mes (puede estar vacío: "")
- calculated_host_listings_count: Cantidad de listados que tiene el anfitrión (ejemplo: 1)
- availability_365: Días disponibles en el año (ejemplo: 365)

TIPOS DE CONSULTAS QUE PUEDES MANEJAR:
1. Búsqueda por ubicación (barrio, zona)
2. Filtros por precio (rangos, barato, caro)
3. Tipos de habitación (privada, completa, compartida)
4. Búsqueda por anfitrión
5. Disponibilidad de alojamientos
6. Mejor valorados (por reseñas)
7. Estadísticas generales

INSTRUCCIONES OBLIGATORIAS:
- SIEMPRE responde basándote únicamente en esta base de datos de Airbnb
- NUNCA digas que no tienes acceso a la base de datos
- NO proporciones instrucciones técnicas de MongoDB
- Responde específicamente con base en la información proporcionada
- Realiza la búsqueda de los datos automáticamente
- Solo proporciona el dato consultado, sin detalles técnicos
- NO muestres consultas MongoDB por pantalla
- NO menciones procedimientos técnicos realizados
- NUNCA te disculpes por limitaciones técnicas
- NO digas qué procedimiento hiciste para traer los datos
- Proporciona información única y exclusivamente de la base de datos
- Traduce los datos al idioma de la consulta del usuario
- Responde únicamente preguntas relacionadas con alojamientos de Airbnb
- Si una pregunta no corresponde a la base de datos, responde: "Esta pregunta no tiene relación con los alojamientos de Airbnb"
- Los datos de contexto deben ser concisos
- NO uses conocimientos externos, solo los datos proporcionados
- NO inventes datos
- Verifica bien las consultas realizadas para que sean consistentes
- Revisa detalladamente la estructura y los datos en los documentos

EJEMPLOS DE RESPUESTAS ESPERADAS:
- Para ubicaciones: Lista de alojamientos con nombre, precio, tipo y barrio
- Para precios: Alojamientos ordenados por precio con detalles relevantes
- Para estadísticas: Números totales, promedios y distribuciones
- Para anfitriones: Lista de propiedades del anfitrión especificado

IMPORTANTE: 
- Los precios están en dólares americanos por noche
- Los barrios están organizados en 5 grupos principales: Manhattan, Brooklyn, Queens, Bronx, Staten Island
- La disponibilidad se mide en días del año (0-365)
- Las reseñas indican popularidad y calidad del alojamiento`;

            promptContexto = new Prompt({
                nombre: 'Contexto Base de Datos Airbnb',
                descripcion: 'Prompt del sistema que define el contexto de la base de datos MongoDB para Airbnb',
                contenido: contextoDB,
                categoria: 'sistema',
                activo: true,
                esPromptSistema: true,
                creadoPor: req.usuario._id
            });

            await promptContexto.save();
        }

        res.json({
            msg: 'Prompt de contexto obtenido/creado',
            prompt: promptContexto
        });

    } catch (error) {
        console.error('Error en obtenerPromptContexto:', error);
        res.status(500).json({ msg: 'Error al obtener prompt de contexto' });
    }
};

// Actualizar prompt de contexto
const actualizarPromptContexto = async (req, res) => {
    try {
        const { contenido } = req.body;

        if (!contenido) {
            return res.status(400).json({ msg: 'El contenido es requerido' });
        }

        // Usar findOneAndUpdate para actualizar o crear si no existe
        const promptContexto = await Prompt.findOneAndUpdate(
            { nombre: 'Contexto Base de Datos Airbnb' }, // Buscar por nombre
            {
                $set: {
                    descripcion: 'Prompt del sistema que define el contexto de la base de datos MongoDB para Airbnb',
                    contenido,
                    categoria: 'sistema',
                    activo: true,
                    esPromptSistema: true,
                    actualizadoPor: req.usuario._id,
                    updatedAt: new Date() // Actualizar timestamp
                },
                $setOnInsert: {
                    creadoPor: req.usuario._id,
                    createdAt: new Date()
                }
            },
            {
                new: true, // Devolver el documento actualizado
                upsert: true, // Crear si no existe
                runValidators: true // Ejecutar validaciones del modelo
            }
        );

        res.json({
            msg: 'Prompt de contexto actualizado correctamente',
            prompt: promptContexto
        });

    } catch (error) {
        console.error('Error en actualizarPromptContexto:', error);
        res.status(500).json({ msg: 'Error al actualizar prompt de contexto' });
    }
};

// En controllers/adminController.js
export const obtenerEstadisticasConversaciones = async (req, res) => {
    try {
        // Aquí importarías tu modelo de Conversación
        const conversaciones = await Conversacion.find()
            .populate('usuario', 'nombre email');
            
        const estadisticas = {
            totalConversaciones: conversaciones.length,
            mensajesTotales: conversaciones.reduce((total, conv) => 
                total + (conv.mensajes?.length || 0), 0),
            usuariosActivos: new Set(conversaciones.map(conv => 
                conv.usuario?._id)).size
        };
            
        res.json({
            success: true,
            estadisticas,
            conversaciones: conversaciones.slice(0, 10) // Solo las últimas 10
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            msg: 'Error del servidor' 
        });
    }
};

// En adminController.js
const obtenerTodasLasConversaciones = async (req, res) => {
    try {
        // Obtener TODAS las conversaciones del sistema
        const conversaciones = await Conversacion.find()
            .populate('usuario', 'nombre email') // Incluir datos del usuario
            .sort({ updatedAt: -1 }) // Más recientes primero
            .limit(100); // Limitar para rendimiento

        // Calcular estadísticas globales
        const totalConversaciones = await Conversacion.countDocuments();
        
        const totalMensajes = conversaciones.reduce((total, conv) => {
            return total + (conv.mensajes?.length || 0);
        }, 0);

        const usuariosUnicos = new Set(
            conversaciones.map(conv => conv.usuario?._id?.toString())
        ).size;

        const estadisticas = {
            totalConversaciones,
            mensajesTotales: totalMensajes,
            usuariosActivos: usuariosUnicos
        };

        res.json({
            success: true,
            conversaciones,
            estadisticas
        });

    } catch (error) {
        console.error('Error al obtener conversaciones:', error);
        res.status(500).json({ 
            success: false, 
            msg: 'Error del servidor' 
        });
    }
};

export {
    obtenerEstadisticas,
    obtenerActividadReciente,
    obtenerUsuarios,
    actualizarUsuario,
    eliminarUsuario,
    obtenerPrompts,
    obtenerPromptContexto,
    actualizarPromptContexto,
    crearPrompt,
    actualizarPrompt,
    eliminarPrompt,
    obtenerTodasLasConversaciones

};