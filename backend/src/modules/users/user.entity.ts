import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  OneToMany, BeforeInsert, BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum SystemRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 150 })
  name: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Column({ type: 'enum', enum: SystemRole, default: SystemRole.USER })
  role: SystemRole;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Exclude()
  @Column({ name: 'email_verify_token', type: 'varchar', length: 255, nullable: true })
  emailVerifyToken: string | null;

  @Column({ name: 'email_verify_expires', type: 'timestamptz', nullable: true })
  emailVerifyExpires: Date | null;

  @Exclude()
  @Column({ name: 'reset_password_token', type: 'varchar', length: 255, nullable: true })
  resetPasswordToken: string | null;

  @Column({ name: 'reset_password_expires', type: 'timestamptz', nullable: true })
  resetPasswordExpires: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'last_login_ip', type: 'inet', nullable: true })
  lastLoginIp: string | null;

  @Column({ default: 'Europe/Kiev', length: 100 })
  timezone: string;

  @Column({ default: 'uk', length: 10 })
  locale: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Exclude()
  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true })
  refreshTokenHash: string | null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  async validatePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash);
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    // Only hash if the field starts without $2b$ (not already hashed)
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  }
}
