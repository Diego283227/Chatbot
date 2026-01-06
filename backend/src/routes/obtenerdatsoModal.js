// api/obtener-datos-contexto.js - Endpoint real conectado a MongoDB
import { MongoClient } from 'mongodb';

// 🔧 CONFIGURA ESTAS VARIABLES SEGÚN TU SETUP
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'airbnb'; // Cambia por el nombre de tu base de datos
const COLLECTION_NAME = 'listings'; // Cambia por el nombre de tu colección

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedClient = client;
    console.log('✅ Conectado a MongoDB');
    return client;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  console.log('📡 Endpoint llamado:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { userMessage, botResponse, conversacionId } = req.body;
    
    console.log('📥 Consulta recibida:', {
      userMessage,
      botResponse: botResponse?.substring(0, 100) + '...'
    });
    
    // Conectar a MongoDB
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Analizar el contexto para determinar qué tipo de consulta hacer
    const analisis = analizarConsulta(userMessage, botResponse);
    console.log('🔍 Análisis de consulta:', analisis);
    
    let resultado;
    
    switch (analisis.tipo) {
      case 'hosts_manhattan':
        resultado = await consultarHostsManhattan(collection, analisis.parametros);
        break;
      case 'hosts_general':
        resultado = await consultarHostsGeneral(collection, analisis.parametros);
        break;
      case 'estadisticas_ubicacion':
        resultado = await consultarEstadisticasUbicacion(collection, analisis.parametros);
        break;
      case 'estadisticas_precios':
        resultado = await consultarEstadisticasPrecios(collection, analisis.parametros);
        break;
      case 'alojamientos_filtrados':
        resultado = await consultarAlojamientosFiltrados(collection, analisis.parametros);
        break;
      case 'estadisticas_generales':
        resultado = await consultarEstadisticasGenerales(collection);
        break;
      default:
        resultado = await consultarDatosGenerales(collection, analisis.parametros);
        break;
    }
    
    console.log('📤 Enviando resultado:', resultado.tipo, resultado.datos?.length || 'N/A');
    res.status(200).json(resultado);
    
  } catch (error) {
    console.error('❌ Error en endpoint:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}

// 🔍 Función para analizar la consulta del usuario
function analizarConsulta(userMessage, botResponse) {
  const texto = `${userMessage} ${botResponse}`.toLowerCase();
  
  const parametros = {
    barrio: null,
    tipoHabitacion: null,
    precioMax: null,
    ordenPor: 'reviews'
  };
  
  // Detectar barrio/ubicación
  if (texto.includes('manhattan')) parametros.barrio = 'Manhattan';
  else if (texto.includes('brooklyn')) parametros.barrio = 'Brooklyn';
  else if (texto.includes('queens')) parametros.barrio = 'Queens';
  else if (texto.includes('bronx')) parametros.barrio = 'Bronx';
  
  // Detectar tipo de consulta específica
  if ((texto.includes('anfitrion') || texto.includes('host')) && texto.includes('manhattan')) {
    return { tipo: 'hosts_manhattan', parametros };
  }
  
  if (texto.includes('anfitrion') || texto.includes('host')) {
    return { tipo: 'hosts_general', parametros };
  }
  
  if (texto.includes('cuántos') || texto.includes('total') || texto.includes('cantidad')) {
    if (parametros.barrio) {
      return { tipo: 'estadisticas_ubicacion', parametros };
    }
    return { tipo: 'estadisticas_generales', parametros };
  }
  
  if (texto.includes('precio') || texto.includes('barato') || texto.includes('caro')) {
    return { tipo: 'estadisticas_precios', parametros };
  }
  
  if (texto.includes('habitacion') || texto.includes('alojamiento') || texto.includes('apartamento')) {
    // Detectar tipo de habitación
    if (texto.includes('privada') || texto.includes('private')) parametros.tipoHabitacion = 'Private room';
    else if (texto.includes('compartida') || texto.includes('shared')) parametros.tipoHabitacion = 'Shared room';
    else if (texto.includes('completo') || texto.includes('entire')) parametros.tipoHabitacion = 'Entire home/apt';
    
    return { tipo: 'alojamientos_filtrados', parametros };
  }
  
  // Por defecto, consulta general
  return { tipo: 'consulta_general', parametros };
}

// 📊 Consultas específicas a MongoDB

async function consultarHostsManhattan(collection, params) {
  const pipeline = [
    {
      $match: {
        neighbourhood_group: /manhattan/i,
        host_name: { $exists: true, $ne: null },
        number_of_reviews: { $gte: 5 } // Solo hosts con al menos 5 reviews
      }
    },
    {
      $group: {
        _id: '$host_name',
        host_id: { $first: '$host_id' },
        totalPropiedades: { $sum: 1 },
        totalReviews: { $sum: '$number_of_reviews' },
        precioPromedio: { $avg: '$price' },
        reviewsPromedio: { $avg: '$number_of_reviews' }
      }
    },
    {
      $match: {
        totalReviews: { $gte: 20 } // Solo hosts con buen número de reviews
      }
    },
    { $sort: { totalReviews: -1 } },
    { $limit: 15 }
  ];
  
  const datos = await collection.aggregate(pipeline).toArray();
  
  return {
    tipo: 'hosts',
    datos: datos,
    descripcion: `Top ${datos.length} anfitriones mejor valorados en Manhattan`,
    filtros: { ubicacion: 'Manhattan', ordenPor: 'reviews' }
  };
}

async function consultarHostsGeneral(collection, params) {
  const matchStage = {
    host_name: { $exists: true, $ne: null },
    number_of_reviews: { $gte: 5 }
  };
  
  if (params.barrio) {
    matchStage.neighbourhood_group = new RegExp(params.barrio, 'i');
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$host_name',
        host_id: { $first: '$host_id' },
        totalPropiedades: { $sum: 1 },
        totalReviews: { $sum: '$number_of_reviews' },
        precioPromedio: { $avg: '$price' },
        ubicacionPrincipal: { $first: '$neighbourhood_group' }
      }
    },
    { $sort: { totalReviews: -1 } },
    { $limit: 20 }
  ];
  
  const datos = await collection.aggregate(pipeline).toArray();
  
  return {
    tipo: 'hosts',
    datos: datos,
    descripcion: `Top ${datos.length} anfitriones${params.barrio ? ` en ${params.barrio}` : ''}`,
    filtros: params
  };
}

