import { mailTransporter, SMTP_FROM } from "../config/email.js";

export async function sendOtpEmail(toEmail, code) {
  if (!mailTransporter) {
    console.warn("[auth/request-code] SMTP no configurado, usando simulacion por consola.");
    console.log(`[auth/request-code] OTP para ${toEmail}: ${code}`);
    return;
  }

  await mailTransporter.sendMail({
    from: SMTP_FROM,
    to: toEmail,
    subject: "Codigo de verificacion - AECO IA",
    text: `Tu codigo de verificacion es: ${code}. Expira en 10 minutos.`,
    html: `<p>Tu codigo de verificacion es: <strong>${code}</strong>.</p><p>Expira en 10 minutos.</p>`,
  });
}
