// Chat.jsx - URLs CORREGIDAS para hacer match con el backend
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { chatbotService } from '../../services/chatbotService';
import ModalDetalles from './ModalDetalles';

const Chat = () => {
  const {
    conversacionActual,
    conversaciones,
    setConversaciones,
    onNuevaConversacion,
    cargarConversacionPorId,
    chatInicializado
  } = useOutletContext();

  const { id } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosModal, setDatosModal] = useState(null);
  const [cargandoConversacion, setCargandoConversacion] = useState(false);
  const [terminosExcluidos, setTerminosExcluidos] = useState([]);
  const [mostrarAlertaTermino, setMostrarAlertaTermino] = useState(false);
  const [terminoDetectado, setTerminoDetectado] = useState('');
  const [escribiendoTerminoProhibido, setEscribiendoTerminoProhibido] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState({ available: true, lastCheck: null });
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-apertura del modal - MEJORADO y CONTROLADO
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Solo auto-abrir si:
    // 1. Hay datos nuevos
    // 2. El modal no está ya abierto
    // 3. Los datos son importantes (listings, estadisticas, hosts)
    // 4. No es una prueba manual
    // if (datosModal && 
    //     !modalAbierto && 
    //     ['listings', 'estadisticas', 'hosts', 'barrios'].includes(datosModal.tipo) &&
    //     datosModal.fuenteDatos !== 'prueba') {
      
    //   // Solo auto-abrir después de un tiempo más largo para que no sea molesto
    //   timerRef.current = setTimeout(() => {
    //     // Verificar una vez más que el usuario no ha cerrado el modal manualmente
    //     if (datosModal && !modalAbierto) {
    //       setModalAbierto(true);
    //     }
    //     timerRef.current = null;
    //   }, 3000); // 3 segundos para ser menos molesto
    // }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [datosModal?.timestamp, modalAbierto]);

  useEffect(() => {
    cargarTerminosExcluidos();
    // Verificar disponibilidad del endpoint al cargar
    verificarEndpoint();
  }, []);

  const cargarTerminosExcluidos = async () => {
    try {
      const terminos = await chatbotService.obtenerTerminosExcluidos();
      setTerminosExcluidos(terminos || []);
    } catch (error) {
      console.error('Error al cargar términos excluidos:', error);
      setTerminosExcluidos([]);
    }
  };

  // ✅ FUNCIÓN CORREGIDA - Usar el endpoint health de airbnb-data
  const verificarEndpoint = async () => {
    try {
      console.log('🔍 Verificando disponibilidad del endpoint...');
      // ✅ CORREGIDO: Usar el endpoint health específico de airbnb-data
      const response = await fetch('/api/airbnb-data/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('✅ Endpoint disponible');
        setEndpointStatus({ available: true, lastCheck: Date.now() });
      } else {
        console.log('⚠️ Endpoint no responde correctamente');
        setEndpointStatus({ available: false, lastCheck: Date.now() });
      }
    } catch (error) {
      console.log('❌ Endpoint no disponible:', error.message);
      setEndpointStatus({ available: false, lastCheck: Date.now() });
    }
  };

  // ✅ FUNCIÓN CORREGIDA - URL exacta que coincide con tu backend
  const analizarYGenerarDatos = async (userMsg, botMsg) => {
    try {
      // Verificar si el endpoint está disponible
      if (!endpointStatus.available) {
        console.log('⚠️ Endpoint no disponible, omitiendo generación de datos');
        return;
      }

      console.log('🔍 Analizando mensajes para datos BD:', { userMsg: userMsg.substring(0, 50), botMsg: botMsg.substring(0, 50) });
      
      const keywordsQueBuscanDatos = [
        'cuántos', 'cuántas', 'mostrar', 'buscar', 'encontrar', 
        'precio', 'barrio', 'habitación', 'alojamiento', 'estadística',
        'disponible', 'review', 'calificación', 'host', 'anfitrión',
        'manhattan', 'brooklyn', 'queens', 'bronx', 'barato', 'caro',
        'total', 'cantidad', 'mejor', 'peor', 'promedio'
      ];
      
      const tieneKeywords = keywordsQueBuscanDatos.some(keyword => 
        userMsg.toLowerCase().includes(keyword) || 
        botMsg.toLowerCase().includes(keyword)
      );
      
      console.log('🎯 Keywords detectadas:', tieneKeywords);
      
      if (tieneKeywords) {
        console.log('📡 Enviando petición a /api/airbnb-data/obtener-contexto...');
        
        // ✅ CORREGIDO: URL exacta que coincide con tu backend
        const response = await fetch('/api/airbnb-data/obtener-contexto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: userMsg,
            botResponse: botMsg,
            conversacionId: conversacionActual._id
          })
        });
        
        console.log('📨 Respuesta recibida:', response.status, response.ok);
        
        if (response.ok) {
          const datos = await response.json();
          console.log('📊 Datos recibidos:', datos);
          
          if (datos && Object.keys(datos).length > 0) {
            const datosCompletos = {
              ...datos,
              userMessage: userMsg,
              botResponse: botMsg,
              timestamp: Date.now(),
              generadoAutomaticamente: true,
              fuenteDatos: 'backend'
            };
            
            console.log('✅ Configurando datos del modal:', datosCompletos);
            setDatosModal(datosCompletos);
          } else {
            console.log('⚠️ No hay datos válidos en la respuesta');
          }
        } else if (response.status === 404) {
          console.warn('⚠️ Endpoint no encontrado (404). Marcando como no disponible.');
          setEndpointStatus({ available: false, lastCheck: Date.now() });
          
          // Intentar generar datos mock/fallback basados en keywords
          const datosFallback = generarDatosFallback(userMsg, botMsg);
          if (datosFallback) {
            setDatosModal(datosFallback);
          }
        } else if (response.status >= 500) {
          console.error('❌ Error del servidor (5xx):', response.status);
        } else {
          console.error('❌ Error en la respuesta:', response.status);
        }
      } else {
        console.log('⚪ No se detectaron keywords relevantes');
      }
    } catch (error) {
      console.error('❌ Error al generar datos adicionales:', error);
      
      // Si hay error de red, marcar endpoint como no disponible
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setEndpointStatus({ available: false, lastCheck: Date.now() });
        console.log('🔄 Endpoint marcado como no disponible debido a error de red');
      }
    }
  };

  // NUEVA FUNCIÓN para generar datos de fallback cuando el endpoint no está disponible
  const generarDatosFallback = (userMsg, botMsg) => {
    const msgCombinado = (userMsg + ' ' + botMsg).toLowerCase();
    
    // Detectar tipo de consulta y generar datos mock apropiados
    if (msgCombinado.includes('cuántos') || msgCombinado.includes('total')) {
      return {
        tipo: 'conteo',
        total: Math.floor(Math.random() * 10000) + 1000,
        descripcion: 'Datos aproximados - Endpoint no disponible',
        userMessage: userMsg,
        botResponse: botMsg,
        timestamp: Date.now(),
        fuenteDatos: 'fallback',
        isDemo: true
      };
    }
    
    if (msgCombinado.includes('manhattan') || msgCombinado.includes('brooklyn') || 
        msgCombinado.includes('queens') || msgCombinado.includes('bronx')) {
      return {
        tipo: 'barrios',
        datos: [
          { _id: 'Manhattan', total: 1234, precioPromedio: 180 },
          { _id: 'Brooklyn', total: 987, precioPromedio: 95 },
          { _id: 'Queens', total: 654, precioPromedio: 75 }
        ],
        descripcion: 'Datos demo por ubicación - Endpoint no disponible',
        userMessage: userMsg,
        botResponse: botMsg,
        timestamp: Date.now(),
        fuenteDatos: 'fallback',
        isDemo: true
      };
    }
    
    if (msgCombinado.includes('alojamiento') || msgCombinado.includes('mostrar')) {
      return {
        tipo: 'listings',
        datos: [
          {
            _id: 'demo1',
            name: 'Apartamento Demo en Manhattan',
            price: 150,
            neighbourhood_group: 'Manhattan',
            neighbourhood: 'Upper West Side',
            room_type: 'Entire home/apt',
            host_name: 'Demo Host',
            number_of_reviews: 45,
            availability_365: 300,
            minimum_nights: 2
          }
        ],
        descripcion: 'Datos demo - Endpoint no disponible',
        userMessage: userMsg,
        botResponse: botMsg,
        timestamp: Date.now(),
        fuenteDatos: 'fallback',
        isDemo: true
      };
    }
    
    return null;
  };

  const verificarTerminosExcluidos = (mensaje) => {
    const mensajeLower = mensaje.toLowerCase().trim();
    const terminosActivos = terminosExcluidos.filter(termino => termino.activo);
    
    // Dividir el mensaje en palabras individuales
    const palabrasDelMensaje = mensajeLower.split(/\s+/);
    
    for (const termino of terminosActivos) {
      const palabraExcluida = termino.palabra.toLowerCase().trim();
      
      // Solo verificar coincidencia exacta de palabra completa
      const palabraEncontrada = palabrasDelMensaje.some(palabra => {
        // Remover signos de puntuación de la palabra del mensaje
        const palabraLimpia = palabra.replace(/[^\w\s]/g, '');
        return palabraLimpia === palabraExcluida;
      });
      
      if (palabraEncontrada) {
        return {
          detectado: true,
          termino: termino.palabra,
          esGlobal: termino.aplicarGlobalmente
        };
      }
    }
    
    return { detectado: false, termino: null, esGlobal: false };
  };

  const handleInputChange = (e) => {
    const nuevoValor = e.target.value;
    setInputMessage(nuevoValor);

    if (nuevoValor.trim()) {
      const verificacion = verificarTerminosExcluidos(nuevoValor);
      
      if (verificacion.detectado) {
        setTerminoDetectado(verificacion.termino);
        setEscribiendoTerminoProhibido(true);
        setMostrarAlertaTermino(true);
      } else {
        setEscribiendoTerminoProhibido(false);
        if (mostrarAlertaTermino && !escribiendoTerminoProhibido) {
          setMostrarAlertaTermino(false);
          setTerminoDetectado('');
        }
      }
    } else {
      setEscribiendoTerminoProhibido(false);
      setMostrarAlertaTermino(false);
      setTerminoDetectado('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !conversacionActual) return;

    const verificacion = verificarTerminosExcluidos(inputMessage.trim());
    
    if (verificacion.detectado) {
      setTerminoDetectado(verificacion.termino);
      setMostrarAlertaTermino(true);
      
      if (verificacion.esGlobal) {
        setInputMessage('');
        setEscribiendoTerminoProhibido(false);
      }
      return;
    }
  
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };
  
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setEscribiendoTerminoProhibido(false);
    setMostrarAlertaTermino(false);
    setIsLoading(true);

    // Limpiar datos anteriores del modal
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDatosModal(null);
    setModalAbierto(false);
  
    try {
      console.log('📤 Enviando mensaje al chatbot...');
      
      const respuesta = await chatbotService.enviarMensaje(
        conversacionActual._id,
        userMessage.content
      );
  
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: respuesta.mensaje || respuesta.respuesta,
        timestamp: new Date(),
        userContext: userMessage.content
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      console.log('📨 Respuesta del bot recibida:', botMessage.content.substring(0, 100));

      // Verificar si el backend ya envía datos de contexto
      if (respuesta.datosContexto) {
        console.log('📊 Datos de contexto del backend recibidos');
        const datosCompletos = {
          ...respuesta.datosContexto,
          userMessage: userMessage.content,
          botResponse: botMessage.content,
          timestamp: Date.now(),
          fuenteDatos: 'backend'
        };
        
        setDatosModal(datosCompletos);
      } else {
        // Si no hay datos del backend, intentar generar automáticamente
        console.log('🤖 Intentando generar datos automáticamente...');
        setTimeout(() => {
          analizarYGenerarDatos(userMessage.content, botMessage.content);
        }, 500);
      }

      const convsActualizadas = await chatbotService.obtenerConversaciones();
      setConversaciones(convsActualizadas);
      
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffects CORREGIDOS para evitar bucles infinitos
  useEffect(() => {
    const cargarConversacionDesdeURL = async () => {
      if (!id) {
        if (conversacionActual?._id) {
          navigate(`/chat/${conversacionActual._id}`, { replace: true });
        }
        return;
      }

      if (id === conversacionActual?._id) return;

      setCargandoConversacion(true);
      try {
        await cargarConversacionPorId(id);
      } catch (error) {
        console.error('Error al cargar conversación desde URL:', error);
        if (conversaciones.length > 0) {
          navigate(`/chat/${conversaciones[0]._id}`, { replace: true });
        } else {
          navigate('/chat', { replace: true });
        }
      } finally {
        setCargandoConversacion(false);
      }
    };

    if (chatInicializado) {
      cargarConversacionDesdeURL();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, conversacionActual?._id, chatInicializado]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  useEffect(() => {
    if (conversacionActual && conversacionActual.mensajes) {
      setMessages(conversacionActual.mensajes.map((msg, index) => ({
        id: index,
        type: msg.rol === 'user' ? 'user' : 'bot',
        content: msg.contenido,
        timestamp: new Date(msg.timestamp || Date.now()),
        userContext: msg.userContext
      })));
    } else {
      setMessages([]);
    }
  }, [conversacionActual]);

  useEffect(() => {
    if (mostrarAlertaTermino && !escribiendoTerminoProhibido) {
      const timer = setTimeout(() => {
        setMostrarAlertaTermino(false);
        setTerminoDetectado('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mostrarAlertaTermino, escribiendoTerminoProhibido]);

  // Funciones estables con useCallback
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSuggestion = useCallback((suggestion) => {
    setInputMessage(suggestion);
    const verificacion = verificarTerminosExcluidos(suggestion);
    if (verificacion.detectado) {
      setTerminoDetectado(verificacion.termino);
      setEscribiendoTerminoProhibido(true);
      setMostrarAlertaTermino(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminosExcluidos]);

  const handleNuevaConversacionConNavegacion = useCallback(async () => {
    try {
      const nuevaConv = await onNuevaConversacion();
      if (nuevaConv?._id) {
        navigate(`/chat/${nuevaConv._id}`);
      }
    } catch (error) {
      console.error('Error al crear conversación:', error);
    }
  }, [onNuevaConversacion, navigate]);

  const obtenerTipoDatos = (datos) => {
    if (!datos) return '';
    
    switch (datos.tipo) {
      case 'listings': return `${datos.datos?.length || 0} alojamientos`;
      case 'estadisticas': return 'Estadísticas';
      case 'barrios': return 'Análisis por ubicación';
      case 'hosts': return 'Información de hosts';
      case 'conteo': return 'Totales y conteos';
      case 'raw': return 'Datos estructurados';
      default: return 'Datos de BD';
    }
  };

  // FUNCIÓN PARA TESTEAR EL MODAL
  // eslint-disable-next-line no-unused-vars
  const probarModalConDatos = useCallback(() => {
    const datosEjemplo = {
      tipo: 'listings',
      datos: [
        {
          _id: '1',
          name: 'Beautiful Manhattan Apartment',
          price: 150,
          neighbourhood_group: 'Manhattan',
          neighbourhood: 'Upper West Side',
          room_type: 'Entire home/apt',
          host_name: 'John Doe',
          number_of_reviews: 45,
          availability_365: 300,
          minimum_nights: 2,
          reviews_per_month: 3.5
        },
        {
          _id: '2',
          name: 'Cozy Brooklyn Room',
          price: 75,
          neighbourhood_group: 'Brooklyn',
          neighbourhood: 'Williamsburg',
          room_type: 'Private room',
          host_name: 'Jane Smith',
          number_of_reviews: 23,
          availability_365: 150,
          minimum_nights: 1,
          reviews_per_month: 2.1
        }
      ],
      descripcion: '2 alojamientos encontrados en la búsqueda',
      userMessage: 'Muéstrame alojamientos en Nueva York',
      botResponse: 'Aquí tienes algunos alojamientos disponibles en Nueva York',
      timestamp: Date.now(),
      fuenteDatos: 'prueba'
    };

    setDatosModal(datosEjemplo);
    setModalAbierto(true);
  }, []);

  if (!chatInicializado) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Inicializando chat...</p>
        </div>
      </div>
    );
  }

  if (cargandoConversacion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  if (!conversacionActual && !cargandoConversacion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center px-4 max-w-4xl mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Bienvenido a AirbnbBot!
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Selecciona una conversación o crea una nueva para comenzar.
          </p>
          <button
            onClick={handleNuevaConversacionConNavegacion}
            className="px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium text-lg"
          >
            Iniciar nueva conversación
          </button>
          
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full">
      {/* Alerta de endpoint no disponible */}
      {!endpointStatus.available && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm">
                <strong>Modo offline:</strong> El servicio de datos está temporalmente no disponible. 
                Funcionando con datos de demostración.
              </p>
            </div>
            <button
              onClick={verificarEndpoint}
              className="ml-4 text-yellow-600 hover:text-yellow-800 text-sm underline"
            >
              Verificar
            </button>
          </div>
        </div>
      )}

      {mostrarAlertaTermino && (
        <div className={`border-l-4 text-red-700 p-4 mb-4 mx-4 mt-4 rounded-r-lg shadow-sm transition-all duration-300 ${
          escribiendoTerminoProhibido 
            ? 'bg-red-200 border-red-600 animate-pulse' 
            : 'bg-red-100 border-red-500'
        }`}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium">
                {escribiendoTerminoProhibido ? '⚠️ Escribiendo término prohibido' : 'Término no permitido'}
              </h4>
              <p className="text-sm">
                {escribiendoTerminoProhibido 
                  ? `Estás escribiendo "${terminoDetectado}" que no está permitido. Elimínalo para continuar.`
                  : `El término "${terminoDetectado}" no está permitido en este chat. Por favor, reformula tu mensaje.`
                }
              </p>
            </div>
            <button
              onClick={() => {
                setMostrarAlertaTermino(false);
                setEscribiendoTerminoProhibido(false);
                setTerminoDetectado('');
              }}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4 transition-all duration-500 ease-in-out max-w-4xl">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                ¡Hola! Soy AirbnbBot
              </h2>
              <p className="text-gray-600 mb-8">
                Puedo ayudarte a consultar información sobre alojamientos de Airbnb en Nueva York, 
                buscar por ubicación, precio, tipo de habitación y más.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 text-left transition-all duration-500 ease-in-out">
                <button 
                  onClick={() => handleSuggestion("¿Cuántos alojamientos hay disponibles en total?")}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-800 mb-1">📊 Estadísticas</h3>
                  <p className="text-sm text-gray-600">¿Cuántos alojamientos hay disponibles en total?</p>
                </button>
                <button 
                  onClick={() => handleSuggestion("Muéstrame alojamientos en Manhattan")}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-800 mb-1">📍 Por ubicación</h3>
                  <p className="text-sm text-gray-600">Muéstrame alojamientos en Manhattan</p>
                </button>
                <button 
                  onClick={() => handleSuggestion("Busca habitaciones privadas baratas")}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-800 mb-1">💰 Por precio</h3>
                  <p className="text-sm text-gray-600">Busca habitaciones privadas baratas</p>
                </button>
                <button 
                  onClick={() => handleSuggestion("¿Cuáles son los alojamientos mejor valorados?")}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-800 mb-1">⭐ Mejor valorados</h3>
                  <p className="text-sm text-gray-600">¿Cuáles son los alojamientos mejor valorados?</p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto px-4 py-8 max-w-5xl">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-6 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                    {message.type === 'user' ? (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">U</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className={`${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-pink-700 to-red-600 text-white' 
                      : 'bg-white border border-gray-200'
                  } rounded-lg px-4 py-3 shadow-sm relative`}>
                    
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Indicador de datos disponibles - MEJORADO CON CONTROL */}
                    {message.type === 'bot' && 
                     message.id === messages[messages.length - 1]?.id && 
                     datosModal && (
                      <div className="mt-3 flex items-center text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="flex-1">
                          📊 {obtenerTipoDatos(datosModal)} disponibles
                          {datosModal.generadoAutomaticamente && ' (auto)'}
                          {datosModal.fuenteDatos === 'backend' && ' (servidor)'}
                          {datosModal.fuenteDatos === 'fallback' && ' (offline)'}
                          {datosModal.fuenteDatos === 'prueba' && ' (demo)'}
                          {datosModal.isDemo && ' ⚠️'}
                        </span>
                        <button 
                          onClick={() => {
                            // Cancelar auto-apertura si está pendiente
                            if (timerRef.current) {
                              clearTimeout(timerRef.current);
                              timerRef.current = null;
                            }
                            setModalAbierto(true);
                          }}
                          className="ml-2 text-blue-700 hover:text-blue-900 underline font-medium"
                        >
                          Ver datos
                        </button>
                      </div>
                    )}
                    
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-6 flex justify-start">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Área de entrada mejorada */}
      <div className="border-t border-gray-200 bg-white px-4 py-4 relative">
        <form onSubmit={handleSubmit} className="mx-auto max-w-5xl">
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta sobre alojamientos de Airbnb..."
                className={`w-full px-4 py-3 pr-12 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  escribiendoTerminoProhibido 
                    ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                rows="1"
                style={{ maxHeight: '200px' }}
                disabled={!conversacionActual}
              />
              
              {escribiendoTerminoProhibido && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading || !conversacionActual || escribiendoTerminoProhibido}
              className={`p-3 rounded-lg transition-all ${
                inputMessage.trim() && !isLoading && conversacionActual && !escribiendoTerminoProhibido
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Información del estado mejorada */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              {escribiendoTerminoProhibido 
                ? `⚠️ Término "${terminoDetectado}" no permitido - elimínalo para continuar`
                : conversacionActual 
                  ? 'Presiona Enter para enviar, Shift+Enter para nueva línea'
                  : 'Selecciona una conversación para comenzar'
              }
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                airbnb
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Claude-3
              </span>
              {conversacionActual && (
                <span className="flex items-center text-pink-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  ID: {conversacionActual._id.slice(-6)}
                </span>
              )}
              {terminosExcluidos.length > 0 && (
                <span className="flex items-center text-red-600" title={`${terminosExcluidos.filter(t => t.activo).length} términos activos`}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                  Filtros: {terminosExcluidos.filter(t => t.activo).length}
                </span>
              )}
              {/* Indicador de estado del endpoint */}
              <span className={`flex items-center ${
                endpointStatus.available ? 'text-green-600' : 'text-yellow-600'
              }`} title={endpointStatus.available ? 'API conectada' : 'API no disponible - Modo offline'}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {endpointStatus.available ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  )}
                </svg>
                API: {endpointStatus.available ? 'Conectada' : 'Offline'}
              </span>
            </div>
          </div>
        </form>

        {/* 🎯 Botón flotante REPOSICIONADO para no estorbar */}
        {datosModal && (
          <div className="absolute right-4 bottom-24 z-40">
            <div className="relative group">
              <button
                onClick={() => {
                  // Cancelar auto-apertura si está pendiente
                  if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                  }
                  setModalAbierto(true);
                }}
                className={`p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
                  datosModal.isDemo || datosModal.fuenteDatos === 'fallback' 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' 
                    : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                } text-white`}
                title={datosModal.isDemo ? 'Ver datos demo (API offline)' : 'Ver datos de la base de datos'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                
                {/* Badge mejorado */}
                <div className={`absolute -top-1 -right-1 ${
                  datosModal.isDemo ? 'bg-orange-500' : 'bg-red-500'
                } text-white text-xs rounded-full w-4 h-4 flex items-center justify-center`}>
                  {datosModal.isDemo ? '!' : '•'}
                </div>
              </button>
              
              {/* Tooltip mejorado */}
              <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  📊 {obtenerTipoDatos(datosModal)}
                  {datosModal.isDemo && ' (Demo)'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de datos COMPACTO - Con key para forzar re-render */}
      <ModalDetalles 
        key={datosModal?.timestamp}
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        datos={datosModal}
        compact={true} // Añadimos prop para modal compacto
      />
    </div>
  );
};

export default Chat;