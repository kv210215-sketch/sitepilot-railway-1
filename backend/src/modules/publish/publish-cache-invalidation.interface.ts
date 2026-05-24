/**
 * Contract for marketing-web cache invalidation after publish.
 * P0: no-op implementation only — does not change publish outcomes.
 *
 * @see CACHE_INVALIDATION_STRATEGY.md
 * @see PUBLISHING_PIPELINE.md §7
 */

export interface PublishInvalidationPayload {
  projectSlug: string;
  projectId: string;
  paths: string[];
  scope: 'page' | 'project' | 'sitemap';
}

export interface PublishCacheInvalidationPort {
  invalidateAfterPublish(payload: PublishInvalidationPayload): Promise<void>;
}
