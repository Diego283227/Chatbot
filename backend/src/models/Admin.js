import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import generarId from "../helpers/GenerarId.js";

const adminschema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    telefono: {
        type: String,
        default: null,
        trim: true,
    },
    web: {
        type: String,
        default: null,
    },
    token: {
        type: String,
        default: generarId(),
    },
    role: {
        type: String,
        default: 'admin'
    }
    
});

adminschema.pre("save", async function (next) {
    if (!this.isModified('password')) {
        next()
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

});

adminschema.methods.comprobarPassword = async function (
    passwordFormulario
) {
    return await bcrypt.compare(passwordFormulario, this.password);
}


const Admins = mongoose.model("Admins", adminschema);
export default Admins;






