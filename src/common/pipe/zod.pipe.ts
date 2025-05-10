import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          message: err.message,
          field: err.path.join('.'),
        }));

        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      throw error;
    }
  }
}
