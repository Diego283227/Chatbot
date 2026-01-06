import Prompt from '../models/Prompt.js';

// Obtener todos los prompts
const obtenerPrompts = async (req, res) => {
    try {
        const prompts = await Prompt.find()
            .populate('createdBy', 'nombre email')
            .sort({ createdAt: -1 });
        
        res.json(prompts);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener prompts' });
    }
};

// Obtener prompt activo
const obtenerPromptActivo = async (req, res) => {
    try {
        const prompt = await Prompt.findOne({ activo: true });
        
        if (!prompt) {
            return res.status(404).json({ msg: 'No hay prompt activo' });
        }
        
        res.json(prompt);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener prompt activo' });
    }
};

// Crear nuevo prompt
const crearPrompt = async (req, res) => {
    const { nombre, contenido, descripcion, activo } = req.body;
    
    try {
        // Verificar si ya existe un prompt con ese nombre
        const promptExiste = await Prompt.findOne({ nombre });
        
        if (promptExiste) {
            return res.status(400).json({ msg: 'Ya existe un prompt con ese nombre' });
        }
        
        const prompt = new Prompt({
            nombre,
            contenido,
            descripcion,
            activo: activo || false,
            createdBy: req.usuario._id
        });
        
        await prompt.save();
        res.status(201).json(prompt);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al crear prompt' });
    }
};

// Actualizar prompt
const actualizarPrompt = async (req, res) => {
    const { id } = req.params;
    const { nombre, contenido, descripcion, activo } = req.body;
    
    try {
        const prompt = await Prompt.findById(id);
        
        if (!prompt) {
            return res.status(404).json({ msg: 'Prompt no encontrado' });
        }
        
        // Verificar si el usuario es el creador o es admin
        if (prompt.createdBy.toString() !== req.usuario._id.toString() && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: 'No tienes permisos para editar este prompt' });
        }
        
        prompt.nombre = nombre || prompt.nombre;
        prompt.contenido = contenido || prompt.contenido;
        prompt.descripcion = descripcion || prompt.descripcion;
        prompt.activo = activo !== undefined ? activo : prompt.activo;
        
        await prompt.save();
        res.json(prompt);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al actualizar prompt' });
    }
};

// Eliminar prompt
const eliminarPrompt = async (req, res) => {
    const { id } = req.params;
    
    try {
        const prompt = await Prompt.findById(id);
        
        if (!prompt) {
            return res.status(404).json({ msg: 'Prompt no encontrado' });
        }
        
        // Verificar permisos
        if (prompt.createdBy.toString() !== req.usuario._id.toString() && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: 'No tienes permisos para eliminar este prompt' });
        }
        
        // Si es el prompt activo, avisar
        if (prompt.activo) {
            return res.status(400).json({ msg: 'No puedes eliminar el prompt activo. Activa otro prompt primero.' });
        }
        
        await prompt.deleteOne();
        res.json({ msg: 'Prompt eliminado correctamente' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al eliminar prompt' });
    }
};

// Activar un prompt específico
const activarPrompt = async (req, res) => {
    const { id } = req.params;
    
    try {
        const prompt = await Prompt.findById(id);
        
        if (!prompt) {
            return res.status(404).json({ msg: 'Prompt no encontrado' });
        }
        
        // Desactivar todos los demás
        await Prompt.updateMany(
            { _id: { $ne: id } },
            { activo: false }
        );
        
        // Activar el seleccionado
        prompt.activo = true;
        await prompt.save();
        
        res.json({ msg: 'Prompt activado correctamente', prompt });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al activar prompt' });
    }
};

export {
    obtenerPrompts,
    obtenerPromptActivo,
    crearPrompt,
    actualizarPrompt,
    eliminarPrompt,
    activarPrompt
};