// routes/adminRoutes.js
import express from 'express';
import {
    obtenerEstadisticas,
    obtenerActividadReciente,
    obtenerUsuarios,
    actualizarUsuario,
    eliminarUsuario,
    obtenerPrompts,
    crearPrompt,
    actualizarPrompt,
    eliminarPrompt,
    obtenerPromptContexto,
    actualizarPromptContexto,
    obtenerEstadisticasConversaciones,
    obtenerTodasLasConversaciones
} from '../controllers/adminController.js';
import checkAuth from '../middleware/AuthMiddleware.js';
import checkAdmin from '../middleware/CheckAdmin.js';

const router = express.Router();

// Middleware: Todas las rutas requieren autenticación y rol de admin
router.use(checkAuth);
router.use(checkAdmin);

// Rutas del dashboard
router.get('/estadisticas', obtenerEstadisticas);
router.get('/actividad-reciente', obtenerActividadReciente);

// Rutas de usuarios
router.route('/usuarios')
    .get(obtenerUsuarios); // GET /api/admin/usuarios

router.route('/usuarios/:id')
    .put(actualizarUsuario)    // PUT /api/admin/usuarios/:id
    .delete(eliminarUsuario);  // DELETE /api/admin/usuarios/:id

// Rutas de prompts
router.route('/prompts')
    .get(obtenerPrompts)       // GET /api/admin/prompts
    .post(crearPrompt);        // POST /api/admin/prompts

router.route('/prompts/:id')
    .put(actualizarPrompt)     // PUT /api/admin/prompts/:id
    .delete(eliminarPrompt);   // DELETE /api/admin/prompts/:id

router.route('/prompt-contexto')
    .get(obtenerPromptContexto)    
    .put(actualizarPromptContexto);

router.get('/estadisticas-conversaciones', obtenerEstadisticasConversaciones);

router.get('/conversaciones', obtenerTodasLasConversaciones);

export default router;