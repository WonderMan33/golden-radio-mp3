import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'shows.json'), 'utf8'));
const outputRoot = path.join(root, 'wordpress-content-pilot');
const episodeRoot = path.join(outputRoot, 'episodes');

const showName = 'CBS Radio Mystery Theater';
const episodes = catalog
  .filter((entry) => entry.show === showName && entry.plotSynopsis)
  .sort((a, b) => String(a.sortKey).localeCompare(String(b.sortKey)))
  .slice(0, 5);

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const slugify = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const formatDate = (date) => new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

const detailParts = (description = '') => {
  const writer = description.match(/Written or adapted by ([^.]+)\./i)?.[1]?.trim() || '';
  const cast = description.match(/Featured cast includes ([\s\S]+?)\.*$/i)?.[1]?.trim() || '';
  return { writer, cast: cast.replace(/\.+$/, '') };
};

const pageShell = ({ title, description, canonicalPath, body, schema }) => `<!doctype html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="https://goldenradiohour.com/${canonicalPath}/">
  <script type="application/ld+json">${JSON.stringify(schema, null, 2).replaceAll('</', '<\/')}</script>
  <style>
    body{margin:0;background:#120f0d;color:#f6ead7;font:18px/1.65 Georgia,serif}.grh-page{max-width:920px;margin:auto;padding:36px 22px 64px}.grh-kicker{color:#e8ad55;font:700 13px/1.2 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}.grh-hero{display:grid;grid-template-columns:minmax(180px,280px) 1fr;gap:32px;align-items:center}.grh-cover{width:100%;border-radius:18px;box-shadow:0 18px 48px #0009}.grh-page h1{font-size:clamp(36px,6vw,64px);line-height:1.05;margin:.25em 0}.grh-page h2{color:#f2bd69;margin-top:1.7em}.grh-meta{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0}.grh-meta span{background:#2a211b;border:1px solid #5c4431;border-radius:999px;padding:6px 12px;font:700 13px Arial,sans-serif}.grh-player{width:100%;margin:12px 0 22px}.grh-note{border-left:4px solid #d68b32;background:#211914;padding:14px 18px}.grh-nav{display:flex;justify-content:space-between;gap:18px;margin-top:40px}.grh-nav a{color:#ffd28d}@media(max-width:680px){.grh-hero{grid-template-columns:1fr}.grh-cover{max-width:260px}}
  </style>
</head>
<body><main class="grh-page">${body}</main></body>
</html>`;

const showSlug = 'old-time-radio-shows/cbs-radio-mystery-theater';
const coverUrl = 'https://raw.githubusercontent.com/WonderMan33/golden-radio-mp3/main/artwork/shows/cbs-radio-mystery-theater/cover.jpg';

const episodeCards = episodes.map((episode) => {
  const episodeSlug = `${showSlug}/${slugify(episode.displayTitle.replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, ''))}-${episode.broadcastDate}`;
  return `<li><a href="/${episodeSlug}/">${escapeHtml(episode.displayTitle)}</a> — ${escapeHtml(episode.plotSynopsis)}</li>`;
}).join('\n');

const showBody = `
<section class="grh-hero">
  <img class="grh-cover" src="${coverUrl}" alt="CBS Radio Mystery Theater cover artwork" width="600" height="600">
  <div><div class="grh-kicker">Golden Radio Hour Program Guide</div><h1>CBS Radio Mystery Theater</h1><p>Listen to suspense, mystery, horror, science fiction, and dramatic stories from Himan Brown's celebrated return to network radio drama.</p></div>
</section>
<h2>A new chapter for radio drama</h2>
<p>CBS Radio Mystery Theater arrived in 1974, more than a decade after regularly scheduled network radio drama had largely disappeared. Veteran producer Himan Brown created and directed the anthology, drawing on the theatrical storytelling traditions he had helped establish during radio's earlier era. The series continued through 1982 and produced 1,399 original episodes.</p>
<p>E. G. Marshall served as the familiar host for most of the run, guiding listeners into each story with the program's famous creaking-door opening. Tammy Grimes hosted during the final season. Although mystery was central to the title, the program ranged widely across crime, supernatural tales, psychological suspense, science fiction, historical drama, and adaptations of classic literature.</p>
<h2>Why it still works</h2>
<p>The program was designed for listening rather than watching. Dialogue, music, and sound effects supply the setting while the listener supplies the pictures. That makes each episode equally suited to focused listening, nighttime listening, or rediscovering the kind of dramatic performance that once filled American living rooms.</p>
<p>Golden Radio Hour's catalog currently contains ${catalog.filter((entry) => entry.show === showName).length.toLocaleString('en-US')} recordings associated with the series, organized by broadcast date and episode number. The archive includes concise plot summaries to help listeners choose a story without revealing every turn.</p>
<h2>Start listening</h2>
<ol>${episodeCards}</ol>
<p class="grh-note"><strong>Archive note:</strong> Historical episode titles and credits are preserved as originally cataloged. Dates and episode numbers are presented when supported by the source recording and verified catalog data.</p>`;

