import express from 'express';
import {
    obtenerConversaciones,
    obtenerConversacion,
    crearConversacion,
    editarConversacion, // 🆕 NUEVA IMPORTACIÓN
    enviarMensaje,
    eliminarConversacion,
    limpiarHistorial
} from '../controllers/chatbotController.js';
import checkAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas de conversaciones
router.route('/conversaciones')
    .get(obtenerConversaciones)     // GET /api/conversaciones - Obtener todas las conversaciones
    .post(crearConversacion);       // POST /api/conversaciones - Crear nueva conversación

// Rutas específicas para una conversación por ID
router.route('/conversaciones/:id')
    .get(obtenerConversacion)       // GET /api/conversaciones/:id - Obtener conversación específica
    .put(editarConversacion)        // 🆕 PUT /api/conversaciones/:id - Editar conversación
    .delete(eliminarConversacion);  // DELETE /api/conversaciones/:id - Eliminar conversación

// Ruta para limpiar todas las conversaciones
router.delete('/conversaciones', limpiarHistorial); // DELETE /api/conversaciones - Limpiar historial

// Ruta para enviar mensajes
router.post('/mensaje', enviarMensaje); // POST /api/mensaje - Enviar mensaje

export default router;