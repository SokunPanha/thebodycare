import { seededRandom, type Random } from "@/lib/utils/seeded-random";

/**
 * Generated cover art. Every post gets a unique image drawn from its slug, in a visual language
 * that belongs to its category — crescents for Sleep, waves for Digestion, and so on.
 *
 * Why generated rather than photographed (DESIGN.md §6): no sourcing or licensing for ~1,275 posts
 * a year, no network request, no layout shift, and it follows light/dark mode for free. Colour is
 * one periwinkle family (the --cover-* tokens) — categories differ by shape, never by hue (§2).
 */

const W = 320;
const H = 200;

const C = {
  ground: "var(--cover-ground)",
  soft: "var(--cover-soft)",
  mid: "var(--cover-mid)",
  strong: "var(--cover-strong)",
  deep: "var(--cover-deep)",
} as const;

const r1 = (n: number) => Math.round(n * 10) / 10;

type Motif = (random: Random) => React.ReactNode;

// ---------------------------------------------------------------------------
// Motifs
// ---------------------------------------------------------------------------

/** Sleep — a crescent moon over soft hills, scattered stars. */
const sleep: Motif = (random) => {
  const moonR = random.range(26, 40);
  const mx = random.range(60, W - 60);
  const my = random.range(45, 85);
  const stars = Array.from({ length: random.int(10, 16) }, () => ({
    x: random.range(8, W - 8),
    y: random.range(8, H * 0.6),
    r: random.range(1.2, 3.2),
  }));
  const hills = [0, 1, 2].map((i) => ({
    y: H - 40 + i * 16 + random.range(-6, 6),
    lift: random.range(18, 42),
    shift: random.range(-80, 80),
    fill: [C.soft, C.mid, C.strong][i]!,
  }));
  return (
    <>
      {stars.map((star, i) => (
        <circle
          key={i}
          cx={r1(star.x)}
          cy={r1(star.y)}
          r={r1(star.r)}
          fill={i % 3 ? C.mid : C.strong}
        />
      ))}
      <circle cx={r1(mx)} cy={r1(my)} r={r1(moonR)} fill={C.strong} />
      <circle
        cx={r1(mx + moonR * 0.42)}
        cy={r1(my - moonR * 0.3)}
        r={r1(moonR * 0.9)}
        fill={C.ground}
      />
      {hills.map((hill, i) => (
        <path
          key={i}
          d={`M0 ${r1(hill.y)} Q ${r1(W / 2 + hill.shift)} ${r1(hill.y - hill.lift)} ${W} ${r1(hill.y)} V${H} H0 Z`}
          fill={hill.fill}
        />
      ))}
    </>
  );
};

/** Digestion — stacked flowing waves. */
const digestion: Motif = (random) => {
  const count = random.int(5, 7);
  const gap = H / (count + 1);
  const palette = [C.soft, C.mid, C.strong, C.mid, C.deep];
  return Array.from({ length: count }, (_, i) => {
    const y = gap * (i + 1);
    const amp = random.range(8, 20);
    const wave = random.range(70, 130);
    const phase = random.range(0, wave);
    let d = `M-20 ${r1(y)}`;
    for (let x = -20; x <= W + 20; x += wave / 2) {
      const up = Math.round((x + phase) / (wave / 2)) % 2 === 0;
      d += ` Q ${r1(x + wave / 4)} ${r1(y + (up ? -amp : amp))} ${r1(x + wave / 2)} ${r1(y)}`;
    }
    return (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={palette[i % palette.length]}
        strokeWidth={r1(random.range(7, 15))}
        strokeLinecap="round"
      />
    );
  });
};

/** Movement — diagonal streaks, like motion. */
const movement: Motif = (random) => {
  const angle = random.range(-38, -22);
  const count = random.int(9, 13);
  return (
    <g transform={`rotate(${r1(angle)} ${W / 2} ${H / 2})`}>
      {Array.from({ length: count }, (_, i) => {
        const h = random.range(10, 18);
        const y = -40 + (i * (H + 80)) / count;
        const len = random.range(90, 260);
        const x = random.range(-60, W - len + 60);
        return (
          <rect
            key={i}
            x={r1(x)}
            y={r1(y)}
            width={r1(len)}
            height={r1(h)}
            rx={r1(h / 2)}
            fill={random.pick([C.soft, C.mid, C.mid, C.strong, C.deep])}
          />
        );
      })}
    </g>
  );
};

