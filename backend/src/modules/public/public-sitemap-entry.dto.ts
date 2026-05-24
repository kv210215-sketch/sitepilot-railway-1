import { ApiProperty } from '@nestjs/swagger';

/** Lightweight row for marketing-web sitemap generation. */
export class PublicSitemapEntryDto {
  @ApiProperty({ example: '/privacy' })
  path: string;

  @ApiProperty({ example: true })
  robotsIndex: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt: string | null;

  @ApiProperty({ example: true })
  isHomepage: boolean;
}
