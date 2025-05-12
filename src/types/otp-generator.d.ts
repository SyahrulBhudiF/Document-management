declare module 'otp-generator' {
  interface OtpOptions {
    digits?: boolean;
    lowerCaseAlphabets?: boolean;
    upperCaseAlphabets?: boolean;
    specialChars?: boolean;
  }

  export function generate(length: number, options?: OtpOptions): string;
}
