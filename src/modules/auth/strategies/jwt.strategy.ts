import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/drizzle.module';
import { eq } from 'drizzle-orm';
import { users } from '../../../database/schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(DATABASE_CONNECTION) private readonly db: any,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwt.accessSecret') || '',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub));

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return { id: user.id, email: user.email, role: user.role, fullName: user.fullName };
  }
}
