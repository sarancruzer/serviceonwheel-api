import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { authConfig } from '../config/auth.config'
import { ConfigType } from '@nestjs/config'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.accessSecret,
        signOptions: {
          expiresIn: `${config.accessTtlMinutes}m`,
        },
      }),
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService, JwtStrategy],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
