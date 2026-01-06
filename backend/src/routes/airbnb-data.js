// src/routes/airbnb-data.js - VERSIÓN COMPLETA QUE USA TU SISTEMA MONGODB
import express from 'express';
import { ejecutarConsultaMongoDB } from '../helpers/mongoQueries.js';

const router = express.Router();

// 🏥 ENDPOINT: GET /api/airbnb-data/health
router.get('/health', async (req, res) => {
  try {
    console.log('🏥 [AIRBNB-DATA] Health check solicitado');
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'Servicio de datos de Airbnb funcionando correctamente',
      endpoint: '/api/airbnb-data/obtener-contexto'
    });
    
  } catch (error) {
    console.error('❌ [AIRBNB-DATA] Error en health check:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Servicio no disponible'
    });
  }
});

// 🎯 ENDPOINT: POST /api/airbnb-data/obtener-contexto
router.post('/obtener-contexto', async (req, res) => {
  try {
    const { userMessage, botResponse, conversacionId } = req.body;
    
    console.log('🎯 [AIRBNB-DATA] Solicitud recibida:', {
      userMessage: userMessage?.substring(0, 50) + '...',
      botResponse: botResponse?.substring(0, 50) + '...',
      conversacionId: conversacionId
    });
    
    // Validar datos de entrada
    if (!userMessage) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere userMessage'
      });
    }
    
    // 🔍 USAR LA MISMA LÓGICA QUE YA FUNCIONA EN TU CHATBOT
    console.log('🔍 [AIRBNB-DATA] Ejecutando consulta MongoDB con:', userMessage);
    
    const resultadosDB = await ejecutarConsultaMongoDB(userMessage);
    
    if (resultadosDB && resultadosDB.datos && resultadosDB.datos.length > 0) {
      console.log('✅ [AIRBNB-DATA] Datos encontrados:', {
        tipo: resultadosDB.tipo,
        cantidad: resultadosDB.datos.length,
        descripcion: resultadosDB.descripcion
      });
      
      // 🎯 CONVERTIR AL FORMATO QUE ESPERA EL FRONTEND
      let datosFormateados;
      
      switch (resultadosDB.tipo) {
        case 'lista':  // ← Tu sistema devuelve "lista"
          datosFormateados = {
            tipo: 'listings',  // ← Pero el modal espera "listings"
            datos: resultadosDB.datos.map(item => ({
              _id: item._id,
              name: item.name,
              price: item.price,
              neighbourhood_group: item.neighbourhood_group,
              neighbourhood: item.neighbourhood,
              room_type: item.room_type,
              host_name: item.host_name,
              number_of_reviews: item.number_of_reviews,
              availability_365: item.availability_365,
              minimum_nights: item.minimum_nights || 1
            })),
            descripcion: resultadosDB.descripcion
          };
          break;
          
        case 'estadisticas':
          datosFormateados = {
            tipo: 'estadisticas',
            datos: resultadosDB.datos,
            descripcion: resultadosDB.descripcion,
            totalRegistros: resultadosDB.datos.total?.[0]?.count
          };
          break;
          
        default:
          // Para cualquier otro tipo, intentar convertir a listings
          datosFormateados = {
            tipo: 'listings',
            datos: Array.isArray(resultadosDB.datos) ? resultadosDB.datos.map(item => ({
              _id: item._id || `item-${Date.now()}`,
              name: item.name || item.title || 'Sin nombre',
              price: item.price || 0,
              neighbourhood_group: item.neighbourhood_group || 'N/A',
              neighbourhood: item.neighbourhood || 'N/A',
              room_type: item.room_type || 'N/A',
              host_name: item.host_name || 'N/A',
              number_of_reviews: item.number_of_reviews || 0,
              availability_365: item.availability_365 || 0,
              minimum_nights: item.minimum_nights || 1
            })) : [],
            descripcion: resultadosDB.descripcion || 'Datos encontrados'
          };
      }
      
      // Agregar metadatos
      datosFormateados.userMessage = userMessage;
      datosFormateados.botResponse = botResponse;
      datosFormateados.timestamp = Date.now();
      datosFormateados.fuenteDatos = 'mongodb';
      
      console.log('📤 [AIRBNB-DATA] Enviando respuesta formateada:', {
        tipo: datosFormateados.tipo,
        cantidadDatos: datosFormateados.datos?.length || 0
      });
      
      // 🔍 [DEBUG TEMPORAL] - REMOVER DESPUÉS DE VERIFICAR
      console.log('🔍 [DEBUG] DATOS QUE SE VAN A ENVIAR:');
      console.log('Tipo original:', resultadosDB.tipo);
      console.log('Tipo convertido:', datosFormateados.tipo);
      console.log('Cantidad de datos:', datosFormateados.datos?.length);
      console.log('Descripción:', datosFormateados.descripcion);
      console.log('Primeros 2 elementos:', datosFormateados.datos?.slice(0, 2));
      
      res.json(datosFormateados);
      
    } else {
      console.log('⚠️ [AIRBNB-DATA] No se encontraron datos en MongoDB');
      
      // Respuesta vacía pero válida
      res.json({
        tipo: 'sin_datos',
        datos: [],
        descripcion: 'No se encontraron resultados para esta consulta',
        userMessage: userMessage,
        botResponse: botResponse,
        timestamp: Date.now(),
        fuenteDatos: 'mongodb'
      });
    }
    
  } catch (error) {
    console.error('❌ [AIRBNB-DATA] Error procesando solicitud:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al consultar la base de datos de Airbnb',
      timestamp: Date.now()
    });
  }
});

// 🔍 ENDPOINT DE PRUEBA (opcional)
router.get('/test', (req, res) => {
  console.log('🧪 [AIRBNB-DATA] Test endpoint alcanzado');
  res.json({
    message: 'Endpoint de prueba funcionando',
    timestamp: new Date(),
    endpoints: [
      'GET /api/airbnb-data/health',
      'GET /api/airbnb-data/test',
      'POST /api/airbnb-data/obtener-contexto'
    ]
  });
});

export default router;