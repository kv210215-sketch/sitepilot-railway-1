import {
  IsEnum, IsOptional, IsArray, IsUUID,
  IsInt, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PublishScope, PublishStatus } from './publish-job.entity';

export class CreatePublishJobDto {
  @ApiProperty({ enum: PublishScope })
  @IsEnum(PublishScope)
  scope: PublishScope;

  @ApiPropertyOptional({ type: [String], description: 'UUID сторінок для scope=selected' })
  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  pageIds?: string[];

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 10 })
  @IsOptional() @IsInt() @Min(1) @Max(10)
  priority?: number;
}

export class ListJobsDto {
  @ApiPropertyOptional({ enum: PublishStatus })
  @IsOptional() @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}

export class QueueQueryDto {
  @ApiPropertyOptional({ default: 10 })
  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}

export class PublishJobResponseDto {
  @ApiProperty() id:           string;
  @ApiProperty() projectId:    string;
  @ApiProperty() scope:        PublishScope;
  @ApiProperty() status:       PublishStatus;
  @ApiProperty() pagesTotal:   number;
  @ApiProperty() pagesSuccess: number;
  @ApiProperty() pagesFailed:  number;
  @ApiProperty() attempt:      number;
  @ApiProperty() maxAttempts:  number;
  @ApiProperty() priority:     number;
  @ApiProperty({ nullable: true }) durationMs:    number | null;
  @ApiProperty({ nullable: true }) errorMessage:  string | null;
  @ApiProperty({ nullable: true }) startedAt:     Date | null;
  @ApiProperty({ nullable: true }) completedAt:   Date | null;
  @ApiProperty() queuedAt:    Date;
  @ApiProperty() createdAt:   Date;
  @ApiProperty({ nullable: true }) initiatorName?: string;
}

export class PaginatedJobsDto {
  @ApiProperty({ type: [PublishJobResponseDto] }) data:       PublishJobResponseDto[];
  @ApiProperty() total:      number;
  @ApiProperty() page:       number;
  @ApiProperty() limit:      number;
  @ApiProperty() totalPages: number;
}
