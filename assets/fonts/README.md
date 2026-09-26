# Fonts for generated images

Read from disk by the Open Graph image routes (`src/lib/seo/og.tsx`) — `next/og` can't use the
`next/font` build output, and needs .woff/.ttf rather than .woff2.

| File | Source | Licence |
|---|---|---|
| bricolage-grotesque-latin-{600,700}-normal.woff | npm `@fontsource/bricolage-grotesque@5.3.0` | OFL-1.1 |
| public-sans-latin-{400,600}-normal.woff | npm `@fontsource/public-sans@5.3.0` | OFL-1.1 |

Same faces as the site (DESIGN.md §3), latin subset only.
