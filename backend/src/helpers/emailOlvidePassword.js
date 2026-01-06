import nodemailer from 'nodemailer';

const emailOlvidePassword = async (datos) => {
    try {
        console.log('📧 Configurando transporter de email...');
        
        var transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587, // Asegurar que sea número
            secure: process.env.EMAIL_PORT == 465, // true solo para puerto 465
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            // 🔥 CONFIGURACIONES MEJORADAS PARA EVITAR TIMEOUTS
            connectionTimeout: 60000, // 60 segundos (por defecto son 120s)
            greetingTimeout: 30000,   // 30 segundos para recibir greeting
            socketTimeout: 60000,     // 60 segundos para actividad del socket
            // 🔥 CONFIGURACIÓN TLS MEJORADA
            tls: {
                rejectUnauthorized: false,
                // Removed SSLv3 cipher - it's deprecated and can cause issues
                // ciphers: 'SSLv3' // ❌ QUITAR ESTA LÍNEA
            },
            // 🔥 CONFIGURACIONES ADICIONALES
            ignoreTLS: false,
            debug: true,
            logger: true,
            // 🔥 CONFIGURACIÓN PARA GMAIL ESPECÍFICAMENTE
            pool: true, // Usar pool de conexiones
            maxConnections: 5,
            maxMessages: 100,
        });

        // 🔥 VERIFICAR CONEXIÓN CON TIMEOUT PERSONALIZADO
        console.log('🔍 Verificando conexión SMTP...');
        
        // Crear una promesa con timeout personalizado para verify()
        const verifyWithTimeout = (timeoutMs = 30000) => {
            return Promise.race([
                transporter.verify(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout en verificación SMTP')), timeoutMs)
                )
            ]);
        };

        try {
            await verifyWithTimeout(30000); // 30 segundos timeout
            console.log('✅ Conexión SMTP verificada correctamente');
        } catch (verifyError) {
            console.warn('⚠️ Verificación SMTP falló, pero continuando...', verifyError.message);
            // No lanzar error aquí, intentar enviar de todos modos
        }

        const { email, nombre, token } = datos;
        
        console.log('📨 Enviando email a:', email);

        // 🔥 ENVIAR EMAIL CON RETRY LOGIC
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
                    
                    // Esperar antes del siguiente intento
                    const waitTime = attempt * 2000; // 2s, 4s, 6s...
                    console.log(`⏳ Esperando ${waitTime}ms antes del siguiente intento...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    
                    // Recrear transporter para el siguiente intento
                    transporter = nodemailer.createTransport({
                        host: process.env.EMAIL_HOST,
                        port: parseInt(process.env.EMAIL_PORT) || 587,
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
                        debug: true,
                        logger: true,
                    });
                }
            }
        };

        // Configurar el email
        const mailOptions = {
            from: `"AirbnbBot - Recuperación de Cuenta" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Restablece tu Contraseña - AirbnbBot",
            text: `Hola ${nombre}, restablece tu contraseña`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 32px;">
                            <div style="background: linear-gradient(135deg, #ec4899, #ef4444); width: 80px; height: 80px; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 36px;">🏠</span>
                            </div>
                            <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: bold;">Restablece tu Contraseña</h1>
                            <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 16px;">AirbnbBot</p>
                        </div>

                        <!-- Contenido -->
                        <div style="margin-bottom: 32px;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                                Hola <strong style="color: #1f2937;">${nombre}</strong>,
                            </p>
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                                Recibimos una solicitud para restablecer la contraseña de tu cuenta en AirbnbBot. 
                                Haz clic en el botón de abajo para crear una nueva contraseña segura.
                            </p>
                            
                            <!-- Botón CTA -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${process.env.FRONTEND_URL}/olvide-password/${token}" 
                                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                                    Restablecer mi Contraseña
                                </a>
                            </div>
                            
                            <!-- URL alternativa -->
                            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                                    Si el botón no funciona, copia y pega este enlace en tu navegador:
                                </p>
                                <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 0;">
                                    ${process.env.FRONTEND_URL}/olvide-password/${token}
                                </p>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
                            <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0;">
                                <strong>¿No solicitaste este cambio?</strong><br>
                                Si no pediste restablecer tu contraseña, ignora este email. 
                                Tu contraseña permanecerá sin cambios y segura.
                            </p>
                            
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                    Este enlace expirará por seguridad. Si necesitas ayuda, contáctanos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `
        };

        // Enviar el email con retry logic
        const info = await sendEmailWithRetry(mailOptions);

        console.log("✅ Email enviado exitosamente!");
        console.log("📧 Message ID:", info.messageId);
        console.log("📬 Email enviado a:", email);
        
        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {
        console.error("❌ Error detallado al enviar email:");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        
        // Relanzar el error para que sea manejado por el controlador
        throw new Error(`Error al enviar email: ${error.message}`);
    }
}

export default emailOlvidePassword;