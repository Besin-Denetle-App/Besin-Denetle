import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser Decorator
 * JWT'den kullanıcı bilgisini çıkarır
 *
 * Kullanım:
 * @CurrentUser() user: JwtUser
 * @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: Record<string, unknown> }>();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
