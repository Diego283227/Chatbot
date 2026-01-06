import mongoose from 'mongoose';

const mensajeSchema = mongoose.Schema({
    rol: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    contenido: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const conversacionSchema = mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    titulo: {
        type: String,
        default: 'Nueva conversación'
    },
    mensajes: [mensajeSchema],
    promptUtilizado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prompt'
    },
    activa: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índice para mejorar búsquedas por usuario
conversacionSchema.index({ usuario: 1, createdAt: -1 });

const Conversacion = mongoose.model('Conversacion', conversacionSchema);
export default Conversacion;