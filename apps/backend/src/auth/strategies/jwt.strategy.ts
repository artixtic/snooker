import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true, // Ignore expiration since tokens never expire
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}

