import express from "express";
import dotenv from 'dotenv';
dotenv.config();

import cors from "cors";
import usuarioRoutes from './src/routes/usuarioRoutes.js'
import promptRoutes from './src/routes/promptRoutes.js';
import chatbotRoutes from './src/routes/chatbotRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js'
import airbnbRoutes from './src/routes/airbnb-data.js'
import terminosExcluidosRoutes from './src/routes/terminocExcluidosRoutes.js'
import terminosExcluidosUser from './src/routes/terminosexcluidosUser.js'
import conectarDB from "./src/config/Db.js";

const app = express();
app.use(express.json());

conectarDB();

const dominiosPermitidos = [process.env.FRONTEND_URL];



// MODIFICACIÓN TEMPORAL - Solo cambiar estas líneas:
const corsOptions = {
    origin: function(origin, callback) {
        
        if(dominiosPermitidos.indexOf(origin) !== -1 || !origin){  // MODIFICADA: agregué || !origin
            // el origen del request esta permitido 
            callback(null, true)
        } else {
            callback(new Error('No permitido por CORS'))
        }          
    }
}

app.use(cors(corsOptions));

// Rutas principales
app.use("/api/usuarios", usuarioRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);

// Rutas de términos excluidos
app.use('/api/admin/terminos-excluidos', terminosExcluidosRoutes);      // Para administradores
app.use('/api/terminos-excluidos', terminosExcluidosUser);  
app.use('/api/airbnb-data', airbnbRoutes);  
    // Para usuarios normales

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`)
})