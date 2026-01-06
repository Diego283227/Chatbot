// controllers/terminosExcluidosController.js
import TerminosExcluidos from '../models/TerminsExcluidos.js';

// @desc    Obtener todos los términos excluidos
// @route   GET /api/admin/terminos-excluidos
// @access  Admin
const obtenerTerminosExcluidos = async (req, res) => {
    try {
        const terminos = await TerminosExcluidos.find()
            .populate('usuario', 'nombre email')
            .sort({ createdAt: -1 });

        // Aplanar los términos para la vista del admin
        const terminosAplanados = [];
        
        terminos.forEach(documento => {
            documento.terminos.forEach(termino => {
                terminosAplanados.push({
                    _id: `${documento._id}_${termino._id}`,
                    documentoId: documento._id,
                    terminoId: termino._id,
                    palabra: termino.palabra,
                    activo: termino.activo,
                    fechaCreacion: termino.fechaCreacion,
                    usuario: documento.usuario,
                    aplicarGlobalmente: documento.aplicarGlobalmente
                });
            });
        });

        res.json({
            success: true,
            terminos: terminosAplanados,
            total: terminosAplanados.length
        });
    } catch (error) {
        console.error('Error al obtener términos excluidos:', error);
        res.status(500).json({
            success: false,
            msg: 'Error del servidor al obtener términos excluidos'
        });
    }
};

// @desc    Crear nuevo término excluido
// @route   POST /api/admin/terminos-excluidos
// @access  Admin
const crearTerminoExcluido = async (req, res) => {
    try {
        const { palabra, usuarioId, aplicarGlobalmente = false } = req.body;

        if (!palabra || !usuarioId) {
            return res.status(400).json({
                success: false,
                msg: 'La palabra y el usuario son requeridos'
            });
        }

        // Buscar si ya existe un documento para este usuario
        let documentoTerminos = await TerminosExcluidos.findOne({ usuario: usuarioId });

        if (documentoTerminos) {
            // Verificar si la palabra ya existe
            const palabraExistente = documentoTerminos.terminos.find(
                t => t.palabra.toLowerCase() === palabra.toLowerCase()
            );

            if (palabraExistente) {
                return res.status(400).json({
                    success: false,
                    msg: 'Esta palabra ya existe en los términos excluidos'
                });
            }

            // Agregar nueva palabra al documento existente
            documentoTerminos.terminos.push({
                palabra: palabra.toLowerCase().trim(),
                activo: true,
                fechaCreacion: new Date()
            });

            await documentoTerminos.save();
        } else {
            // Crear nuevo documento
            documentoTerminos = new TerminosExcluidos({
                usuario: usuarioId,
                terminos: [{
                    palabra: palabra.toLowerCase().trim(),
                    activo: true,
                    fechaCreacion: new Date()
                }],
                aplicarGlobalmente
            });

            await documentoTerminos.save();
        }

        await documentoTerminos.populate('usuario', 'nombre email');

        // Encontrar el término recién creado
        const nuevoTermino = documentoTerminos.terminos[documentoTerminos.terminos.length - 1];

        res.status(201).json({
            success: true,
            msg: 'Término excluido creado exitosamente',
            termino: {
                _id: `${documentoTerminos._id}_${nuevoTermino._id}`,
                documentoId: documentoTerminos._id,
                terminoId: nuevoTermino._id,
                palabra: nuevoTermino.palabra,
                activo: nuevoTermino.activo,
                fechaCreacion: nuevoTermino.fechaCreacion,
                usuario: documentoTerminos.usuario,
                aplicarGlobalmente: documentoTerminos.aplicarGlobalmente
            }
        });
    } catch (error) {
        console.error('Error al crear término excluido:', error);
        res.status(500).json({
            success: false,
            msg: 'Error del servidor al crear término excluido'
        });
    }
};

// @desc    Actualizar término excluido
// @route   PUT /api/admin/terminos-excluidos/:id
// @access  Admin
const actualizarTerminoExcluido = async (req, res) => {
    try {
        const { id } = req.params;
        const { palabra, activo } = req.body;

        // El id viene en formato "documentoId_terminoId"
        const [documentoId, terminoId] = id.split('_');

        const documento = await TerminosExcluidos.findById(documentoId);

        if (!documento) {
            return res.status(404).json({
                success: false,
                msg: 'Documento de términos excluidos no encontrado'
            });
        }

        const termino = documento.terminos.id(terminoId);

        if (!termino) {
            return res.status(404).json({
                success: false,
                msg: 'Término excluido no encontrado'
            });
        }

        // Actualizar campos
        if (palabra !== undefined) {
            // Verificar si la nueva palabra ya existe (excluyendo el actual)
            const palabraExistente = documento.terminos.find(
                t => t._id.toString() !== terminoId && 
                     t.palabra.toLowerCase() === palabra.toLowerCase()
            );

            if (palabraExistente) {
                return res.status(400).json({
                    success: false,
                    msg: 'Esta palabra ya existe en los términos excluidos'
                });
            }

            termino.palabra = palabra.toLowerCase().trim();
        }

        if (activo !== undefined) {
            termino.activo = activo;
        }

        await documento.save();
        await documento.populate('usuario', 'nombre email');

        res.json({
            success: true,
            msg: 'Término excluido actualizado exitosamente',
            termino: {
                _id: `${documento._id}_${termino._id}`,
                documentoId: documento._id,
                terminoId: termino._id,
                palabra: termino.palabra,
                activo: termino.activo,
                fechaCreacion: termino.fechaCreacion,
                usuario: documento.usuario,
                aplicarGlobalmente: documento.aplicarGlobalmente
            }
        });
    } catch (error) {
        console.error('Error al actualizar término excluido:', error);
        res.status(500).json({
            success: false,
            msg: 'Error del servidor al actualizar término excluido'
        });
    }
};

