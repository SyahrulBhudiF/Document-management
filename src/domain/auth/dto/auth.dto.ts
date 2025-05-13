import { z } from 'zod';
import { User } from '../../../config/db/schema';

export const SignUpSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(32, 'Password can be at most 32 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*()]/,
        'Password must contain at least one special character',
      ),
    password_confirmation: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(32, 'Password can be at most 32 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*()]/,
        'Password must contain at least one special character',
      ),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export type SignUpDto = z.infer<typeof SignUpSchema>;

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInDto = z.infer<typeof SignInSchema>;

export const SendEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  retry: z.boolean().optional(),
});

export type SendEmailDto = z.infer<typeof SendEmailSchema>;

export const VerifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(1, 'OTP is required'),
});

export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;

export const SetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  new_password: z
    .string()
    .min(8)
    .max(32)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[!@#$%^&*()]/, 'Must contain special char'),
});

export type SetPasswordDto = z.infer<typeof SetPasswordSchema>;

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  loginAt?: Date | null;
  emailVerified?: Date | null;
};

export type SignInResponse = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
};

export const toUserResponse = (user: Partial<User>): UserResponse => {
  return {
    id: user.id!,
    name: user.name!,
    email: user.email!,
    createdAt: user.createdAt!,
    updatedAt: user.updatedAt!,
    loginAt: user.loginAt,
    emailVerified: user.emailVerified,
  };
};
