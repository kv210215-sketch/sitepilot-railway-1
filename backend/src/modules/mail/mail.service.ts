import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';

export interface SendMailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export interface SendMailResult {
  /** true when handed to an SMTP transport; false when logged (no transport). */
  delivered: boolean;
  transport: 'smtp' | 'log';
}

/**
 * Thin outbound-mail wrapper.
 *
 * If SMTP is configured (SMTP_HOST set) it sends via nodemailer; otherwise it
 * logs the message and returns { delivered: false, transport: 'log' }. This keeps
 * dev / test / unconfigured-staging fully functional without secrets and ensures
 * a mail failure can never break a request flow (callers may ignore the result).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.config.get<string>('mail.host');
    if (!host) {
      this.logger.log('SMTP not configured (no SMTP_HOST) — mail runs in log-only mode');
      return;
    }

    // Lazy require so the dependency is only loaded when SMTP is actually used.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');
    this.transporter = nodemailer.createTransport({
      host,
      port:   this.config.get<number>('mail.port'),
      secure: this.config.get<boolean>('mail.secure'),
      auth: this.config.get<string>('mail.user')
        ? {
            user: this.config.get<string>('mail.user'),
            pass: this.config.get<string>('mail.pass'),
          }
        : undefined,
    });
    this.logger.log(`SMTP transport ready (${host})`);
  }

  async sendMail(input: SendMailInput): Promise<SendMailResult> {
    const from = this.config.get<string>('mail.from');
    const to = Array.isArray(input.to) ? input.to.join(', ') : input.to;

    if (!this.transporter) {
      this.logger.log(`[mail:log] to=${to} subject="${input.subject}"`);
      return { delivered: false, transport: 'log' };
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        replyTo: input.replyTo,
      });
      return { delivered: true, transport: 'smtp' };
    } catch (err) {
      // Never throw to callers — mail is best-effort.
      this.logger.error(`SMTP send failed (to=${to}): ${(err as Error).message}`);
      return { delivered: false, transport: 'smtp' };
    }
  }
}
