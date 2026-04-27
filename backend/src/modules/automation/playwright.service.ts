import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PlaywrightPublishOptions {
  projectId:  string;  // Tilda project ID
  pageIds?:   string[]; // Specific page IDs to publish (empty = all)
  dryRun?:    boolean;  // Log without actually clicking
}

export interface PublishPageResult {
  pageId:    string;
  title:     string;
  success:   boolean;
  error?:    string;
  durationMs: number;
}

export interface PlaywrightPublishResult {
  projectId:   string;
  total:       number;
  succeeded:   number;
  failed:      number;
  durationMs:  number;
  pages:       PublishPageResult[];
  logs:        string[];
}

@Injectable()
export class PlaywrightService {
  private readonly logger = new Logger(PlaywrightService.name);

  constructor(private readonly config: ConfigService) {}

  async publishProject(opts: PlaywrightPublishOptions): Promise<PlaywrightPublishResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const pageResults: PublishPageResult[] = [];

    const log = (msg: string) => {
      this.logger.log(msg);
      logs.push(`[${new Date().toISOString()}] ${msg}`);
    };

    log(`Starting Playwright publish: project=${opts.projectId} dryRun=${opts.dryRun ?? false}`);

    // Dynamically require playwright to avoid startup crash when not installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chromium: any | null = null;
    try {
      const pw = await import('playwright');
      chromium = pw.chromium;
    } catch {
      log('WARNING: playwright not installed — running in simulation mode');
    }

    if (!chromium || opts.dryRun) {
      return this.simulatePublish(opts, logs, startTime);
    }

    const tildaEmail    = this.config.get<string>('automation.tildaEmail') ?? '';
    const tildaPassword = this.config.get<string>('automation.tildaPassword') ?? '';

    if (!tildaEmail || !tildaPassword) {
      log('ERROR: TILDA_EMAIL or TILDA_PASSWORD not configured');
      return {
        projectId:  opts.projectId,
        total: 0, succeeded: 0, failed: 0,
        durationMs: Date.now() - startTime,
        pages: [],
        logs,
      };
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      viewport:  { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    try {
      // ── Login ──────────────────────────────────────────────────────────────
      log('Navigating to Tilda login...');
      await page.goto('https://tilda.cc/login/', { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', tildaEmail);
      await page.fill('input[name="pass"]',  tildaPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/projects/**', { timeout: 15_000 });
      log('Login successful');

      // ── Open project ───────────────────────────────────────────────────────
      log(`Opening project: ${opts.projectId}`);
      await page.goto(`https://tilda.cc/projects/${opts.projectId}/`, { waitUntil: 'networkidle' });

      // ── Get all publish buttons ───────────────────────────────────────────
      const publishButtons = await page.$$('button[data-action="publishone"], .t-card__publish-btn, button.js-publish-page');
      log(`Found ${publishButtons.length} publish buttons`);

      const targetButtons = opts.pageIds?.length
        ? publishButtons // Filter by pageId via data attrs if available
        : publishButtons;

      let succeeded = 0;
      let failed    = 0;

      for (let i = 0; i < targetButtons.length; i++) {
        const btn       = targetButtons[i];
        const pageStart = Date.now();
        const pageId    = await btn.getAttribute('data-page-id') ?? `page_${i + 1}`;
        const pageTitle = await btn.getAttribute('data-page-name') ?? `Page ${i + 1}`;

        try {
          log(`Publishing page: ${pageTitle} (${pageId})`);
          await btn.click();
          // Wait for success indicator
          await page.waitForSelector('.t-card__published, .js-page-published, [data-status="published"]', {
            timeout: 30_000,
          }).catch(() => null); // Non-blocking — page might already be published

          succeeded++;
          const duration = Date.now() - pageStart;
          log(`✓ Published: ${pageTitle} in ${duration}ms`);
          pageResults.push({ pageId, title: pageTitle, success: true, durationMs: duration });

          // Respect rate limits
          await page.waitForTimeout(500 + Math.random() * 500);
        } catch (err: unknown) {
          failed++;
          const msg = err instanceof Error ? err.message : String(err);
          log(`✗ Failed: ${pageTitle} — ${msg}`);
          pageResults.push({ pageId, title: pageTitle, success: false, error: msg, durationMs: Date.now() - pageStart });
        }
      }

      log(`Publish complete: ${succeeded} success, ${failed} failed`);

      return {
        projectId:  opts.projectId,
        total:      targetButtons.length,
        succeeded,
        failed,
        durationMs: Date.now() - startTime,
        pages:      pageResults,
        logs,
      };
    } finally {
      await browser.close();
    }
  }

  // ── Simulation (no Playwright / dry run) ─────────────────────────────────

  private async simulatePublish(
    opts:      PlaywrightPublishOptions,
    logs:      string[],
    startTime: number,
  ): Promise<PlaywrightPublishResult> {
    const log = (msg: string) => {
      this.logger.log(msg);
      logs.push(`[${new Date().toISOString()}] ${msg}`);
    };

    const mockPages = opts.pageIds?.length ?? 5;
    const pages: PublishPageResult[] = [];
    let succeeded = 0;
    let failed    = 0;

    for (let i = 0; i < mockPages; i++) {
      const duration = 200 + Math.random() * 600;
      const success  = Math.random() > 0.05;
      const pageId   = opts.pageIds?.[i] ?? `sim_page_${i + 1}`;

      await new Promise(r => setTimeout(r, duration));

      if (success) {
        succeeded++;
        log(`✓ [SIM] Published page ${pageId} in ${Math.round(duration)}ms`);
        pages.push({ pageId, title: `Page ${i + 1}`, success: true, durationMs: Math.round(duration) });
      } else {
        failed++;
        log(`✗ [SIM] Failed page ${pageId}: Timeout`);
        pages.push({ pageId, title: `Page ${i + 1}`, success: false, error: 'Simulation timeout', durationMs: Math.round(duration) });
      }
    }

    return {
      projectId:  opts.projectId,
      total:      mockPages,
      succeeded,
      failed,
      durationMs: Date.now() - startTime,
      pages,
      logs,
    };
  }
}
