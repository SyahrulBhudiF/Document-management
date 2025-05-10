import { z } from 'zod';
import { User } from '../../../config/db/schema';

interface SignUpDtoProperties {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const SignUpSchema: z.ZodType<SignUpDtoProperties> = z
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

interface SignInDtoProperties {
  email: string;
  password: string;
}

export const SignInSchema: z.ZodType<SignInDtoProperties> = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInDto = z.infer<typeof SignInSchema>;

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  loginAt?: Date | null;
  emailVerified?: Date | null;
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
