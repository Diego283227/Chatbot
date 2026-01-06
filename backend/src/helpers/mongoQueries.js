// helpers/mongoQueries.js
import mongoose from 'mongoose';

export const ejecutarConsultaMongoDB = async (consulta) => {
    try {
        console.log('=== EJECUTANDO CONSULTA MONGODB AIRBNB ===');
        console.log('Consulta recibida:', consulta);
        
        const db = mongoose.connection.useDb('airbnb');
        
        // Detectar tipo de consulta basado en el mensaje del usuario
        const consultaLower = consulta.toLowerCase();
        
        // 🔧 FUNCIÓN MEJORADA PARA DETECTAR NOMBRES PROPIOS Y UBICACIONES
        const extraerNombresLugares = (texto) => {
            console.log('Texto original para extraer lugares:', texto);
            
            const textoLimpio = texto
                .replace(/[¿?¡!.,;:()]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            console.log('Texto limpio:', textoLimpio);
            
            // PRIMERO: Buscar ubicaciones conocidas de NYC directamente
            const ubicacionesNYC = [
                'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island',
                'harlem', 'williamsburg', 'chelsea', 'soho', 'tribeca',
                'east village', 'west village', 'upper east side', 'upper west side',
                'midtown', 'downtown', 'chinatown', 'little italy', 'nolita',
                'greenwich village', 'financial district', 'times square',
                'central park', 'park slope', 'dumbo', 'red hook', 'astoria',
                'long island city', 'flushing', 'jackson heights'
            ];
            
            const textoLower = textoLimpio.toLowerCase();
            const ubicacionesEncontradas = [];
            
            // Buscar ubicaciones conocidas en el texto
            for (const ubicacion of ubicacionesNYC) {
                if (textoLower.includes(ubicacion)) {
                    // Capitalizar primera letra de cada palabra
                    const ubicacionCapitalizada = ubicacion
                        .split(' ')
                        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
                        .join(' ');
                    ubicacionesEncontradas.push(ubicacionCapitalizada);
                    console.log('Ubicación encontrada:', ubicacionCapitalizada);
                }
            }
            
            if (ubicacionesEncontradas.length > 0) {
                return ubicacionesEncontradas;
            }
            
            // SEGUNDO: Si no encuentra ubicaciones conocidas, usar el método original
            const palabras = textoLimpio.split(' ');
            
            // Palabras que NO son lugares (expandida para Airbnb)
            const palabrasExcluidas = [
                'qué', 'que', 'cuál', 'cual', 'cuáles', 'cuales', 'cómo', 'como',
                'dónde', 'donde', 'cuándo', 'cuando', 'por', 'para', 'con', 'sin',
                'muéstrame', 'muestra', 'busca', 'encuentra', 'dime', 'dame',
                'airbnb', 'alojamiento', 'alojamientos', 'habitación', 'habitacion',
                'casa', 'casas', 'apartamento', 'departamento', 'hotel', 'room',
                'precio', 'precios', 'barato', 'caro', 'económico', 'economico',
                'las', 'los', 'una', 'uno', 'del', 'de', 'la', 'el', 'en',
                'mejor', 'mejores', 'top', 'disponible', 'disponibles', 'cerca'
            ];
            
            const nombresDetectados = palabras.filter(palabra => {
                if (palabra.length < 2) return false;
                if (palabra[0] !== palabra[0].toUpperCase()) return false;
                if (palabrasExcluidas.includes(palabra.toLowerCase())) return false;
                if (palabra === palabra.toUpperCase() && palabra.length > 1) return false;
                return true;
            });
            
            console.log('Nombres detectados por método original:', nombresDetectados);
            return nombresDetectados;
        };
        
        // Función para extraer números (precios, etc.)
        const extraerNumeros = (texto) => {
            const numeros = texto.match(/\b\d+\b/g);
            return numeros ? numeros.map(n => parseInt(n)) : [];
        };
        
        const nombresPropio = extraerNombresLugares(consulta);
        const numeros = extraerNumeros(consulta);
        console.log('Nombres/lugares detectados:', nombresPropio);
        console.log('Números detectados:', numeros);
        
        // 1. BÚSQUEDA POR UBICACIÓN (NEIGHBOURHOOD, NEIGHBOURHOOD_GROUP)
        if (consultaLower.includes('barrio') || consultaLower.includes('zona') || 
            consultaLower.includes('área') || consultaLower.includes('area') ||
            consultaLower.includes('ubicación') || consultaLower.includes('ubicacion') ||
            consultaLower.includes('neighborhood') || consultaLower.includes('manhattan') ||
            consultaLower.includes('brooklyn') || consultaLower.includes('harlem') ||
            consultaLower.includes('queens') || consultaLower.includes('bronx') ||
            consultaLower.includes('alojamientos en') || consultaLower.includes('en ')) {
            
            console.log('Detectada consulta por ubicación');
            
            let ubicacion = nombresPropio.join(' ').trim();
            
            // Si no se detectó por nombres propios, buscar directamente en el texto
            if (!ubicacion || ubicacion.length === 0) {
                console.log('No se detectó por nombres propios, buscando directamente...');
                
                // Buscar palabras clave de ubicación en el texto
                const ubicacionesBuscar = ['manhattan', 'brooklyn', 'queens', 'bronx', 'harlem', 
                                         'williamsburg', 'chelsea', 'soho', 'tribeca'];
                
                for (const lugar of ubicacionesBuscar) {
                    if (consultaLower.includes(lugar)) {
                        ubicacion = lugar.charAt(0).toUpperCase() + lugar.slice(1);
                        console.log('Ubicación encontrada directamente:', ubicacion);
                        break;
                    }
                }
            }
            
            if (ubicacion && ubicacion.length > 0) {
                console.log('Buscando en ubicación:', ubicacion);
                
                // ===== DEBUG: VERIFICAR QUE HAY EN LA BD =====
                console.log('=== DEBUG UBICACIÓN ===');
                
                // 1. Contar total de documentos
                const totalDocs = await db.collection('listings').countDocuments();
                console.log('Total documentos en la colección:', totalDocs);
                
                // 2. Verificar valores únicos de neighbourhood_group
                const gruposBarrio = await db.collection('listings').distinct('neighbourhood_group');
                console.log('Grupos de barrios disponibles:', gruposBarrio);
                
                // 3. Buscar documentos que contengan la ubicación de cualquier forma
                const testBusqueda1 = await db.collection('listings').countDocuments({
                    neighbourhood_group: { $regex: ubicacion, $options: 'i' }
                });
                console.log(`Documentos con "${ubicacion}" en neighbourhood_group:`, testBusqueda1);
                
                const testBusqueda2 = await db.collection('listings').countDocuments({
                    neighbourhood: { $regex: ubicacion, $options: 'i' }
                });
                console.log(`Documentos con "${ubicacion}" en neighbourhood:`, testBusqueda2);
                
                // 4. Probar búsqueda más amplia
                const testBusqueda3 = await db.collection('listings').countDocuments({
                    $or: [
                        { neighbourhood: { $regex: ubicacion, $options: 'i' } },
                        { neighbourhood_group: { $regex: ubicacion, $options: 'i' } },
                        { name: { $regex: ubicacion, $options: 'i' } }
                    ]
                });
                console.log(`Documentos con "${ubicacion}" en cualquier campo:`, testBusqueda3);
                
                // ===== FIN DEBUG =====
                
                const resultado = await db.collection('listings').find({
                    $or: [
                        { neighbourhood: { $regex: ubicacion, $options: 'i' } },
                        { neighbourhood_group: { $regex: ubicacion, $options: 'i' } },
                        { name: { $regex: ubicacion, $options: 'i' } }
                    ]
                })
                .sort({ 
                    price: 1,           // Primero por precio
                    number_of_reviews: -1,  // Luego por reseñas (más reseñas primero)
                    _id: 1              // Finalmente por ID para total consistencia
                })
                .limit(20)
                .project({
                    name: 1,
                    neighbourhood: 1,
                    neighbourhood_group: 1,
                    price: 1,
                    room_type: 1,
                    host_name: 1,
                    availability_365: 1,
                    number_of_reviews: 1
                })
                .toArray();
                
                console.log('Alojamientos encontrados:', resultado.length);
                
                if (resultado.length > 0) {
                    console.log('=== VERIFICACIÓN DE ORDEN CONSISTENTE ===');
                    console.log('Total resultados encontrados:', resultado.length);
                    console.log('Primeros 5 resultados (orden verificado):');
                    resultado.slice(0, 5).forEach((doc, idx) => {
                        console.log(`${idx + 1}. ${doc.name?.substring(0, 30)}... - ${doc.price} - ${doc.number_of_reviews} reseñas - ID: ${doc._id}`);
                    });
                    console.log('=== FIN VERIFICACIÓN ===');
                    
                    return {
                        tipo: 'lista',
                        datos: resultado,
                        descripcion: `Alojamientos en ${ubicacion}`
                    };
                }
            } else {
                console.log('No se pudo extraer ubicación específica, buscando alojamientos generales en NYC...');
                
                // Si no se puede extraer ubicación específica, mostrar una muestra general
                const resultado = await db.collection('listings').find({})
                    .sort({ 
                        price: 1,
                        number_of_reviews: -1,
                        _id: 1
                    })
                    .limit(15)
                    .project({
                        name: 1,
                        neighbourhood: 1,
                        neighbourhood_group: 1,
                        price: 1,
                        room_type: 1,
                        host_name: 1,
                        availability_365: 1,
                        number_of_reviews: 1
                    })
                    .toArray();
                
                console.log('Mostrando alojamientos generales:', resultado.length);
                
                if (resultado.length > 0) {
                    return {
                        tipo: 'lista',
                        datos: resultado,
                        descripcion: 'Alojamientos disponibles en Nueva York'
                    };
                }
            }
        }
        
        // 2. BÚSQUEDA POR RANGO DE PRECIOS
        if (consultaLower.includes('precio') || consultaLower.includes('cuesta') || 
            consultaLower.includes('barato') || consultaLower.includes('económico') ||
            consultaLower.includes('caro') || consultaLower.includes('entre') ||
            consultaLower.includes('menos de') || consultaLower.includes('más de')) {
            
            console.log('Detectada consulta por precio');
            
            let filtroPrecios = {};
            
            // Detectar rangos específicos
            if (consultaLower.includes('menos de') && numeros.length > 0) {
                filtroPrecios.price = { $lte: numeros[0] };
            } else if (consultaLower.includes('más de') && numeros.length > 0) {
                filtroPrecios.price = { $gte: numeros[0] };
            } else if (consultaLower.includes('entre') && numeros.length >= 2) {
                filtroPrecios.price = { $gte: numeros[0], $lte: numeros[1] };
            } else if (consultaLower.includes('barato') || consultaLower.includes('económico')) {
                filtroPrecios.price = { $lte: 100 };
            } else if (consultaLower.includes('caro')) {
                filtroPrecios.price = { $gte: 200 };
            } else if (numeros.length > 0) {
                // Si solo hay un número, buscar alrededor de ese precio
                filtroPrecios.price = { $gte: numeros[0] - 50, $lte: numeros[0] + 50 };
            }
            
            // Agregar filtro de ubicación si se detecta
            if (nombresPropio.length > 0) {
                const ubicacion = nombresPropio.join(' ');
                filtroPrecios.$or = [
                    { neighbourhood: { $regex: ubicacion, $options: 'i' } },
                    { neighbourhood_group: { $regex: ubicacion, $options: 'i' } }
                ];
            }
            
            if (Object.keys(filtroPrecios).length > 0) {
                const resultado = await db.collection('listings').find(filtroPrecios)
                    .sort({ price: 1 })
                    .limit(20)
                    .project({
                        name: 1,
                        neighbourhood: 1,
                        neighbourhood_group: 1,
                        price: 1,
                        room_type: 1,
                        host_name: 1,
                        availability_365: 1
                    })
                    .toArray();
                
                return {
                    tipo: 'lista',
                    datos: resultado,
                    descripcion: `Alojamientos filtrados por precio`
                };
            }
        }
        
        // 3. BÚSQUEDA POR TIPO DE HABITACIÓN
        if (consultaLower.includes('habitación') || consultaLower.includes('habitacion') ||
            consultaLower.includes('apartment') || consultaLower.includes('apartamento') ||
            consultaLower.includes('casa') || consultaLower.includes('private') ||
            consultaLower.includes('shared') || consultaLower.includes('entire')) {
            
            console.log('Detectada búsqueda por tipo de habitación');
            
            let tipoHabitacion = null;
            
            if (consultaLower.includes('private') || consultaLower.includes('habitación privada')) {
                tipoHabitacion = 'Private room';
            } else if (consultaLower.includes('shared') || consultaLower.includes('compartida')) {
                tipoHabitacion = 'Shared room';
            } else if (consultaLower.includes('entire') || consultaLower.includes('casa completa') || 
                      consultaLower.includes('apartamento completo')) {
                tipoHabitacion = 'Entire home/apt';
            }
            
            let filtro = {};
            if (tipoHabitacion) {
                filtro.room_type = tipoHabitacion;
            }
            
            // Agregar ubicación si se detecta
            if (nombresPropio.length > 0) {
                const ubicacion = nombresPropio.join(' ');
                filtro.$or = [
                    { neighbourhood: { $regex: ubicacion, $options: 'i' } },
                    { neighbourhood_group: { $regex: ubicacion, $options: 'i' } }
                ];
            }
            
            const resultado = await db.collection('listings').find(filtro)
                .sort({ 
                    price: 1, 
                    _id: 1  // Orden consistente
                })
                .limit(20)
                .project({
                    name: 1,
                    neighbourhood: 1,
                    room_type: 1,
                    price: 1,
                    host_name: 1,
                    availability_365: 1
                })
                .toArray();
            
            return {
                tipo: 'lista',
                datos: resultado,
                descripcion: `Alojamientos por tipo de habitación`
            };
        }
        
        // 4. BÚSQUEDA POR HOST/ANFITRIÓN
        if (consultaLower.includes('host') || consultaLower.includes('anfitrión') || 
            consultaLower.includes('anfitrion') || consultaLower.includes('propietario')) {
            
            console.log('Detectada consulta por anfitrión');
            
            const nombreHost = nombresPropio.join(' ').trim();
            
            if (nombreHost) {
                const resultado = await db.collection('listings').find({
                    host_name: { $regex: nombreHost, $options: 'i' }
                })
                .sort({ 
                    number_of_reviews: -1, 
                    _id: 1  // Orden secundario consistente
                })
                .limit(20)
                .project({
                    name: 1,
                    host_name: 1,
                    neighbourhood: 1,
                    price: 1,
                    room_type: 1,
                    number_of_reviews: 1,
                    availability_365: 1
                })
                .toArray();
                
                return {
                    tipo: 'lista',
                    datos: resultado,
                    descripcion: `Alojamientos del anfitrión ${nombreHost}`
                };
            }
        }
        
        // 5. CONSULTAS POR DISPONIBILIDAD
        if (consultaLower.includes('disponible') || consultaLower.includes('disponibilidad') ||
            consultaLower.includes('libre') || consultaLower.includes('availability')) {
            
            console.log('Detectada consulta por disponibilidad');
            
            let filtro = { availability_365: { $gt: 0 } };
            
            // Agregar ubicación si se detecta
            if (nombresPropio.length > 0) {
                const ubicacion = nombresPropio.join(' ');
                filtro.$or = [
                    { neighbourhood: { $regex: ubicacion, $options: 'i' } },
                    { neighbourhood_group: { $regex: ubicacion, $options: 'i' } }
                ];
            }
            
            const resultado = await db.collection('listings').find(filtro)
                .sort({ 
                    availability_365: -1, 
                    _id: 1  // Orden secundario consistente
                })
                .limit(20)
                .project({
                    name: 1,
                    neighbourhood: 1,
                    price: 1,
                    room_type: 1,
                    host_name: 1,
                    availability_365: 1
                })
                .toArray();
            
            return {
                tipo: 'lista',
                datos: resultado,
                descripcion: `Alojamientos disponibles`
            };
        }
        
        // 6. CONSULTAS POR RESEÑAS/RATING
        if (consultaLower.includes('mejor') || consultaLower.includes('top') || 
            consultaLower.includes('reseñas') || consultaLower.includes('reviews') ||
            consultaLower.includes('calificados') || consultaLower.includes('recomendados')) {
            
            console.log('Detectada consulta por reseñas');
            
            let filtro = { number_of_reviews: { $gt: 0 } };
            
            // Agregar ubicación si se detecta
            if (nombresPropio.length > 0) {
                const ubicacion = nombresPropio.join(' ');
                filtro.$or = [
                    { neighbourhood: { $regex: ubicacion, $options: 'i' } },
                    { neighbourhood_group: { $regex: ubicacion, $options: 'i' } }
                ];
            }
            
            const resultado = await db.collection('listings').find(filtro)
                .sort({ 
                    number_of_reviews: -1, 
                    _id: 1  // Orden secundario consistente
                })
                .limit(20)
                .project({
                    name: 1,
                    neighbourhood: 1,
                    price: 1,
                    room_type: 1,
                    host_name: 1,
                    number_of_reviews: 1,
                    availability_365: 1
                })
                .toArray();
            
            return {
                tipo: 'lista',
                datos: resultado,
                descripcion: `Alojamientos mejor valorados`
            };
        }
        
        // 7. ESTADÍSTICAS GENERALES
        if (consultaLower.includes('estadística') || consultaLower.includes('total') || 
            consultaLower.includes('cuántos') || consultaLower.includes('cuantos') ||
            consultaLower.includes('promedio') || consultaLower.includes('análisis')) {
            
            console.log('Detectada consulta de estadísticas');
            
            const stats = await db.collection('listings').aggregate([
                {
                    $facet: {
                        total: [{ $count: "count" }],
                        precioPromedio: [
                            { $match: { price: { $exists: true, $gt: 0 } } },
                            { $group: { _id: null, avg: { $avg: "$price" }, min: { $min: "$price" }, max: { $max: "$price" } } }
                        ],
                        porTipoHabitacion: [
                            { $group: { _id: "$room_type", count: { $sum: 1 } } },
                            { $sort: { count: -1 } }
                        ],
                        porBarrio: [
                            { $group: { _id: "$neighbourhood_group", count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 5 }
                        ],
                        disponibilidad: [
                            { $match: { availability_365: { $exists: true } } },
                            { $group: { _id: null, disponibles: { $sum: { $cond: [{ $gt: ["$availability_365", 0] }, 1, 0] } } } }
                        ]
                    }
                }
            ]).toArray();
            
            return {
                tipo: 'estadisticas',
                datos: stats[0],
                descripcion: 'Estadísticas generales de Airbnb'
            };
        }
        
        // 8. BÚSQUEDA GENERAL SI NO COINCIDE CON NINGÚN PATRÓN
        console.log('Entrando en búsqueda general...');
        console.log('Nombres propios encontrados:', nombresPropio);
        
        // Si hay nombres propios o si la consulta incluye palabras clave de alojamientos
        if (nombresPropio.length > 0 || 
            consultaLower.includes('alojamiento') || 
            consultaLower.includes('habitación') ||
            consultaLower.includes('casa') ||
            consultaLower.includes('apartamento')) {
            
            console.log('Realizando búsqueda general...');
            
            let filtrosGenerales = {};
            
            if (nombresPropio.length > 0) {
                const busqueda = nombresPropio.join(' ');
                console.log('Buscando por nombres propios:', busqueda);
                
                filtrosGenerales = {
                    $or: [
                        { name: { $regex: busqueda, $options: 'i' } },
                        { neighbourhood: { $regex: busqueda, $options: 'i' } },
                        { neighbourhood_group: { $regex: busqueda, $options: 'i' } },
                        { host_name: { $regex: busqueda, $options: 'i' } }
                    ]
                };
            } else {
                console.log('Búsqueda general sin nombres propios específicos');
                filtrosGenerales = {}; // Buscar todo
            }
            
            const resultado = await db.collection('listings').find(filtrosGenerales)
                .sort({ 
                    price: 1,
                    number_of_reviews: -1,
                    _id: 1
                })
                .limit(20)
                .project({
                    name: 1,
                    neighbourhood: 1,
                    neighbourhood_group: 1,
                    price: 1,
                    room_type: 1,
                    host_name: 1,
                    number_of_reviews: 1
                })
                .toArray();
            
            console.log('Resultados de búsqueda general:', resultado.length);
            
            if (resultado.length > 0) {
                const descripcion = nombresPropio.length > 0 
                    ? `Resultados relacionados con "${nombresPropio.join(' ')}"` 
                    : 'Alojamientos disponibles';
                    
                return {
                    tipo: 'lista',
                    datos: resultado,
                    descripcion: descripcion
                };
            }
        }
        
        console.log('No se encontraron resultados en ninguna búsqueda');
        console.log('Consulta original:', consulta);
        console.log('Consulta en minúsculas:', consultaLower);
        console.log('Nombres detectados:', nombresPropio);
        
        return null;
    } catch (error) {
        console.error('Error ejecutando consulta MongoDB:', error);
        return null;
    }
};

// Función para formatear resultados para el prompt
export const formatearResultadosParaIA = (resultado) => {
    if (!resultado) return '';
    
    let texto = `\nRESULTADOS DE LA CONSULTA:\n`;
    
    switch (resultado.tipo) {
        case 'lista':
            texto += resultado.datos.map((listing, idx) => {
                let info = `${idx + 1}. "${listing.name}"`;
                if (listing.price) info += ` - $${listing.price}/noche`;
                if (listing.room_type) info += ` - ${listing.room_type}`;
                if (listing.neighbourhood) info += ` - ${listing.neighbourhood}`;
                if (listing.neighbourhood_group) info += ` (${listing.neighbourhood_group})`;
                if (listing.host_name) info += ` - Host: ${listing.host_name}`;
                if (listing.number_of_reviews) info += ` - ${listing.number_of_reviews} reseñas`;
                if (listing.availability_365 !== undefined) info += ` - ${listing.availability_365} días disponibles`;
                return info;
            }).join('\n');
            break;
            
        case 'estadisticas':
            const stats = resultado.datos;
            texto += `Total de alojamientos: ${stats.total[0]?.count || 0}\n`;
            if (stats.precioPromedio[0]) {
                texto += `Precio promedio: $${stats.precioPromedio[0].avg.toFixed(2)}/noche\n`;
                texto += `Rango de precios: $${stats.precioPromedio[0].min} - $${stats.precioPromedio[0].max}\n`;
            }
            if (stats.disponibilidad[0]) {
                texto += `Alojamientos disponibles: ${stats.disponibilidad[0].disponibles}\n`;
            }
            texto += `Tipos de habitación:\n`;
            stats.porTipoHabitacion.forEach(tipo => {
                texto += `  - ${tipo._id}: ${tipo.count} alojamientos\n`;
            });
            texto += `Top barrios:\n`;
            stats.porBarrio.forEach(barrio => {
                texto += `  - ${barrio._id}: ${barrio.count} alojamientos\n`;
            });
            break;
    }
    
    return texto;
};