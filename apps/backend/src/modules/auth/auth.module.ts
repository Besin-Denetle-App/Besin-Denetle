import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities';
import { AuthService } from './auth.service';
import { AuthAccountController } from './controllers/auth-account.controller';
import { AuthLoginController } from './controllers/auth-login.controller';
import { AuthRegisterController } from './controllers/auth-register.controller';
import { OAuthService } from './oauth.service';
import { JwtStrategy } from './tokens/jwt.strategy';
import { TokenService } from './tokens/token.service';
import { UserService } from './user.service';

// OAuth, JWT, tempToken yönetimi
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET')!,
        signOptions: {
          expiresIn: configService.get<number>('jwt.accessTokenExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthLoginController,
    AuthRegisterController,
    AuthAccountController,
  ],
  providers: [
    AuthService,
    OAuthService,
    TokenService,
    JwtStrategy,
    UserService,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
