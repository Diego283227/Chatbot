import express from 'express'
//Accedemos al router de express

const router = express.Router();
//---------------------------------
import {
     registrar,
     perfil, 
     confirmar,
     autenticar, 
     olvidePassword, 
     comprobarToken,
     nuevoPassword, 
     actualizarPerfil,
    actualizarPassword,
    } from '../controllers/UserController.js';
import checkAuth from '../middleware/AuthMiddleware.js';

// definicion de los endpoints área publica

router.post('/', registrar );
router.get("/confirmar/:token", confirmar);
router.post("/login", autenticar);
router.post("/olvide-password", olvidePassword);
// chaining(Encadenamiento) de las rutas en express 

router.route("/olvide-password/:token").get(comprobarToken).post(nuevoPassword);


// definicion de los endpoints área privada

router.get('/perfil', checkAuth, perfil);
router.put('/perfil/:id', checkAuth, actualizarPerfil)
router.put('/actualizar-password', checkAuth, actualizarPassword)
// router.delete('/perfil/:id', checkAuth, eliminarVeterinario)




export default router;