async function consultarEstadisticasUbicacion(collection, params) {
  const pipeline = [
    {
      $match: {
        neighbourhood_group: { $exists: true, $ne: null },
        ...(params.barrio && { neighbourhood_group: new RegExp(params.barrio, 'i') })
      }
    },
    {
      $group: {
        _id: '$neighbourhood_group',
        total: { $sum: 1 },
        precioPromedio: { $avg: '$price' },
        disponibilidadPromedio: { $avg: '$availability_365' },
        totalReviews: { $sum: '$number_of_reviews' },
        reviewsPromedio: { $avg: '$number_of_reviews' }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 10 }
  ];
  
  const datos = await collection.aggregate(pipeline).toArray();
  
  return {
    tipo: 'barrios',
    datos: datos,
    descripcion: 'Estadísticas por ubicación geográfica',
    filtros: params
  };
}

async function consultarEstadisticasPrecios(collection, params) {
  const matchStage = {
    price: { $gt: 0, $lt: 2000 }
  };
  
  if (params.barrio) {
    matchStage.neighbourhood_group = new RegExp(params.barrio, 'i');
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$room_type',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        medianPrice: { $avg: '$price' } // Aproximación de mediana
      }
    },
    { $sort: { avgPrice: 1 } }
  ];
  
  const datos = await collection.aggregate(pipeline).toArray();
  const total = await collection.countDocuments(matchStage);
  
  // Calcular porcentajes
  const datosConPorcentaje = datos.map(item => ({
    ...item,
    porcentaje: (item.count / total) * 100
  }));
  
  return {
    tipo: 'estadisticas',
    datos: datosConPorcentaje,
    totalRegistros: total,
    descripcion: `Análisis de precios${params.barrio ? ` en ${params.barrio}` : ''}`,
    filtros: params
  };
}

async function consultarAlojamientosFiltrados(collection, params) {
  const filtros = {
    price: { $gt: 0, $lt: 1000 }
  };
  
  if (params.barrio) {
    filtros.neighbourhood_group = new RegExp(params.barrio, 'i');
  }
  
  if (params.tipoHabitacion) {
    filtros.room_type = params.tipoHabitacion;
  }
  
  // Ordenar por número de reviews por defecto
  const datos = await collection
    .find(filtros)
    .sort({ number_of_reviews: -1 })
    .limit(25)
    .toArray();
  
  return {
    tipo: 'listings',
    datos: datos,
    descripcion: `${datos.length} alojamientos encontrados`,
    filtros: filtros
  };
}

async function consultarEstadisticasGenerales(collection) {
  const [
    totalAlojamientos,
    estadisticasTipo,
    estadisticasUbicacion,
    precioPromedio
  ] = await Promise.all([
    collection.countDocuments(),
    collection.aggregate([
      {
        $group: {
          _id: '$room_type',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray(),
    collection.aggregate([
      {
        $group: {
          _id: '$neighbourhood_group',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray(),
    collection.aggregate([
      {
        $match: { price: { $gt: 0, $lt: 2000 } }
      },
      {
        $group: {
          _id: null,
          promedio: { $avg: '$price' }
        }
      }
    ]).toArray()
  ]);
  
  // Combinar estadísticas
  const datosCompletos = estadisticasTipo.map(item => ({
    ...item,
    porcentaje: (item.count / totalAlojamientos) * 100
  }));
  
  return {
    tipo: 'estadisticas',
    datos: datosCompletos,
    totalRegistros: totalAlojamientos,
    descripcion: `Estadísticas generales - ${totalAlojamientos.toLocaleString()} alojamientos total`,
    metadatos: {
      precioPromedio: precioPromedio[0]?.promedio || 0,
      distribucienUbicacion: estadisticasUbicacion
    }
  };
}

async function consultarDatosGenerales(collection, params) {
  // Consulta por defecto - alojamientos populares
  const filtros = {
    price: { $gt: 0, $lt: 500 },
    number_of_reviews: { $gte: 5 }
  };
  
  if (params.barrio) {
    filtros.neighbourhood_group = new RegExp(params.barrio, 'i');
  }
  
  const datos = await collection
    .find(filtros)
    .sort({ number_of_reviews: -1 })
    .limit(20)
    .toArray();
  
  return {
    tipo: 'listings',
    datos: datos,
    descripcion: `${datos.length} alojamientos populares`,
    filtros: filtros
  };
}