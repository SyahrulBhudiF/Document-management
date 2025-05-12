export const envConfig = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL as string,

  PORT: Number(process.env.PORT) || 3000,

  // Mailtrap Configuration
  MAIL_SERVICE: process.env.MAIL_SERVICE || 'smtp',
  MAIL_HOST: process.env.MAIL_HOST as string,
  MAIL_PORT: Number(process.env.MAIL_PORT),
  MAIL_USERNAME: process.env.MAIL_USERNAME as string,
  MAIL_PASSWORD: process.env.MAIL_PASSWORD as string,
  EMAIL_USER: process.env.EMAIL_USER || 'noreply@gmail.com',

  // JWT Configuration
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  ACCESS_TOKEN_EXPIRES_IN: Number(process.env.ACCESS_TOKEN_EXPIRES_IN), // in hours
  REFRESH_TOKEN_EXPIRES_IN: Number(process.env.REFRESH_TOKEN_EXPIRES_IN), // in days

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI as string,

  // Redis Configuration
  REDIS_HOST: process.env.REDIS_HOST as string,
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
};
