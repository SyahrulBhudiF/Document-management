import { User } from '../../../config/db/schema';
import { z } from 'zod';

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(150),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

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
