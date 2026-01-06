import dotenv from 'dotenv';
dotenv.config();

import Conversacion from '../models/Conversacion.js';
import Prompt from '../models/Prompt.js';
import TerminosExcluidos from '../models/TerminsExcluidos.js';
import Anthropic from '@anthropic-ai/sdk';
import { ejecutarConsultaMongoDB, formatearResultadosParaIA } from '../helpers/mongoQueries.js';
// IMPORTAR EL CONTEXTO DESDE EL ARCHIVO
import { obtenerContextoDatabase } from '../config/contextoDatabase.js';

// Configurar Anthropic Claude
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Obtener conversaciones del usuario
const obtenerConversaciones = async (req, res) => {
    try {
        const conversaciones = await Conversacion.find({ 
            usuario: req.usuario._id 
        })
        .sort({ updatedAt: -1 })
        .select('titulo createdAt updatedAt activa');
        
        res.json(conversaciones);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener conversaciones' });
    }
};

// Obtener una conversación específica
const obtenerConversacion = async (req, res) => {
    const { id } = req.params;
    
    try {
        const conversacion = await Conversacion.findOne({
            _id: id,
            usuario: req.usuario._id
        }).populate('promptUtilizado', 'nombre contenido');
        
        if (!conversacion) {
            return res.status(404).json({ msg: 'Conversación no encontrada' });
        }
        
        res.json(conversacion);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener conversación' });
    }
};

// Crear nueva conversación
const crearConversacion = async (req, res) => {
    try {
        const promptActivo = await Prompt.findOne({ activo: true });
        
        const conversacion = new Conversacion({
            usuario: req.usuario._id,
            promptUtilizado: promptActivo?._id
        });
        
        await conversacion.save();
        res.status(201).json(conversacion);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al crear conversación' });
    }
};

// 🆕 NUEVA FUNCIÓN: Editar conversación
const editarConversacion = async (req, res) => {
    const { id } = req.params;
    const { titulo } = req.body;
    
    try {
        // Validar que el título no esté vacío
        if (!titulo || !titulo.trim()) {
            return res.status(400).json({ msg: 'El título no puede estar vacío' });
        }

        // Buscar y actualizar la conversación
        const conversacion = await Conversacion.findOneAndUpdate(
            {
                _id: id,
                usuario: req.usuario._id
            },
            {
                titulo: titulo.trim(),
                updatedAt: new Date()
            },
            {
                new: true, // Devolver el documento actualizado
                runValidators: true // Ejecutar validaciones del modelo
            }
        ).select('titulo createdAt updatedAt activa');
        
        if (!conversacion) {
            return res.status(404).json({ msg: 'Conversación no encontrada' });
        }
        
        res.json({
            msg: 'Conversación actualizada correctamente',
            conversacion
        });
        
    } catch (error) {
        console.log('Error al editar conversación:', error);
        
        // Manejar errores específicos
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                msg: 'Datos de conversación inválidos',
                details: error.message 
            });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({ msg: 'ID de conversación inválido' });
        }
        
        res.status(500).json({ msg: 'Error al actualizar conversación' });
    }
};

