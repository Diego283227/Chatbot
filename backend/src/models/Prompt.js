// models/Prompt.js - CORREGIDO
import mongoose from 'mongoose';

const promptSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    contenido: {
        type: String,
        required: true,
        trim: true
    },
    activo: {
        type: Boolean,
        default: false
    },
    descripcion: {
        type: String,
        trim: true
    },
    categoria: {
        type: String,
        enum: ['sistema', 'usuario', 'general'],
        default: 'general'
    },
    esPromptSistema: {
        type: Boolean,
        default: false
    },
    // CORREGIDO: Cambiar createdBy por creadoPor para consistencia
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    actualizadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, {
    timestamps: true
});

// Middleware para asegurar que solo haya un prompt activo por categoría
promptSchema.pre('save', async function(next) {
    if (this.activo && this.categoria !== 'sistema') {
        // Solo un prompt de usuario/general puede estar activo
        await this.constructor.updateMany(
            { 
                _id: { $ne: this._id },
                categoria: { $ne: 'sistema' }
            },
            { activo: false }
        );
    }
    next();
});

const Prompt = mongoose.model('Prompt', promptSchema);
export default Prompt;

// controllers/chatController.js - FUNCIÓN CORREGIDA


// Función auxiliar para crear contexto por defecto
const crearContextoPorDefecto = async (usuarioId) => {
    const contextoPorDefecto = `CONTEXTO IMPORTANTE - DEBES USAR ESTA INFORMACIÓN:
Estás conectado a la base de datos MongoDB llamada 'sample_mflix'...`;
    
    const nuevoContexto = new Prompt({
        nombre: 'Contexto Base de Datos',
        descripcion: 'Contexto del sistema para la base de datos',
        contenido: contextoPorDefecto,
        categoria: 'sistema',
        esPromptSistema: true,
        activo: true,
        creadoPor: usuarioId
    });
    
    await nuevoContexto.save();
    return nuevoContexto;
};

const obtenerContextoPorDefecto = () => {
    return `CONTEXTO IMPORTANTE - DEBES USAR ESTA INFORMACIÓN:
Estás conectado a la base de datos MongoDB llamada 'sample_mflix' que contiene información sobre reseñas de películas...`;
};