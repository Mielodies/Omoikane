import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
const SITE_URL = process.env.SITE_URL || 'http://localhost:3001';

export async function sendPasswordResetEmail(to, token) {
  const resetUrl = `${SITE_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Omoikane" <${FROM}>`,
    to,
    subject: 'Reset your Omoikane password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #111; color: #e5e7eb;">
        <h2 style="color: #a855f7;">Omoikane — Password Reset</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
          Reset Password
        </a>
        <p style="font-size: 14px; color: #9ca3af;">Or copy this link: <br/><a href="${resetUrl}" style="color: #a855f7;">${resetUrl}</a></p>
        <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `Reset your Omoikane password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  });
}
