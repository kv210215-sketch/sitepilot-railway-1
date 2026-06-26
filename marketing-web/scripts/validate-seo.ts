import { runSeoValidation } from '../lib/seo/validate';

const report = runSeoValidation();

if (!report.ok) {
  console.error('SEO validation failed');
  if (report.metadataIssues.length) console.error('Metadata:', report.metadataIssues);
  if (report.schemaIssues.length) console.error('Schema:', report.schemaIssues);
  if (report.sitemapIssues.length) console.error('Sitemap:', report.sitemapIssues);
  process.exit(1);
}

console.log('SEO validation passed');
