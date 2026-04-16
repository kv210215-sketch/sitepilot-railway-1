import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsEnum, IsOptional, IsString,
  MinLength, MaxLength, IsInt, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus, SystemRole } from './user.entity';

// ── Create User ────────────────────────────────────────────────────────────────

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ enum: SystemRole, default: SystemRole.USER })
  @IsOptional()
  @IsEnum(SystemRole)
  role?: SystemRole;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

// ── Update User ────────────────────────────────────────────────────────────────

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ enum: SystemRole })
  @IsOptional()
  @IsEnum(SystemRole)
  role?: SystemRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'Europe/Kiev' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({ example: 'uk' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}

// ── User Response ──────────────────────────────────────────────────────────────

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ enum: SystemRole })
  role: SystemRole;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  locale: string;

  @ApiPropertyOptional({ nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ── List Users Query ───────────────────────────────────────────────────────────

export class ListUsersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: SystemRole })
  @IsOptional()
  @IsEnum(SystemRole)
  role?: SystemRole;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

// ── Paginated Users Response ───────────────────────────────────────────────────

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
