const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarEmail(destinatario, asunto, html) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Email] No configurado — saltando envio a:', destinatario);
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Zingo" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html,
    });
    console.log('[Email] Enviado a:', destinatario, info.messageId);
    return info;
  } catch (error) {
    console.error('[Email] Error al enviar:', error.message);
    return null;
  }
}

function plantillaCuentaAprobada(nombre) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #007AFF; font-size: 28px; margin: 0;">Zingo</h1>
        <p style="color: #86868B; font-size: 14px; margin-top: 4px;">Transporte Publico Tulancingo</p>
      </div>
      <div style="background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 56px; height: 56px; border-radius: 28px; background: #E8F5E9; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px; color: #2E7D32;">&#10003;</span>
          </div>
        </div>
        <h2 style="text-align: center; color: #1D1D1F; margin-bottom: 16px;">Cuenta Aprobada</h2>
        <p style="color: #1D1D1F; font-size: 15px; line-height: 1.6;">
          Hola <strong>${nombre}</strong>,
        </p>
        <p style="color: #1D1D1F; font-size: 15px; line-height: 1.6;">
          Tu cuenta de concesionario en Zingo ha sido verificada y aprobada.
          Ya puedes iniciar sesion en el panel web y registrar tus rutas de transporte.
        </p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.WEB_URL || 'http://localhost:5173'}/login"
             style="display: inline-block; background: #007AFF; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Iniciar Sesion
          </a>
        </div>
      </div>
      <p style="text-align: center; color: #86868B; font-size: 12px; margin-top: 24px;">
        Este correo fue enviado automaticamente por Zingo. No responder a este mensaje.
      </p>
    </div>
  `;
}

function plantillaCuentaRechazada(nombre, motivo) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #007AFF; font-size: 28px; margin: 0;">Zingo</h1>
        <p style="color: #86868B; font-size: 14px; margin-top: 4px;">Transporte Publico Tulancingo</p>
      </div>
      <div style="background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <h2 style="text-align: center; color: #1D1D1F; margin-bottom: 16px;">Solicitud Rechazada</h2>
        <p style="color: #1D1D1F; font-size: 15px; line-height: 1.6;">
          Hola <strong>${nombre}</strong>,
        </p>
        <p style="color: #1D1D1F; font-size: 15px; line-height: 1.6;">
          Lamentamos informarte que tu solicitud de cuenta de concesionario ha sido rechazada.
        </p>
        <div style="background: #FFEBEE; border-radius: 8px; padding: 14px; margin: 16px 0;">
          <p style="color: #C62828; font-size: 14px; margin: 0;"><strong>Motivo:</strong> ${motivo}</p>
        </div>
        <p style="color: #86868B; font-size: 14px; line-height: 1.6;">
          Si consideras que hubo un error, puedes enviar una nueva solicitud con la documentacion correcta.
        </p>
      </div>
      <p style="text-align: center; color: #86868B; font-size: 12px; margin-top: 24px;">
        Este correo fue enviado automaticamente por Zingo.
      </p>
    </div>
  `;
}

module.exports = { enviarEmail, plantillaCuentaAprobada, plantillaCuentaRechazada };
