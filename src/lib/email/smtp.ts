import "server-only";

import nodemailer from "nodemailer";

import { env } from "@/env";

export type Email = { subject: string; text: string; html: string };

/** Recipients, or null when SMTP isn't configured — callers treat that as "don't send". */
export function notifyRecipients(): string[] | null {
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) return null;
  const to = (env.REVIEW_NOTIFY_TO ?? env.SMTP_USER)
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  return to.length > 0 ? to : null;
}

export async function sendEmail(to: string[], email: Email): Promise<void> {
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    // The cron has a 300s budget; a hung SMTP handshake mustn't eat it.
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
  await transport.sendMail({ from: `"The Body Cue" <${env.SMTP_USER}>`, to, ...email });
}
