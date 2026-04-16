import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserStatus, SystemRole } from '../users/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdminUser();
  }

  private async seedAdminUser(): Promise<void> {
    const email = this.config.get<string>('app.adminEmail');
    const password = this.config.get<string>('app.adminPassword');
    const name = this.config.get<string>('app.adminName') ?? 'Super Admin';

    if (!email || !password) {
      this.logger.debug('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed');
      return;
    }

    try {
      const existing = await this.userRepo.findOne({ where: { email }, withDeleted: true });
      if (existing) {
        this.logger.debug(`Admin user already exists: ${email}`);
        return;
      }

      const rounds = this.config.get<number>('app.bcryptRounds') ?? 12;
      const passwordHash = await bcrypt.hash(password, rounds);

      const admin = this.userRepo.create({
        email,
        passwordHash,
        name,
        role: SystemRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      await this.userRepo.save(admin);
      this.logger.log(`✓ Admin user seeded: ${email}`);
    } catch (err) {
      this.logger.warn(`Admin seed failed (DB may not be ready yet): ${(err as Error).message}`);
    }
  }
}
