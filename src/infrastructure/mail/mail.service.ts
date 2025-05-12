import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Mail } from './type/mail';
import * as otpGenerator from 'otp-generator';

@Injectable()
export class MailService {
  constructor(@InjectQueue('mailQueue') private mail: Queue) {}

  /**
   * Sends an email using the mail queue.
   *
   * @param mail
   */
  async sendMail(mail: Mail): Promise<void> {
    await this.mail.add('sendMail', mail);
  }

  /**
   * Sends an OTP email to the user.
   *
   * @param email
   */
  async sendOtpEmail(email: string): Promise<string> {
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <h2 style="color: #333;">Your One-Time Password</h2>
        <p>Use the following code to complete your authentication:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
          <h1 style="letter-spacing: 5px; color: #333; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `;

    const mailPayloads: Mail = {
      to: email,
      subject: 'One-Time Password',
      text: `Your One-Time Password: ${otp}`,
      html: htmlContent,
    };

    await this.mail.add('sendOtpEmail', mailPayloads, {
      priority: 1,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });

    return otp;
  }
}
