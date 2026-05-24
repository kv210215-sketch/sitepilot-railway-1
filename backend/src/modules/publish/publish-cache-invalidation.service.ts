import { Injectable, Logger } from '@nestjs/common';

import {
  PublishCacheInvalidationPort,
  PublishInvalidationPayload,
} from './publish-cache-invalidation.interface';

/**
 * P0 stub — publish jobs remain DB-only (simulatePagePublish).
 *
 * TODO(P1): POST {MARKETING_REVALIDATE_URL}/api/revalidate
 *   Authorization: Bearer {REVALIDATE_SECRET}
 *   Body: { projectSlug, paths, tags: [`page:${path}`], scope: 'page' }
 *
 * TODO(P1): enqueue via job queue so publish latency is not blocked by marketing availability
 */
@Injectable()
export class PublishCacheInvalidationService implements PublishCacheInvalidationPort {
  private readonly logger = new Logger(PublishCacheInvalidationService.name);

  async invalidateAfterPublish(payload: PublishInvalidationPayload): Promise<void> {
    this.logger.debug(
      `Cache invalidation skipped (P0 stub) scope=${payload.scope} paths=${payload.paths.length}`,
    );
  }
}