const obtenerTerminosUsuario = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;

        // Obtener términos específicos del usuario
        const terminosUsuario = await TerminosExcluidos.findOne({ usuario: usuarioId });

        // Obtener términos globales (aplicarGlobalmente: true)
        const terminosGlobales = await TerminosExcluidos.find({ aplicarGlobalmente: true });

        let todosLosTerminos = [];

        // Agregar términos del usuario
        if (terminosUsuario) {
            terminosUsuario.terminos.forEach(termino => {
                todosLosTerminos.push({
                    _id: `${terminosUsuario._id}_${termino._id}`,
                    palabra: termino.palabra,
                    activo: termino.activo,
                    fechaCreacion: termino.fechaCreacion,
                    aplicarGlobalmente: terminosUsuario.aplicarGlobalmente,
                    esPropio: true
                });
            });
        }

        // Agregar términos globales de otros usuarios
        terminosGlobales.forEach(documento => {
            if (documento.usuario.toString() !== usuarioId.toString()) {
                documento.terminos.forEach(termino => {
                    todosLosTerminos.push({
                        _id: `${documento._id}_${termino._id}`,
                        palabra: termino.palabra,
                        activo: termino.activo,
                        fechaCreacion: termino.fechaCreacion,
                        aplicarGlobalmente: true,
                        esPropio: false
                    });
                });
            }
        });

        res.json({
            success: true,
            terminos: todosLosTerminos
        });
    } catch (error) {
        console.error('Error al obtener términos del usuario:', error);
        res.status(500).json({
            success: false,
            msg: 'Error del servidor al obtener términos excluidos'
        });
    }
};


const verificarMensaje = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { mensaje } = req.body;

        if (!mensaje) {
            return res.status(400).json({
                success: false,
                msg: 'El mensaje es requerido'
            });
        }

        // Obtener términos del usuario
        const terminosUsuario = await TerminosExcluidos.findOne({ usuario: usuarioId });
        
        // Obtener términos globales
        const terminosGlobales = await TerminosExcluidos.find({ aplicarGlobalmente: true });

        let terminosAVerificar = [];

        // Agregar términos del usuario
        if (terminosUsuario) {
            terminosUsuario.terminos.forEach(termino => {
                if (termino.activo) {
                    terminosAVerificar.push({
                        palabra: termino.palabra,
                        esGlobal: terminosUsuario.aplicarGlobalmente
                    });
                }
            });
        }

        // Agregar términos globales
        terminosGlobales.forEach(documento => {
            documento.terminos.forEach(termino => {
                if (termino.activo) {
                    terminosAVerificar.push({
                        palabra: termino.palabra,
                        esGlobal: true
                    });
                }
            });
        });

        // 🔥 VERIFICACIÓN MEJORADA - Solo palabras exactas completas
        const mensajeLower = mensaje.toLowerCase().trim();
        
        // Dividir el mensaje en palabras individuales
        const palabrasDelMensaje = mensajeLower.split(/\s+/);
        
        for (const termino of terminosAVerificar) {
            const palabraExcluida = termino.palabra.toLowerCase().trim();
            
            // ✅ SOLO verificar coincidencia exacta de palabra completa
            // Buscar si alguna palabra del mensaje coincide exactamente con el término excluido
            const palabraEncontrada = palabrasDelMensaje.some(palabra => {
                // Remover signos de puntuación de la palabra del mensaje
                const palabraLimpia = palabra.replace(/[^\w\s]/g, '');
                return palabraLimpia === palabraExcluida;
            });
            
            if (palabraEncontrada) {
                console.log(`🚫 Término excluido detectado: "${palabraExcluida}" en mensaje: "${mensaje}"`);
                return res.json({
                    success: true,
                    permitido: false,
                    terminoDetectado: termino.palabra,
                    esGlobal: termino.esGlobal
                });
            }
        }

        console.log(`✅ Mensaje permitido: "${mensaje}"`);
        res.json({
            success: true,
            permitido: true,
            terminoDetectado: null,
            esGlobal: false
        });

    } catch (error) {
        console.error('Error al verificar mensaje:', error);
        res.status(500).json({
            success: false,
            msg: 'Error del servidor al verificar mensaje'
        });
    }
};