/** Food — a grid of seeds: filled, ringed and faint. */
const food: Motif = (random) => {
  const cols = 9;
  const rows = 6;
  const cell = W / cols;
  const dots: React.ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = cell * (col + 0.5) + (row % 2 ? cell / 4 : -cell / 4);
      const cy = (H / rows) * (row + 0.5);
      const r = random.range(6, 13);
      const kind = random.next();
      const key = `${row}-${col}`;
      if (kind < 0.25)
        dots.push(<circle key={key} cx={r1(cx)} cy={r1(cy)} r={r1(r)} fill={C.strong} />);
      else if (kind < 0.55)
        dots.push(
          <circle
            key={key}
            cx={r1(cx)}
            cy={r1(cy)}
            r={r1(r)}
            fill="none"
            stroke={C.mid}
            strokeWidth={3}
          />,
        );
      else dots.push(<circle key={key} cx={r1(cx)} cy={r1(cy)} r={r1(r * 0.7)} fill={C.soft} />);
    }
  }
  return dots;
};

/** Mind — ripples spreading from two points. */
const mind: Motif = (random) => {
  const centres = [0, 1].map(() => ({ x: random.range(50, W - 50), y: random.range(40, H - 40) }));
  return (
    <>
      {centres.map((c, i) =>
        Array.from({ length: 7 }, (_, ring) => (
          <circle
            key={`${i}-${ring}`}
            cx={r1(c.x)}
            cy={r1(c.y)}
            r={14 + ring * 17}
            fill="none"
            stroke={ring % 2 ? C.soft : C.mid}
            strokeWidth={ring < 2 ? 5 : 3}
          />
        )),
      )}
      {centres.map((c, i) => (
        <circle key={`dot-${i}`} cx={r1(c.x)} cy={r1(c.y)} r={8} fill={i ? C.deep : C.strong} />
      ))}
    </>
  );
};

/** A smooth closed blob through jittered points on a circle (Catmull-Rom → cubic Bézier). */
function blob(random: Random, cx: number, cy: number, radius: number) {
  const n = 7;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = radius * random.range(0.75, 1.15);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  });
  const at = (i: number) => pts[(i + n) % n]!;
  let d = `M${r1(at(0)[0])} ${r1(at(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r1(c1[0]!)} ${r1(c1[1]!)} ${r1(c2[0]!)} ${r1(c2[1]!)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return `${d}Z`;
}

/** Everyday Body — soft organic shapes, overlapping like pebbles. */
const everydayBody: Motif = (random) => (
  <>
    {[C.soft, C.mid, C.strong, C.deep].map((fill, i) => (
      <path
        key={i}
        d={blob(
          random,
          random.range(40, W - 40),
          random.range(40, H - 40),
          random.range(34, 62) - i * 5,
        )}
        fill={fill}
        opacity={i === 3 ? 1 : 0.9}
      />
    ))}
    {Array.from({ length: 8 }, (_, i) => (
      <circle
        key={`d${i}`}
        cx={r1(random.range(10, W - 10))}
        cy={r1(random.range(10, H - 10))}
        r={3}
        fill={C.mid}
      />
    ))}
  </>
);

/** Prevention — a grid of tiles, some checked off. */
const prevention: Motif = (random) => {
  const size = 30;
  const gap = 10;
  const cols = Math.ceil(W / (size + gap)) + 1;
  const rows = Math.ceil(H / (size + gap)) + 1;
  const offset = random.range(-size, 0);
  const tiles: React.ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offset + col * (size + gap);
      const y = offset / 2 + row * (size + gap);
      const kind = random.next();
      const fill = kind < 0.18 ? C.strong : kind < 0.26 ? C.deep : kind < 0.6 ? C.soft : C.mid;
      tiles.push(
        <rect
          key={`${row}-${col}`}
          x={r1(x)}
          y={r1(y)}
          width={size}
          height={size}
          rx={8}
          fill={fill}
          opacity={kind < 0.26 ? 1 : 0.7}
        />,
      );
    }
  }
  return tiles;
};

const motifs: Record<string, Motif> = {
  sleep,
  digestion,
  movement,
  food,
  mind,
  "everyday-body": everydayBody,
  prevention,
};

// ---------------------------------------------------------------------------

type Props = {
  /** Unique per image — a post slug, or a category slug for a category banner. */
  seed: string;
  /** Picks the motif. Unknown categories fall back to Food's seed grid. */
  category: string;
  className?: string;
  /**
   * Aspect ratio of the box; the art is cropped to fill it. "fill" sets none, so the parent's
   * layout decides the size (e.g. matching the height of text beside it).
   */
  ratio?: "16/10" | "16/9" | "4/1" | "1/1" | "fill";
};

/** Decorative: hidden from assistive tech, so the title next to it does the talking. */
export function CoverArt({ seed, category, className = "", ratio = "16/10" }: Props) {
  const motif = motifs[category] ?? food;
  const random = seededRandom(`${category}:${seed}`);

  return (
    <div
      className={`overflow-hidden bg-cover-ground ${className}`}
      style={ratio === "fill" ? undefined : { aspectRatio: ratio }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="block h-full w-full"
        focusable="false"
      >
        {motif(random)}
      </svg>
    </div>
  );
}
