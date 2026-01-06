import express from 'express';
import {
    obtenerPrompts,
    obtenerPromptActivo,
    crearPrompt,
    actualizarPrompt,
    eliminarPrompt,
    activarPrompt
} from '../controllers/promptController.js';
import checkAuth from '../middleware/authMiddleware.js';
import checkAdmin from '../middleware/checkAdmin.js';

const router = express.Router();

// Ruta pública para obtener el prompt activo (para el chatbot)
router.get('/activo', checkAuth, obtenerPromptActivo);

// Rutas protegidas solo para administradores
router.use(checkAuth); // Primero verificar autenticación
router.use(checkAdmin); // Luego verificar si es admin

// Rutas CRUD solo para admins
router.route('/')
    .get(obtenerPrompts)
    .post(crearPrompt);

router.route('/:id')
    .put(actualizarPrompt)
    .delete(eliminarPrompt);

router.put('/:id/activar', activarPrompt);

export default router;