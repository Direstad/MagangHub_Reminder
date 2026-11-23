import nodemailer from 'nodemailer';

export function createEmailNotifier({
  gmailUser,
  gmailAppPassword,
  toEmail,
  createTransportImpl = nodemailer.createTransport,
}) {
  const transporter = createTransportImpl({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  return {
    async sendEmail({ subject, text, html }) {
      return transporter.sendMail({
        from: `"MagangHub Reminder" <${gmailUser}>`,
        to: toEmail,
        subject,
        text,
        html,
      });
    },
  };
}
