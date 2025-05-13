import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserJwtPayload } from '../../infrastructure/jwt/service/jwt.service';

export const GetCurrentUser = createParamDecorator(
  (data: keyof UserJwtPayload | undefined, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: UserJwtPayload }>();
    if (!data) return request.user;
    return request.user?.[data];
  },
);
