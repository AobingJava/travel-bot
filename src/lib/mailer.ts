import "server-only";

import nodemailer from "nodemailer";

import { appEnv } from "@/lib/env";

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (
    !appEnv.smtpHost ||
    !appEnv.smtpPort ||
    !appEnv.smtpUser ||
    !appEnv.smtpPass
  ) {
    console.info("[mail:demo]", { to, subject, text });
    return;
  }

  const transport = nodemailer.createTransport({
    host: appEnv.smtpHost,
    port: Number(appEnv.smtpPort),
    secure: Number(appEnv.smtpPort) === 465,
    auth: {
      user: appEnv.smtpUser,
      pass: appEnv.smtpPass,
    },
  });

  await transport.sendMail({
    from: appEnv.smtpFrom,
    to,
    subject,
    html,
    text,
  });
}
