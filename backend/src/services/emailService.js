// NeuraMinds — Email Service Abstraction
// Supports:
// 1. Nodemailer SMTP (Gmail SMTP, Custom SMTP) -> Sends to ANY recipient email address worldwide!
// 2. Resend API -> Sends to verified domain / account email.
// 3. Dev Console Fallback -> Logs OTP to backend terminal.

const nodemailer = require('nodemailer');
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Creates Nodemailer SMTP transport if configured.
 */
function createSmtpTransporter() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) return null;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 465;
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
    },
  });
}

/**
 * Formats a valid Resend 'from' email header.
 */
function getResendFromAddress() {
  const envFrom = process.env.EMAIL_FROM;
  if (!envFrom) {
    return 'NeuraMinds <onboarding@resend.dev>';
  }
  if (!envFrom.includes('<') && !envFrom.includes('>')) {
    const parts = envFrom.trim().split(/\s+/);
    if (parts.length === 1 && parts[0].includes('@')) {
      return `NeuraMinds <${parts[0]}>`;
    }
    const emailMatch = envFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      const name = envFrom.replace(emailMatch[0], '').trim() || 'NeuraMinds';
      return `${name} <${emailMatch[0]}>`;
    }
  }
  return envFrom;
}

/**
 * Sends OTP email to any user email address.
 * @param {string} email - Destination email address
 * @param {string} otp - 6-digit plain text OTP
 */
async function sendOtpEmail(email, otp) {
  let sent = false;
  let providerUsed = '';

  // 1. Try Nodemailer SMTP (Sends to ANY email address in the world if configured)
  const transporter = createSmtpTransporter();
  if (transporter) {
    try {
      const fromAddr = process.env.EMAIL_FROM || `NeuraMinds <${process.env.SMTP_USER}>`;
      const mailOptions = {
        from: fromAddr,
        to: email,
        subject: `${otp} is your NeuraMinds verification code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
            <h2 style="color: #6366f1; margin-top: 0; margin-bottom: 8px;">NeuraMinds</h2>
            <p style="color: #94a3b8; font-size: 14px;">Use the verification code below to complete your login or registration:</p>
            <div style="background: #1e293b; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px solid #334155;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #818cf8; font-family: monospace;">${otp}</span>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Nodemailer SMTP delivered email to ${email} (MessageId: ${info.messageId})`);
      sent = true;
      providerUsed = 'smtp';
    } catch (err) {
      console.warn(`[EmailService] SMTP error: ${err.message}`);
    }
  }

  // 2. Try Resend API if SMTP not used or failed
  if (!sent && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const fromAddress = getResendFromAddress();

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: `${otp} is your NeuraMinds verification code`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
              <h2 style="color: #6366f1; margin-top: 0; margin-bottom: 8px;">NeuraMinds</h2>
              <p style="color: #94a3b8; font-size: 14px;">Use the verification code below to complete your login or registration:</p>
              <div style="background: #1e293b; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px solid #334155;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #818cf8; font-family: monospace;">${otp}</span>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
            </div>
          `,
        }),
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const resData = await response.json();
        console.log(`[EmailService] Resend email delivered to ${email} (ID: ${resData.id})`);
        sent = true;
        providerUsed = 'resend';
      } else {
        const errText = await response.text();
        console.warn(`[EmailService] Resend API status ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.warn(`[EmailService] Resend error: ${err.message}`);
    }
  }

  // 3. Always print to Console for developer testing
  if (!isProduction || !sent) {
    console.log(`\n==============================================`);
    console.log(`[EmailService] 📩 VERIFICATION CODE DISPATCH`);
    console.log(`[EmailService] Email Destination : ${email}`);
    console.log(`[EmailService] 🔑 6-Digit OTP Code : ${otp}`);
    console.log(`[EmailService] Delivery Method   : ${sent ? providerUsed.toUpperCase() : 'Console (Dev Mode)'}`);
    console.log(`==============================================\n`);
  }

  return {
    success: true,
    provider: providerUsed || 'dev-console',
  };
}

module.exports = {
  sendOtpEmail,
};