const cambiarEstadoTermino = async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        // El id viene en formato "documentoId_terminoId"
        const [documentoId, terminoId] = id.split('_');

        const documento = await TerminosExcluidos.findById(documentoId);

        if (!documento) {
            return res.status(404).json({
                success: false,
                msg: 'Documento de términos excluidos no encontrado'
            });
        }

        const termino = documento.terminos.id(terminoId);

        if (!termino) {
            return res.status(404).json({
                success: false,
                msg: 'Término excluido no encontrado'
            });
        }

        termino.activo = activo;
        await documento.save();

        res.json({
            success: true,
            msg: `Término ${activo ? 'activado' : 'desactivado'} exitosamente`
        });
    } catch (error) {
        console.error('Error al cambiar estado del término:', error);
        res.status(500).json({
            success: false,
            msg: 'Error del servidor al cambiar estado del término'
        });
    }
};

// @desc    Eliminar término excluido
// @route   DELETE /api/admin/terminos-excluidos/:id
// @access  Admin
const eliminarTerminoExcluido = async (req, res) => {
    try {
        const { id } = req.params;

        // El id viene en formato "documentoId_terminoId"
        const [documentoId, terminoId] = id.split('_');

        const documento = await TerminosExcluidos.findById(documentoId);

        if (!documento) {
            return res.status(404).json({
                success: false,
                msg: 'Documento de términos excluidos no encontrado'
            });
        }

        // Eliminar el término del array
        documento.terminos.pull(terminoId);

        // Si no quedan términos, eliminar todo el documento
        if (documento.terminos.length === 0) {
            await TerminosExcluidos.findByIdAndDelete(documentoId);
        } else {
            await documento.save();
        }

        res.json({
            success: true,
            msg: 'Término excluido eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar término excluido:', error);
        res.status(500).json({
            success: false,
            msg: 'Error del servidor al eliminar término excluido'
        });
    }
};

// @desc    Obtener términos excluidos por usuario
// @route   GET /api/admin/terminos-excluidos/usuario/:usuarioId
// @access  Admin
const obtenerTerminosPorUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        const documento = await TerminosExcluidos.findOne({ usuario: usuarioId })
            .populate('usuario', 'nombre email');

        if (!documento) {
            return res.json({
                success: true,
                terminos: [],
                aplicarGlobalmente: false
            });
        }

        res.json({
            success: true,
            terminos: documento.terminos,
            aplicarGlobalmente: documento.aplicarGlobalmente,
            usuario: documento.usuario
        });
    } catch (error) {
        console.error('Error al obtener términos por usuario:', error);
        res.status(500).json({
            success: false,
            msg: 'Error del servidor al obtener términos por usuario'
        });
    }
};

// @desc    Actualizar configuración global
// @route   PATCH /api/admin/terminos-excluidos/usuario/:usuarioId/global
// @access  Admin
const actualizarConfiguracionGlobal = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { aplicarGlobalmente } = req.body;

        const documento = await TerminosExcluidos.findOne({ usuario: usuarioId });

        if (!documento) {
            return res.status(404).json({
                success: false,
                msg: 'No se encontraron términos excluidos para este usuario'
            });
        }

        documento.aplicarGlobalmente = aplicarGlobalmente;
        await documento.save();

        res.json({
            success: true,
            msg: `Configuración global ${aplicarGlobalmente ? 'activada' : 'desactivada'} exitosamente`
        });
    } catch (error) {
        console.error('Error al actualizar configuración global:', error);
        res.status(500).json({
            success: false,
            msg: 'Error del servidor al actualizar configuración global'
        });
    }
};

// @desc    Obtener estadísticas de términos excluidos
// @route   GET /api/admin/terminos-excluidos/estadisticas
// @access  Admin
const obtenerEstadisticas = async (req, res) => {
    try {
        const documentos = await TerminosExcluidos.find();

        let totalTerminos = 0;
        let terminosActivos = 0;
        let terminosInactivos = 0;
        let usuariosConTerminos = documentos.length;

        documentos.forEach(documento => {
            documento.terminos.forEach(termino => {
                totalTerminos++;
                if (termino.activo) {
                    terminosActivos++;
                } else {
                    terminosInactivos++;
                }
            });
        });

        res.json({
            success: true,
            estadisticas: {
                totalTerminos,
                terminosActivos,
                terminosInactivos,
                usuariosConTerminos
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            msg: 'Error del servidor al obtener estadísticas'
        });
    }
};

export {
    obtenerTerminosExcluidos,
    crearTerminoExcluido,
    actualizarTerminoExcluido,
    cambiarEstadoTermino,
    eliminarTerminoExcluido,
    obtenerTerminosPorUsuario,
    actualizarConfiguracionGlobal,
    obtenerEstadisticas,
    verificarMensaje,
    obtenerTerminosUsuario
};