// routes/terminosExcluidosRoutes.js
import express from 'express';
import {
    obtenerTerminosExcluidos,
    crearTerminoExcluido,
    actualizarTerminoExcluido,
    cambiarEstadoTermino,
    eliminarTerminoExcluido,
    obtenerTerminosPorUsuario,
    actualizarConfiguracionGlobal,
    obtenerEstadisticas
} from '../controllers/terminosExcluidosController.js';
import checkAuth from '../middleware/AuthMiddleware.js';
import checkAdmin from '../middleware/checkAdmin.js';

const router = express.Router();

// Aplicar middlewares de autenticación y autorización a todas las rutas
router.use(checkAuth);
router.use(checkAdmin);

// Rutas principales
router.route('/')
    .get(obtenerTerminosExcluidos)     // GET /api/admin/terminos-excluidos
    .post(crearTerminoExcluido);       // POST /api/admin/terminos-excluidos

// Estadísticas
router.get('/estadisticas', obtenerEstadisticas); // GET /api/admin/terminos-excluidos/estadisticas

// Rutas por usuario específico
router.route('/usuario/:usuarioId')
    .get(obtenerTerminosPorUsuario);   // GET /api/admin/terminos-excluidos/usuario/:usuarioId

router.patch('/usuario/:usuarioId/global', actualizarConfiguracionGlobal); // PATCH /api/admin/terminos-excluidos/usuario/:usuarioId/global

// Rutas por ID de término
router.route('/:id')
    .put(actualizarTerminoExcluido)    // PUT /api/admin/terminos-excluidos/:id
    .delete(eliminarTerminoExcluido);  // DELETE /api/admin/terminos-excluidos/:id

// Cambiar estado de término específico
router.patch('/:id/estado', cambiarEstadoTermino); // PATCH /api/admin/terminos-excluidos/:id/estado

export default router;