const showPage = pageShell({
  title: 'CBS Radio Mystery Theater Episodes and Program Guide | Golden Radio Hour',
  description: 'Explore CBS Radio Mystery Theater, learn about Himan Brown and E. G. Marshall, and listen to organized episodes from the Golden Radio Hour archive.',
  canonicalPath: showSlug,
  body: showBody,
  schema: {
    '@context': 'https://schema.org', '@type': 'RadioSeries', name: showName,
    url: `https://goldenradiohour.com/${showSlug}/`, startDate: '1974-01-06', endDate: '1982-12-31',
    creator: { '@type': 'Person', name: 'Himan Brown' }, image: coverUrl,
  },
});

fs.mkdirSync(episodeRoot, { recursive: true });
fs.writeFileSync(path.join(outputRoot, 'cbs-radio-mystery-theater.html'), showPage);

const manifest = [{
  type: 'show', status: 'draft', title: showName, slug: showSlug,
  file: 'cbs-radio-mystery-theater.html', sourceCount: catalog.filter((entry) => entry.show === showName).length,
}];

episodes.forEach((episode, index) => {
  const cleanTitle = episode.displayTitle.replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, '');
  const slug = `${slugify(cleanTitle)}-${episode.broadcastDate}`;
  const canonicalPath = `${showSlug}/${slug}`;
  const { writer, cast } = detailParts(episode.episodeDescription);
  const previous = episodes[index - 1];
  const next = episodes[index + 1];
  const nav = `<nav class="grh-nav">${previous ? `<a href="/${showSlug}/${slugify(previous.displayTitle.replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, ''))}-${previous.broadcastDate}/">← Previous episode</a>` : '<span></span>'}${next ? `<a href="/${showSlug}/${slugify(next.displayTitle.replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, ''))}-${next.broadcastDate}/">Next episode →</a>` : ''}</nav>`;
  const body = `<div class="grh-kicker">CBS Radio Mystery Theater · Episode ${escapeHtml(episode.episodeNumber)}</div>
<h1>${escapeHtml(cleanTitle)}</h1>
<div class="grh-meta"><span>Broadcast ${escapeHtml(formatDate(episode.broadcastDate))}</span>${writer ? `<span>Written or adapted by ${escapeHtml(writer)}</span>` : ''}</div>
<audio class="grh-player" controls preload="none" src="${escapeHtml(episode.url)}">Your browser does not support HTML audio.</audio>
<h2>Episode synopsis</h2><p>${escapeHtml(episode.plotSynopsis)}</p>
${cast ? `<h2>Featured cast</h2><p>${escapeHtml(cast)}.</p>` : ''}
<h2>About this recording</h2><p>This recording is part of Golden Radio Hour's organized CBS Radio Mystery Theater archive. The broadcast date, episode number, credits, and synopsis have been matched to the catalog record so listeners can browse the collection chronologically and understand what they are about to hear.</p>
<p class="grh-note"><strong>Spoiler policy:</strong> This guide gives the premise without disclosing the complete resolution. Historical titles and credits are retained for archival accuracy.</p>
<p><a href="/${showSlug}/">Return to the CBS Radio Mystery Theater program guide</a></p>${nav}`;
  const html = pageShell({
    title: `${cleanTitle} – CBS Radio Mystery Theater Episode ${episode.episodeNumber} | Golden Radio Hour`,
    description: `Listen to “${cleanTitle},” CBS Radio Mystery Theater episode ${episode.episodeNumber}, broadcast ${formatDate(episode.broadcastDate)}. Read the cast details and spoiler-light synopsis.`,
    canonicalPath,
    body,
    schema: {
      '@context': 'https://schema.org', '@type': 'RadioEpisode', name: cleanTitle,
      episodeNumber: episode.episodeNumber, datePublished: episode.broadcastDate,
      partOfSeries: { '@type': 'RadioSeries', name: showName, url: `https://goldenradiohour.com/${showSlug}/` },
      associatedMedia: { '@type': 'AudioObject', contentUrl: episode.url, encodingFormat: 'audio/mpeg' },
      description: episode.plotSynopsis,
    },
  });
  fs.writeFileSync(path.join(episodeRoot, `${slug}.html`), html);
  manifest.push({ type: 'episode', status: 'draft', title: cleanTitle, slug: canonicalPath, file: `episodes/${slug}.html`, episodeNumber: episode.episodeNumber, broadcastDate: episode.broadcastDate });
});

fs.writeFileSync(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.length} pilot pages in ${path.relative(root, outputRoot)}`);
