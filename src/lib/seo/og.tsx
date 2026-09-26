import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

// Open Graph images (MVP.md M6.4): brand, eyebrow, headline — and the post's cover photo beside
// them when it has one. 1200×630, the size every major platform crops to.

export const OG_SIZE = { width: 1200, height: 630 };

// Literal paths, not a helper that joins arguments: with a dynamic path the bundler can't tell
// which files are read and traces the whole project into the function.
const TOKENS_CSS = join(process.cwd(), "src/styles/tokens.css");
const DISPLAY_FONT = join(process.cwd(), "assets/fonts/outfit-latin-600-normal.woff");
const BODY_FONT = join(process.cwd(), "assets/fonts/figtree-latin-600-normal.woff");

/**
 * Satori can't resolve CSS variables, and rule 6 forbids hex literals in components — so colours
 * are read from tokens.css itself (the light-mode :root block). One source of truth.
 */
async function loadTokens() {
  const css = (await readFile(TOKENS_CSS)).toString();
  const root = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
  const token = (name: string) => {
    const match = root.match(new RegExp(`--${name}:\\s*([^;]+);`));
    if (!match) throw new Error(`Token --${name} not found in tokens.css`);
    return match[1]!.trim();
  };
  return {
    ground: token("primary-wash"),
    ink: token("ink"),
    muted: token("ink-muted"),
    primary: token("primary"),
    onPrimary: token("on-primary"),
  };
}

// Loaded once per server instance, not per image.
const assets = Promise.all([loadTokens(), readFile(DISPLAY_FONT), readFile(BODY_FONT)]);

/** The Body Cue mark, as in components/layout/icons.tsx. */
function Mark({ size, primary, onPrimary }: { size: number; primary: string; onPrimary: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill={primary} />
      <path
        d="M6 17h5l2.5-6 4 11 3-8 1.5 3H26"
        fill="none"
        stroke={onPrimary}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Satori decodes PNG and JPEG only — WebP/AVIF uploads fall back to the typographic card. */
const renderable = (url: string | null | undefined) =>
  url && /\.(jpe?g|png)$/i.test(url) ? url : null;

export async function renderOgImage({
  eyebrow,
  title,
  cover,
}: {
  eyebrow: string;
  title: string;
  cover?: string | null;
}) {
  const [colors, display, body] = await assets;
  const photo = renderable(cover);

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: colors.ground }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          width: photo ? 700 : "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Mark size={48} primary={colors.primary} onPrimary={colors.onPrimary} />
          <span style={{ fontFamily: "Display", fontSize: 32, color: colors.ink }}>
            {siteConfig.name}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span
            style={{
              fontFamily: "Body",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: colors.primary,
            }}
          >
            {eyebrow}
          </span>
          <span
            style={{
              fontFamily: "Display",
              fontSize: photo ? 58 : 72,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              color: colors.ink,
            }}
          >
            {title}
          </span>
        </div>
        <span style={{ fontFamily: "Body", fontSize: 22, color: colors.muted }}>
          {new URL(siteConfig.url).host}
        </span>
      </div>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element -- Satori renders <img>, not next/image
        <img src={photo} alt="" width={500} height={630} style={{ objectFit: "cover" }} />
      )}
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Display", data: display, weight: 600, style: "normal" },
        { name: "Body", data: body, weight: 600, style: "normal" },
      ],
    },
  );
}

/** Square brand mark — the publisher logo in structured data, and the Apple touch icon. */
export async function renderLogo(size: number) {
  const [colors] = await assets;
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: colors.onPrimary }}>
      <Mark size={size} primary={colors.primary} onPrimary={colors.onPrimary} />
    </div>,
    { width: size, height: size },
  );
}
