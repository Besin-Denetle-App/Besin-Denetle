import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** JWT'den kullanıcı bilgisini çıkarır - @CurrentUser('id') şeklinde kullanılır */
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
