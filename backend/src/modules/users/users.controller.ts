import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
  HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiResponse, ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards';
import { Roles } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';
import { SystemRole } from './user.entity';
import { UsersService } from './users.service';
import {
  CreateUserDto, UpdateUserDto,
  ListUsersQueryDto, UserResponseDto, PaginatedUsersDto,
} from './users.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── GET /users ─────────────────────────────────────────────────────────────

  @Get()
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Список користувачів (тільки адміни)' })
  @ApiResponse({ status: 200, type: PaginatedUsersDto })
  findAll(@Query() query: ListUsersQueryDto): Promise<PaginatedUsersDto> {
    return this.usersService.findAll(query);
  }

  // ── GET /users/:id ─────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Отримати користувача (сам або адмін)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<UserResponseDto> {
    if (
      currentUser.id !== id &&
      currentUser.role !== SystemRole.ADMIN &&
      currentUser.role !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Немає доступу до даних іншого користувача');
    }
    return this.usersService.findById(id);
  }

  // ── POST /users ────────────────────────────────────────────────────────────

  @Post()
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Створити користувача (тільки адміни)' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  // ── PATCH /users/:id ───────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Оновити користувача (сам або адмін)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<UserResponseDto> {
    const isSelf = currentUser.id === id;
    const isAdmin =
      currentUser.role === SystemRole.ADMIN ||
      currentUser.role === SystemRole.SUPER_ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('Немає доступу до даних іншого користувача');
    }

    // Non-admins can only update safe profile fields
    if (!isAdmin) {
      const safeUpdate: Pick<UpdateUserDto, 'name' | 'avatarUrl' | 'timezone' | 'locale'> = {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.locale !== undefined && { locale: dto.locale }),
      };
      return this.usersService.update(id, safeUpdate);
    }

    return this.usersService.update(id, dto);
  }

  // ── DELETE /users/:id ──────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Деактивувати користувача (тільки адміни)' })
  @ApiParam({ name: 'id', type: String })
  deactivate(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.usersService.deactivate(id);
  }
}
