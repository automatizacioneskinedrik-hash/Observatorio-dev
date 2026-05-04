import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "587");
const SMTP_SECURE = String(process.env.SMTP_SECURE ?? "false") === "true";
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
export const SMTP_FROM = process.env.SMTP_FROM ?? SMTP_USER;

export let mailTransporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_FROM) {
  mailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}
