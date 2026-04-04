import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  try {
    const { error } = await resend.emails.send({
      from: "MindLens AI <noreply@mindlensai.me>",
      to,
      subject,
      html,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    });

    if (error) {
      console.error("Resend error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { error: "Failed to send email" };
  }
}
