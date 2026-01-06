import nodemailer from 'nodemailer';

const emailRegistro = async (datos) => {
    try {
        console.log('📧 Configurando transporter de email para registro...');
        
        // 🔥 DELAY ENTRE EMAILS PARA EVITAR RATE LIMITING
        const lastEmailTime = global.lastEmailTime || 0;
        const timeSinceLastEmail = Date.now() - lastEmailTime;
        const minDelay = 3000; // 3 segundos entre emails

        if (timeSinceLastEmail < minDelay) {
            const waitTime = minDelay - timeSinceLastEmail;
            console.log(`⏳ Esperando ${waitTime}ms para evitar rate limiting...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        global.lastEmailTime = Date.now();

        // Crear el transporter con la configuración correcta
        var transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_PORT == 465, // true para 465, false para 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            // 🔥 CONFIGURACIÓN OPTIMIZADA PARA EVITAR TIMEOUTS
            connectionTimeout: 60000, // 60 segundos
            greetingTimeout: 30000,   // 30 segundos para greeting
            socketTimeout: 60000,     // 60 segundos para socket
            tls: {
                rejectUnauthorized: false, // Para desarrollo - evita errores de certificado
            },
            ignoreTLS: false,
            debug: true,
            logger: true
        });

        // 🔥 VERIFICAR CONEXIÓN CON TIMEOUT PERSONALIZADO
        console.log('🔍 Verificando conexión SMTP...');
        
        const verifyWithTimeout = async (timeoutMs = 20000) => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout en verificación SMTP'));
                }, timeoutMs);

                transporter.verify((error, success) => {
                    clearTimeout(timeout);
                    if (error) reject(error);
                    else resolve(success);
                });
            });
        };

        try {
            await verifyWithTimeout(20000);
            console.log('✅ Conexión SMTP verificada correctamente');
        } catch (verifyError) {
            console.warn('⚠️ Verificación SMTP falló, pero continuando...', verifyError.message);
        }

        const { email, nombre, token } = datos;
        
        console.log('📨 Enviando email de registro a:', email);

        // 🔥 FUNCIÓN PARA ENVIAR EMAIL CON REINTENTOS
        const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`📤 Intento ${attempt} de ${maxRetries} para enviar email...`);
                    
                    const info = await transporter.sendMail(mailOptions);
                    console.log(`✅ Email enviado exitosamente en intento ${attempt}!`);
                    return info;
                    
                } catch (error) {
                    console.error(`❌ Error en intento ${attempt}:`, error.message);
                    
                    if (attempt === maxRetries) {
                        throw error; // Último intento, lanzar error
                    }
                    
                    // Esperar antes del siguiente intento (2s, 4s, 6s)
                    const waitTime = attempt * 2000;
                    console.log(`⏳ Esperando ${waitTime}ms antes del siguiente intento...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    
                    // Recrear transporter para el siguiente intento
                    transporter = nodemailer.createTransport({
                        host: process.env.EMAIL_HOST,
                        port: parseInt(process.env.EMAIL_PORT),
                        secure: process.env.EMAIL_PORT == 465,
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS
                        },
                        connectionTimeout: 60000,
                        greetingTimeout: 30000,
                        socketTimeout: 60000,
                        tls: {
                            rejectUnauthorized: false,
                        },
                        ignoreTLS: false,
                        debug: true,
                        logger: true
                    });
                }
            }
        };

        // Configurar opciones del email
        const mailOptions = {
            from: `"AirbnbBot - Confirmación de Cuenta" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "¡Bienvenido! Confirma tu cuenta - AirbnbBot",
            text: `Hola ${nombre}, confirma tu cuenta en AirbnbBot`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 32px;">
                            <div style="background: linear-gradient(135deg, #10b981, #059669); width: 80px; height: 80px; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 36px;">🏠</span>
                            </div>
                            <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: bold;">¡Bienvenido a AirbnbBot!</h1>
                            <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 16px;">Confirma tu cuenta</p>
                        </div>

                        <!-- Contenido -->
                        <div style="margin-bottom: 32px;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                                ¡Hola <strong style="color: #1f2937;">${nombre}</strong>!
                            </p>
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                                Gracias por registrarte en AirbnbBot. Tu cuenta ya está lista, solo necesitas confirmarla 
                                haciendo clic en el botón de abajo para comenzar a explorar los mejores alojamientos de Airbnb.
                            </p>
                            
                            <!-- Botón CTA -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${process.env.FRONTEND_URL}/confirmar/${token}" 
                                   style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                                    Confirmar mi Cuenta
                                </a>
                            </div>
                            
                            <!-- URL alternativa -->
                            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                                    Si el botón no funciona, copia y pega este enlace en tu navegador:
                                </p>
                                <p style="color: #10b981; font-size: 14px; word-break: break-all; margin: 0;">
                                    ${process.env.FRONTEND_URL}/confirmar/${token}
                                </p>
                            </div>

                            <!-- Información adicional -->
                            <div style="background: linear-gradient(135deg, #ddd6fe, #e0e7ff); padding: 20px; border-radius: 8px; margin: 24px 0;">
                                <h3 style="color: #4c1d95; margin: 0 0 12px 0; font-size: 18px;">¿Qué puedes hacer con AirbnbBot?</h3>
                                <ul style="color: #6b46c1; margin: 0; padding-left: 20px; line-height: 1.6;">
                                    <li>Buscar alojamientos por ubicación y precio</li>
                                    <li>Obtener recomendaciones personalizadas</li>
                                    <li>Consultar información detallada de propiedades</li>
                                    <li>Explorar barrios y zonas de Nueva York</li>
                                </ul>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
                            <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0;">
                                <strong>¿No te registraste?</strong><br>
                                Si no creaste una cuenta en AirbnbBot, puedes ignorar este email de forma segura. 
                                Tu dirección de correo no será utilizada sin tu confirmación.
                            </p>
                            
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                    Este enlace de confirmación expirará por seguridad. Si necesitas ayuda, contáctanos.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Pie de página adicional -->
                    <div style="text-align: center; margin-top: 24px; padding: 16px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                            © 2025 AirbnbBot. Tu asistente inteligente para encontrar alojamientos perfectos.
                        </p>
                    </div>
                </div>
            `
        };

        // Enviar el email con reintentos
        const info = await sendEmailWithRetry(mailOptions);

        console.log("✅ Email de registro enviado exitosamente!");
        console.log("📧 Message ID:", info.messageId);
        console.log("📬 Email enviado a:", email);
        
        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {
        console.error("❌ Error detallado al enviar email de registro:");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        
        // Relanzar el error para que sea manejado por el controlador
        throw new Error(`Error al enviar email de registro: ${error.message}`);
    }
};

export default emailRegistro;