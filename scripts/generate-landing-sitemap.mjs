
/**
 * Automatically discovers prerendered SEO landing pages carrying the explicit
 * data-navstreet-sitemap="landing" marker and adds them to sitemap.xml.
 * Runs AFTER the existing property and blog generators.
 * Does not modify other sitemap entries or existing SEO scripts.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve('dist/template/browser');
const SITEMAP = join(ROOT, 'sitemap.xml');
const ORIGIN = 'https://navstreet.com';
const MARKER = /data-navstreet-sitemap=["']landing["']/i;
const START = '<!-- NAVSTREET-LANDING-SITEMAP:START -->';
const END = '<!-- NAVSTREET-LANDING-SITEMAP:END -->';
const xmlEscape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function discover(dir, segments = [], depth = 0) {
  if (depth > 5) return [];
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Only public, simple, static URL segments. Never crawl admin/workflows.
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) continue;
      found.push(...await discover(path, [...segments, entry.name], depth + 1));
    } else if (entry.isFile() && entry.name === 'index.html' && segments.length) {
      const html = await readFile(path, 'utf8');
      if (!MARKER.test(html)) continue;
      if (!/<h1\b/i.test(html)) throw new Error(`Landing page missing H1: ${path}`);
      if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
        throw new Error(`Marked landing page has noindex: ${path}`);
      }
      found.push(`${ORIGIN}/${segments.join('/')}/`);
    }
  }
  return found;
}

async function main() {
  const sitemap = await readFile(SITEMAP, 'utf8');
  if (!/<urlset\b/.test(sitemap) || !/<\/urlset>/.test(sitemap)) {
    throw new Error('Invalid sitemap.xml: missing urlset');
  }
  if (sitemap.includes(START) !== sitemap.includes(END)) {
    throw new Error('Unbalanced landing sitemap markers');
  }
  const urls = [...new Set(await discover(ROOT))].sort();
  if (!urls.length) throw new Error('No marked prerendered landing pages found');

  let base = sitemap.replace(new RegExp(`${START}[\\s\\S]*?${END}\\s*`, 'g'), '');
  // Remove duplicates of newly discovered landing URLs already in the base.
  for (const url of urls) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    base = base.replace(new RegExp(`<url>\\s*<loc>${escaped}<\\/loc>[\\s\\S]*?<\\/url>\\s*`, 'g'), '');
  }
  const entries = urls.map(url => `  <url>\n    <loc>${xmlEscape(url)}</loc>\n  </url>`).join('\n');
  const result = base.replace('</urlset>', `${START}\n${entries}\n${END}\n</urlset>`);
  const locs = [...result.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (new Set(locs).size !== locs.length) throw new Error('Duplicate sitemap URL detected; refusing to deploy');
  if (locs.length < urls.length) throw new Error('Unexpected sitemap URL loss');
  await writeFile(SITEMAP, result, 'utf8');
  console.log(`Added ${urls.length} landing page(s); sitemap contains ${locs.length} URLs`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