const enviarMensaje = async (req, res) => {
    const { conversacionId, mensaje } = req.body;
    
    try {
        // Buscar la conversación
        const conversacion = await Conversacion.findOne({
            _id: conversacionId,
            usuario: req.usuario._id
        }).populate('promptUtilizado', 'nombre contenido');
        
        if (!conversacion) {
            return res.status(404).json({ msg: 'Conversación no encontrada' });
        }

        // Agregar el mensaje del usuario a la conversación
        conversacion.mensajes.push({
            rol: 'user',
            contenido: mensaje
        });

        // Buscar información en la base de datos de Airbnb si es necesario
        let resultadosDB = null;
        try {
            resultadosDB = await ejecutarConsultaMongoDB(mensaje);
        } catch (error) {
            console.log('Error en consulta MongoDB Airbnb:', error);
        }

        // 1. OBTENER CONTEXTO DESDE ARCHIVO (AIRBNB)
        let contextoDB = obtenerContextoDatabase();
        
        // 2. AGREGAR RESULTADOS DE LA BD SI EXISTEN
        if (resultadosDB) {
            contextoDB += '\n\nDATOS ENCONTRADOS:\n' + formatearResultadosParaIA(resultadosDB);
        }

        // 3. OBTENER PROMPT PERSONALIZADO DEL ADMIN
        let promptPersonalizado = '';
        if (conversacion.promptUtilizado) {
            promptPersonalizado = conversacion.promptUtilizado.contenido;
        } else {
            const promptActivo = await Prompt.findOne({ 
                activo: true,
                categoria: { $ne: 'sistema' }
            });
            promptPersonalizado = promptActivo?.contenido || 'Eres un asistente especializado en alojamientos de Airbnb en Nueva York. Ayuda a los usuarios a encontrar el alojamiento perfecto basándote en sus necesidades y preferencias.';
        }
        
        // 4. COMBINAR CONTEXTO CON PROMPT PERSONALIZADO
        const promptSistema = contextoDB + '\n\nCOMPORTAMIENTO ADICIONAL:\n' + promptPersonalizado;
        
        console.log('=== USANDO CONTEXTO AIRBNB ===');
        console.log('Longitud del contexto:', contextoDB.length);
        console.log('Prompt activo:', !!promptPersonalizado);
        console.log('Resultados DB encontrados:', !!resultadosDB);
        
        // Construir mensajes SIN incluir sistema
        const mensajesHistorial = conversacion.mensajes
            .filter(msg => msg.rol !== 'system') // Excluir mensajes de sistema si los hay
            .map(msg => ({
                role: msg.rol === 'user' ? 'user' : 'assistant',
                content: msg.contenido
            }));

        // Enviar a Claude con formato correcto
        const respuesta = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            system: promptSistema, // Sistema como parámetro separado
            messages: mensajesHistorial // Solo mensajes user/assistant
        });

        const respuestaIA = respuesta.content[0].text;

        // Agregar respuesta de la IA a la conversación
        conversacion.mensajes.push({
            rol: 'assistant',
            contenido: respuestaIA
        });

        // Actualizar título si es el primer mensaje
        if (conversacion.mensajes.length === 2) {
            // Crear título más descriptivo para Airbnb
            let titulo = mensaje.substring(0, 50);
            if (mensaje.toLowerCase().includes('manhattan')) titulo = 'Búsqueda en Manhattan';
            else if (mensaje.toLowerCase().includes('brooklyn')) titulo = 'Búsqueda en Brooklyn';
            else if (mensaje.toLowerCase().includes('precio')) titulo = 'Consulta de precios';
            else if (mensaje.toLowerCase().includes('habitación')) titulo = 'Tipos de habitación';
            else titulo += '...';
            
            conversacion.titulo = titulo;
        }

        await conversacion.save();

        let datosParaModal = null;
        if (resultadosDB) {
            datosParaModal = {
                ...resultadosDB,
                tipo: resultadosDB.tipo === 'lista' ? 'listings' : resultadosDB.tipo,
                fuenteDatos: 'mongodb'  // Marcar que viene de la BD
            };
        }
        
        res.json({
            respuesta: respuestaIA,
            conversacion: conversacion,
            datosContexto: datosParaModal  // ← Usar datos convertidos
        });

    } catch (error) {
        console.log('Error en enviarMensaje:', error);
        res.status(500).json({ msg: 'Error al procesar mensaje sobre alojamientos' });
    }
};

// Eliminar conversación
const eliminarConversacion = async (req, res) => {
    const { id } = req.params;
    
    try {
        const conversacion = await Conversacion.findOneAndDelete({
            _id: id,
            usuario: req.usuario._id
        });
        
        if (!conversacion) {
            return res.status(404).json({ msg: 'Conversación no encontrada' });
        }
        
        res.json({ msg: 'Conversación eliminada correctamente' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al eliminar conversación' });
    }
};

// Limpiar historial de conversaciones
const limpiarHistorial = async (req, res) => {
    try {
        await Conversacion.deleteMany({ usuario: req.usuario._id });
        res.json({ msg: 'Historial limpiado correctamente' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al limpiar historial' });
    }
};

export {
    obtenerConversaciones,
    obtenerConversacion,
    crearConversacion,
    editarConversacion, // 🆕 NUEVA EXPORTACIÓN
    enviarMensaje,
    eliminarConversacion,
    limpiarHistorial
};