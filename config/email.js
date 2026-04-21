// ─────────────────────────────────────────────────────────────
// Nodemailer Transporter
// Falls back to console logging when SMTP credentials are empty.
// ─────────────────────────────────────────────────────────────
const nodemailer = require('nodemailer');

let transporter;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  // Real SMTP transport
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  transporter.verify()
    .then(() => console.log('📧  SMTP transporter ready'))
    .catch((err) => console.warn('📧  SMTP verification failed:', err.message));
} else {
  // Console-only transport for development
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('\n📧  [DEV EMAIL] ─────────────────────────────');
      console.log(`   To:      ${mailOptions.to}`);
      console.log(`   Subject: ${mailOptions.subject}`);
      console.log(`   Body:    ${mailOptions.text || mailOptions.html}`);
      console.log('─────────────────────────────────────────────\n');
      return { messageId: `dev-${Date.now()}` };
    },
  };
  console.log('📧  Email in DEV mode — messages logged to console');
}

/**
 * Send an email.
 * @param {{ to: string, subject: string, text?: string, html?: string }} options
 */
const sendEmail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: process.env.SMTP_FROM || '"First Fly Digital Solutions" <info@firstfly.in>',
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendEmail };
