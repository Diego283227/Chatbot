// src/routes/terminosExcluidosUserRoutes.js
import express from 'express';
import {
    obtenerTerminosUsuario,
    verificarMensaje
} from '../controllers/TerminosExcluidosController.js';
import checkAuth from '../middleware/AuthMiddleware.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(checkAuth);

// Rutas para usuarios normales
router.get('/usuario', obtenerTerminosUsuario);        // GET /api/terminos-excluidos/usuario
router.post('/verificar', verificarMensaje);           // POST /api/terminos-excluidos/verificar

export default router;