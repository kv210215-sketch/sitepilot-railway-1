import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserStatus } from './user.entity';
import {
  CreateUserDto, UpdateUserDto,
  ListUsersQueryDto, PaginatedUsersDto, UserResponseDto,
} from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ── List (paginated, admin) ──────────────────────────────────────────────────

  async findAll(query: ListUsersQueryDto): Promise<PaginatedUsersDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.userRepo.createQueryBuilder('u');

    if (query.search) {
      qb.where('(u.name ILIKE :q OR u.email ILIKE :q)', { q: `%${query.search}%` });
    }

    if (query.status) qb.andWhere('u.status = :status', { status: query.status });
    if (query.role)   qb.andWhere('u.role = :role', { role: query.role });

    const [users, total] = await qb
      .orderBy('u.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: users.map(this.toResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Find One ─────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Користувача не знайдено');
    return this.toResponseDto(user);
  }

  async findEntityById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Користувача не знайдено');
    return user;
  }

  // ── Create (admin creates) ───────────────────────────────────────────────────

  async create(dto: CreateUserDto, bcryptRounds = 12): Promise<UserResponseDto> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
      withDeleted: true,
    });
    if (existing) throw new ConflictException('Користувач з таким email вже існує');

    const passwordHash = await bcrypt.hash(dto.password, bcryptRounds);

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role,
      status: dto.status ?? UserStatus.ACTIVE,
      emailVerified: true,
    });

    await this.userRepo.save(user);
    return this.toResponseDto(user);
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findEntityById(id);

    if (dto.name !== undefined)      user.name      = dto.name;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.role !== undefined)      user.role      = dto.role;
    if (dto.status !== undefined)    user.status    = dto.status;
    if (dto.timezone !== undefined)  user.timezone  = dto.timezone;
    if (dto.locale !== undefined)    user.locale    = dto.locale;

    await this.userRepo.save(user);

    return this.toResponseDto(user);
  }

  // ── Deactivate ───────────────────────────────────────────────────────────────

  async deactivate(id: string): Promise<{ message: string }> {
    await this.findEntityById(id);
    await this.userRepo.update(id, { status: UserStatus.INACTIVE });
    return { message: 'Користувача деактивовано' };
  }

  // ── Soft Delete ──────────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    await this.findEntityById(id);
    await this.userRepo.softDelete(id);
    return { message: 'Користувача видалено' };
  }

  // ── Private mapper ───────────────────────────────────────────────────────────

  private toResponseDto(user: User): UserResponseDto {
    return {
      id:            user.id,
      email:         user.email,
      name:          user.name,
      avatarUrl:     user.avatarUrl,
      status:        user.status,
      role:          user.role,
      emailVerified: user.emailVerified,
      timezone:      user.timezone,
      locale:        user.locale,
      lastLoginAt:   user.lastLoginAt,
      createdAt:     user.createdAt,
      updatedAt:     user.updatedAt,
    };
  }
}
