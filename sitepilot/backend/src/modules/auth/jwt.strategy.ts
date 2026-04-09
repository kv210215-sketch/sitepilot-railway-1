import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/user.entity';

export interface JwtPayload {
  sub: string;      // user id
  email: string;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'status', 'deletedAt'],
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Користувача не знайдено');
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Акаунт заблокований');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Акаунт деактивований');
    }

    return { id: user.id, email: user.email };
  }
}
