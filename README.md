# Chatbot Airbnb NYC - Asistente Inteligente con IA

Un chatbot fullstack que utiliza inteligencia artificial (Claude) para responder consultas sobre alojamientos de Airbnb en Nueva York, con panel de administración completo.

![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?logo=mongodb)
![Claude AI](https://img.shields.io/badge/Claude-Anthropic%20AI-8B5CF6)

## Características

- **Chat con IA**: Conversaciones inteligentes sobre alojamientos de Airbnb NYC usando Claude AI
- **Autenticación completa**: Registro, login, confirmación por email, recuperación de contraseña
- **Panel de administración**: Dashboard con estadísticas, gestión de usuarios, prompts y términos excluidos
- **Historial de conversaciones**: Persistencia de chats con búsqueda y filtrado
- **Sistema de prompts**: Configuración dinámica del comportamiento del chatbot
- **Filtrado de contenido**: Sistema de términos excluidos para moderar conversaciones
- **Responsive**: Diseño adaptable a dispositivos móviles

## Stack Tecnológico

### Frontend
- **React 19** con Vite
- **Tailwind CSS** para estilos
- **React Router DOM** para navegación
- **Axios** para peticiones HTTP
- **Context API** para estado global

### Backend
- **Express 5** (Node.js)
- **MongoDB** con Mongoose
- **JWT** para autenticación
- **bcrypt** para encriptación
- **Nodemailer** para emails
- **Anthropic SDK** (Claude AI)

## Estructura del Proyecto

```
Chatbot/
├── backend/
│   ├── src/
│   │   ├── config/        # Conexiones a BD
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── helpers/       # Funciones auxiliares
│   │   ├── middleware/    # Auth y validaciones
│   │   ├── models/        # Esquemas MongoDB
│   │   └── routes/        # Endpoints API
│   └── index.js           # Servidor Express
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── context/       # Estado global (Auth)
│   │   ├── hooks/         # Custom hooks
│   │   ├── layout/        # Layouts de página
│   │   ├── paginas/       # Vistas principales
│   │   ├── secure/        # Rutas protegidas
│   │   └── services/      # Servicios API
│   └── App.jsx            # Enrutador principal
│
└── README.md
```

## Instalación

### Prerrequisitos
- Node.js 18+
- MongoDB (local o Atlas)
- Cuenta de Anthropic (API Key de Claude)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Diego283227/Chatbot.git
cd Chatbot
```

### 2. Configurar Backend
```bash
cd backend
npm install
```

Crear archivo `.env`:
```env
PORT=4000
JWT_SECRET=tu_secreto_jwt
MONGO_URI=mongodb://localhost:27017/airbnb
MONGO_URI_USERS=mongodb+srv://...
MONGO_URI_ADMIN=mongodb+srv://...
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
ANTHROPIC_API_KEY=sk-ant-api...
FRONTEND_URL=http://localhost:5173
```

### 3. Configurar Frontend
```bash
cd frontend
npm install
```

Crear archivo `.env`:
```env
VITE_BACKEND_URL=http://localhost:4000
```

### 4. Ejecutar
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acceder a `http://localhost:5173`

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/usuarios` | Registro de usuario |
| POST | `/api/usuarios/login` | Iniciar sesión |
| GET | `/api/usuarios/confirmar/:token` | Confirmar cuenta |
| POST | `/api/usuarios/olvide-password` | Solicitar recuperación |
| POST | `/api/usuarios/olvide-password/:token` | Restablecer contraseña |

### Chatbot
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/chatbot/mensaje` | Enviar mensaje al bot |
| GET | `/api/chatbot/conversaciones` | Obtener historial |
| GET | `/api/chatbot/conversacion/:id` | Obtener conversación |
| DELETE | `/api/chatbot/conversacion/:id` | Eliminar conversación |

### Administración
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/estadisticas` | Dashboard stats |
| GET | `/api/admin/usuarios` | Listar usuarios |
| DELETE | `/api/admin/usuarios/:id` | Eliminar usuario |
| GET | `/api/admin/conversaciones` | Ver todas las conversaciones |

## Funcionalidades Principales

### Chat con IA
El chatbot puede responder consultas como:
- "¿Cuántos alojamientos hay en Manhattan?"
- "Muéstrame habitaciones privadas baratas"
- "¿Cuáles son los mejor valorados?"
- "Busca alojamientos en Brooklyn"

### Panel de Administración
- Dashboard con métricas en tiempo real
- Gestión de usuarios (ver, eliminar)
- Configuración de prompts del sistema
- Sistema de términos excluidos

## Autor

**Diego**
- GitHub: [@Diego283227](https://github.com/Diego283227)

## Licencia

Este proyecto está bajo la Licencia MIT.
