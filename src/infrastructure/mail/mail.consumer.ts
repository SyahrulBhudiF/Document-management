import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { WinstonLogger } from '../logger/logger.service';
import { envConfig } from '../../config/env.config';
import { MailSchema } from './type/mail';

interface NodemailerError extends Error {
  code?: string;
  response?: string;
  responseCode?: number;
}

@Processor('mailQueue')
export class MailConsumer extends WorkerHost {
  private transporter: Transporter;

  constructor(private readonly logger: WinstonLogger) {
    super();

    this.transporter = nodemailer.createTransport({
      service: envConfig.MAIL_SERVICE,
      auth: {
        user: envConfig.MAIL_USERNAME,
        pass: envConfig.MAIL_PASSWORD,
      },
      port: envConfig.MAIL_PORT,
      host: envConfig.MAIL_HOST,
      from: envConfig.EMAIL_USER ?? 'noreply@gmail.com',
      logger: true,
    });
  }

  async process(job: Job): Promise<void> {
    const mailData = MailSchema.parse(job.data);

    const mailOptions = {
      to: mailData.to,
      subject: mailData.subject,
      text: mailData.text,
      html: mailData.html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${mailOptions.to}`);
    } catch (error: unknown) {
      let errorMessage = `Failed to send email to ${mailOptions.to}`;
      const metadata: Record<string, unknown> = {};

      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        metadata.stack = error.stack || '';

        const mailError = error as NodemailerError;
        metadata.code = mailError.code;
        metadata.response = mailError.response;
        metadata.responseCode = mailError.responseCode;
      } else {
        metadata.rawError = error;
      }

      this.logger.error(errorMessage, JSON.stringify(metadata), 'MailConsumer');
    }
  }
}
