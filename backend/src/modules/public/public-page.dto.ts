import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageBlock } from '../pages/page.entity';

/**
 * Read-only payload for marketing-web and crawlers.
 * @see PUBLIC_RUNTIME_ARCHITECTURE.md
 */
export class PublicPageDto {
  @ApiProperty({ example: '/lviv/ses-10-kvt' })
  path: string;

  @ApiProperty({ example: 'СЕС 10 кВт у Львові | Solomiya Energy' })
  title: string;

  @ApiPropertyOptional({ example: 'Професійні сонячні електростанції…' })
  metaDescription: string | null;

  @ApiPropertyOptional({
    example: 'https://www.solomiya-energy.com/lviv/ses-10-kvt',
    description:
      'Absolute canonical URL. Null when the project has no domain/marketing origin '
      + 'configured; marketing-web then derives canonical from the request origin.',
    nullable: true,
  })
  canonicalUrl: string | null;

  @ApiProperty({ example: true })
  robotsIndex: boolean;

  @ApiProperty({ example: true })
  robotsFollow: boolean;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  blocks: PageBlock[];

  @ApiPropertyOptional({ example: 'Сонячні панелі…' })
  seoKeywords: string | null;

  @ApiPropertyOptional()
  ogTitle: string | null;

  @ApiPropertyOptional()
  ogDescription: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/og-image.jpg' })
  ogImageUrl: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  structuredData: Record<string, unknown> | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  publishedAt: string | null;

  @ApiProperty({ example: false })
  isHomepage: boolean;
}
