// services/chatbotService.js

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Obtener token del localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Servicio para manejar las conversaciones
export const chatbotService = {
    // Obtener todas las conversaciones
    async obtenerConversaciones() {
        try {
            const response = await fetch(`${API_URL}/api/chatbot/conversaciones`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al obtener conversaciones');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Obtener una conversación específica
    async obtenerConversacion(id) {
        try {
            const response = await fetch(`${API_URL}/api/chatbot/conversaciones/${id}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al obtener conversación');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    

    // Crear nueva conversación
    async crearConversacion() {
        try {
            const response = await fetch(`${API_URL}/api/chatbot/conversaciones`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al crear conversación');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Enviar mensaje
    async enviarMensaje(conversacionId, mensaje) {
        try {
            const response = await fetch(`${API_URL}/api/chatbot/mensaje`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    conversacionId,
                    mensaje
                })
            });
            
            if (!response.ok) throw new Error('Error al enviar mensaje');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Eliminar conversación
    async eliminarConversacion(id) {
        try {
            const response = await fetch(`${API_URL}/api/chatbot/conversaciones/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al eliminar conversación');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Limpiar todo el historial
    async limpiarHistorial() {
        try {
            const response = await fetch(`${API_URL}/api/chatbot/conversaciones`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al limpiar historial');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },
    // NUEVA FUNCIÓN: Obtener términos excluidos del usuario
async obtenerTerminosExcluidos() {
    try {
        const response = await fetch(`${API_URL}/api/terminos-excluidos/usuario`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Error al obtener términos excluidos');
        
        const data = await response.json();
        console.log('📋 Términos excluidos obtenidos del servidor:', data);
        
        return data.terminos || [];
    } catch (error) {
        console.error('❌ Error al obtener términos excluidos:', error);
        return [];
    }
},

// NUEVA FUNCIÓN: Verificar mensaje (opcional)
async verificarMensaje(mensaje) {
    try {
        const response = await fetch(`${API_URL}/api/terminos-excluidos/verificar`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ mensaje })
        });
        
        if (!response.ok) throw new Error('Error al verificar mensaje');
        
        return await response.json();
    } catch (error) {
        console.error('❌ Error al verificar mensaje:', error);
        return { permitido: true, terminoDetectado: null };
    }
}
};

// Servicio para manejar los prompts
export const promptService = {
    // Obtener todos los prompts
    async obtenerPrompts() {
        try {
            const response = await fetch(`${API_URL}/api/prompts`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al obtener prompts');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Obtener prompt activo
    async obtenerPromptActivo() {
        try {
            const response = await fetch(`${API_URL}/api/prompts/activo`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al obtener prompt activo');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Crear nuevo prompt
    async crearPrompt(datos) {
        try {
            const response = await fetch(`${API_URL}/api/prompts`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(datos)
            });
            
            if (!response.ok) throw new Error('Error al crear prompt');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Actualizar prompt
    async actualizarPrompt(id, datos) {
        try {
            const response = await fetch(`${API_URL}/api/prompts/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(datos)
            });
            
            if (!response.ok) throw new Error('Error al actualizar prompt');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Activar prompt
    async activarPrompt(id) {
        try {
            const response = await fetch(`${API_URL}/api/prompts/${id}/activar`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al activar prompt');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Eliminar prompt
    async eliminarPrompt(id) {
        try {
            const response = await fetch(`${API_URL}/api/prompts/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al eliminar prompt');
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

  
};

