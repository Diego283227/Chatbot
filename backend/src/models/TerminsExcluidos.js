// models/TerminosExcluidos.js
import mongoose from 'mongoose';

const terminosExcluidosSchema = mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    terminos: [{
        palabra: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        activo: {
            type: Boolean,
            default: true
        },
        fechaCreacion: {
            type: Date,
            default: Date.now
        }
    }],
    aplicarGlobalmente: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const TerminosExcluidos = mongoose.model('TerminosExcluidos', terminosExcluidosSchema);
export default TerminosExcluidos;