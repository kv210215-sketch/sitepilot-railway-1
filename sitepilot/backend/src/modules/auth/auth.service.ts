import {
  Injectable, ConflictException, UnauthorizedException,
  BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

import { User, UserStatus } from '../users/user.entity';
import {
  RegisterDto, LoginDto, RefreshTokenDto,
  ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto,
  AuthResponseDto, AuthTokensDto,
} from './auth.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    const rounds = this.config.get<number>('app.bcryptRounds') ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, rounds);
    const verifyToken = randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      status: UserStatus.PENDING_VERIFICATION,
      emailVerified: false,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: verifyExpires,
    });

    await this.userRepo.save(user);
    this.logger.log(`User registered: ${user.email}`);

    // TODO: Send verification email via MailService

    const tokens = await this.generateTokens(user);
    return { user: this.toAuthUser(user), tokens };
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip?: string): Promise<AuthResponseDto> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      // Timing-safe: always compare even on miss
      await bcrypt.compare(dto.password, '$2b$12$invalidhashfortimingsafety000000000');
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Акаунт заблокований');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Акаунт деактивований');
    }

    // Update last login
    await this.userRepo.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip ?? null,
    });

    this.logger.log(`User logged in: ${user.email}`);
    const tokens = await this.generateTokens(user);
    return { user: this.toAuthUser(user), tokens };
  }

  // ── Refresh Tokens ──────────────────────────────────────────────────────────

  async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Невалідний refresh token');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Користувача не знайдено або заблокований');
    }

    return this.generateTokens(user);
  }

  // ── Forgot Password ─────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'Якщо email існує — ми надіслали інструкції' };
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await this.userRepo.update(user.id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    // TODO: Send reset email via MailService
    this.logger.log(`Password reset requested for: ${user.email}`);

    return { message: 'Якщо email існує — ми надіслали інструкції' };
  }

  // ── Reset Password ──────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { resetPasswordToken: dto.token },
    });

    if (!user || !user.resetPasswordExpires) {
      throw new BadRequestException('Невалідний або застарілий токен');
    }

    if (new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('Токен прострочений');
    }

    const rounds = this.config.get<number>('app.bcryptRounds') ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    await this.userRepo.update(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      status: UserStatus.ACTIVE,
    });

    this.logger.log(`Password reset for: ${user.email}`);
    return { message: 'Пароль успішно змінено' };
  }

  // ── Change Password ─────────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Користувача не знайдено');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Поточний пароль невірний');

    const rounds = this.config.get<number>('app.bcryptRounds') ?? 12;
    const passwordHash = await bcrypt.hash(dto.newPassword, rounds);

    await this.userRepo.update(userId, { passwordHash });
    return { message: 'Пароль успішно змінено' };
  }

  // ── Verify Email ────────────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { emailVerifyToken: token },
    });

    if (!user || !user.emailVerifyExpires) {
      throw new BadRequestException('Невалідний токен підтвердження');
    }

    if (new Date() > user.emailVerifyExpires) {
      throw new BadRequestException('Токен підтвердження прострочений');
    }

    await this.userRepo.update(user.id, {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
      status: UserStatus.ACTIVE,
    });

    return { message: 'Email підтверджено' };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async generateTokens(user: User): Promise<AuthTokensDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
    });

    // expiresIn in seconds for frontend
    const decoded = this.jwtService.decode(accessToken) as JwtPayload;
    const expiresIn = decoded.exp! - decoded.iat!;

    return { accessToken, refreshToken, expiresIn };
  }

  private toAuthUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
