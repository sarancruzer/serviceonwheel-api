import { Inject, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ConfigType } from '@nestjs/config'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { authConfig } from '../../config/auth.config'
import { AuthenticatedUser } from '../../common/interfaces/request-context.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(authConfig.KEY)
    config: ConfigType<typeof authConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessSecret,
    })
  }

  validate(payload: AuthenticatedUser): AuthenticatedUser {
    return payload
  }
}
