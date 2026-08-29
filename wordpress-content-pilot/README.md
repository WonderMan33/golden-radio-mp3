# Golden Radio Hour WordPress content pilot

This directory is generated from the repository's authoritative `shows.json` by:

```bash
node tools/generate_wordpress_pilot.mjs
```

The pilot contains one CBS Radio Mystery Theater guide and five episode pages. All records in `manifest.json` are marked `draft`; nothing in this directory publishes or modifies the live WordPress site.

The HTML files are full previews containing page metadata, canonical URLs, responsive styling, audio players, internal navigation, and JSON-LD. After Wade approves the content and presentation, the next phase is a WordPress importer that stores shows and episodes as separate content types and updates existing records without creating duplicates.

Historical program facts in the show introduction were checked against the CBS Radio Mystery Theater archive and Radio Drama Network. Episode-specific facts remain grounded in `shows.json`.
