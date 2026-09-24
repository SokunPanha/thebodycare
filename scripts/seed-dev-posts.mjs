// LOCAL ONLY. Loads sample published articles so the public site has something to render in dev.
// Refuses to run against anything but the local Supabase stack.
//
//   pnpm db:seed:dev          4 sample articles (+ a sample reviewer)
//   pnpm db:seed:dev --bulk   …plus 24 short filler posts in Sleep, to exercise pagination
//
// Re-runnable: deletes its own previous rows (slugs prefixed "sample-") first.

import { execSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

const status = JSON.parse(
  (() => {
    const out = execSync("pnpm exec supabase status -o json", {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    return out.slice(out.indexOf("{"));
  })(),
);
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(status.API_URL)) {
  throw new Error(`Refusing to seed sample posts into ${status.API_URL}`);
}

const db = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// ---------------------------------------------------------------------------
// Sample reviewer
// ---------------------------------------------------------------------------
const REVIEWER_EMAIL = "sample-reviewer@example.test";
const users = must(await db.auth.admin.listUsers());
let reviewer = users.users.find((user) => user.email === REVIEWER_EMAIL);
if (!reviewer) {
  reviewer = must(
    await db.auth.admin.createUser({
      email: REVIEWER_EMAIL,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { display_name: "Sample Reviewer" },
    }),
  ).user;
}
must(
  await db
    .from("profiles")
    .update({ role: "editor", display_name: "Sample Reviewer", credentials: "Dev fixture" })
    .eq("id", reviewer.id),
);

// ---------------------------------------------------------------------------
// Articles — in scope per docs/EDITORIAL.md: no medications, doses, diagnoses or cure claims.
// ---------------------------------------------------------------------------
const days = (n) => new Date(Date.now() - n * 86_400_000).toISOString();

const articles = [
  {
    slug: "sample-why-you-wake-at-3am",
    category: "sleep",
    title: "Why you keep waking at 3am, and when it's worth checking",
    excerpt:
      "Waking in the small hours is common and usually harmless. Here's what tends to cause it, what helps, and the signs that mean it's worth a conversation.",
    key_points: [
      "Brief waking during the night is a normal part of sleep cycles — most people don't remember it.",
      "Stress, alcohol, a warm room and needing the toilet are common reasons the waking becomes noticeable.",
      "A steady wake time and a cool, dark room help more than trying harder to fall back asleep.",
      "If it happens most nights for three months or more and affects your days, it's worth raising.",
    ],
    source: "ai_reviewed",
    reviewed: true,
    published_at: days(1),
    reading_time_min: 5,
    body_md: `## What's happening when you wake

Sleep runs in cycles of roughly 90 minutes. Towards the end of each one, sleep becomes lighter, and brief awakenings are normal. Later in the night, cycles contain more light sleep, so you're more likely to surface — and more likely to notice.

Waking isn't the problem on its own. It becomes one when you can't drift back off.

## Common reasons it becomes noticeable

- **Stress and a busy mind.** Worry tends to arrive when there's nothing else to focus on.
- **Alcohol.** It can make you sleepy at first but often makes the second half of the night lighter and more broken.
- **A warm or noisy room.** Small disturbances wake you more easily in light sleep.
- **Needing the toilet.** Large drinks late in the evening make this more likely.

## What tends to help

| Habit | Why it helps |
|---|---|
| Same wake time every day | Anchors your body clock, even after a poor night |
| Cool, dark, quiet room | Fewer small disturbances during light sleep |
| Get up if you're awake for a while | Stops bed becoming a place for worrying |
| Keep the clock out of sight | Clock-watching adds pressure |

> If you do wake, try not to check the time. Knowing it's 3:12am rarely helps you sleep.

## A note on shift work and new parents

If your sleep is broken by shifts or a baby, the rules above still help, but expect progress rather than perfection. Protecting one longer block of sleep matters more than a perfect routine.`,
    when_to_seek_care: `Talk to a GP or other health professional if:

- you've had trouble sleeping on **most nights for three months or more**
- poor sleep is affecting your work, mood, or ability to drive safely
- someone has noticed you **stop breathing, choke or gasp** during sleep, or you snore loudly
- you wake with a racing heart, chest pain, or breathlessness

If you feel you can't cope or have thoughts of harming yourself, contact a crisis service or emergency services now.`,
    faq: [
      {
        question: "Is waking at the same time every night a sign of something?",
        answer:
          "Usually it reflects your sleep cycles and habits rather than a specific cause. If it's regular and affecting your days, it's worth mentioning to a health professional.",
      },
      {
        question: "Should I stay in bed and try to fall back asleep?",
        answer:
          "If you've been awake for a while and feel alert or frustrated, getting up to do something quiet in dim light until you feel sleepy often works better.",
      },
    ],
    sources: [
      ["https://www.nhs.uk/conditions/insomnia/", "Insomnia", "NHS"],
      ["https://www.cdc.gov/sleep/about/index.html", "About Sleep", "CDC"],
      [
        "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/how-to-fall-asleep-faster-and-sleep-better/",
        "How to fall asleep faster and sleep better",
        "NHS Every Mind Matters",
      ],
    ],
    axis: 0,
  },
  {
    slug: "sample-sleep-after-night-shift",
    category: "sleep",
    title: "How to sleep after a night shift: a practical checklist",
    excerpt:
      "Sleeping in daylight works against your body clock. These habits make it easier to get a proper block of rest between shifts.",
    key_points: [
      "Your body clock expects sleep at night, so daytime sleep is lighter and shorter.",
      "Blocking light, noise and interruptions matters more than any single trick.",
      "Wear sunglasses on the way home and keep the bedroom as dark as you can.",
      "Persistent sleepiness at work or while driving is a safety issue worth raising.",
    ],
    source: "ai",
    published_at: days(3),
    reading_time_min: 4,
    body_md: `## Why daytime sleep is harder

Light is the strongest signal your body clock uses. Coming home in daylight tells your brain it's time to be awake, just as you need to sleep.

## The checklist

1. **Dim the journey home.** Sunglasses help, especially in summer.
2. **Make the room dark.** Blackout blinds or an eye mask.
3. **Cut the noise.** Earplugs, white noise, and a "sleeping" sign on the door.
4. **Keep a routine.** Go to bed at a similar time after each shift.
5. **Eat lightly before bed.** A heavy meal can make it harder to settle.

## On your days off

Try not to swing fully back to a daytime pattern on a single day off. A partial shift — sleeping a little later than usual — is often easier on your body.`,
    when_to_seek_care: `Speak to a GP or your occupational health service if:

- you feel **dangerously sleepy while driving** or at work
- you can't get enough sleep between shifts for several weeks
- your mood, appetite or health is changing noticeably`,
    faq: [],
    sources: [
      [
        "https://www.hse.gov.uk/humanfactors/topics/shift-workers.htm",
        "Advice for shift workers",
        "HSE",
      ],
      [
        "https://www.cdc.gov/niosh/work-hour-training-for-nurses/",
        "Work schedules: shift work and long work hours",
        "CDC / NIOSH",
      ],
      ["https://www.nhs.uk/conditions/insomnia/", "Insomnia", "NHS"],
    ],
    axis: 0,
    blend: 0.35,
  },
  {
    slug: "sample-bloating-after-meals",
    category: "digestion",
    title: "Is bloating after meals normal?",
    excerpt:
      "Feeling a bit bloated after eating is very common. Here's what usually causes it, what helps, and when it's time to get it checked.",
    key_points: [
      "Some bloating after a meal is a normal part of digestion.",
      "Eating quickly, fizzy drinks and some high-fibre foods are common triggers.",
      "Slowing down and noticing patterns in a simple food diary often helps.",
      "Bloating that lasts for weeks, or comes with weight loss or bleeding, should be checked.",
    ],
    source: "ai",
    published_at: days(5),
    reading_time_min: 4,
    body_md: `## What bloating is

Bloating is a feeling of fullness or swelling in your tummy. It usually comes from gas made as gut bacteria break down food, or from air swallowed while eating.

## Common triggers

- Eating quickly or talking while eating
- Fizzy drinks
- Some foods, such as beans, onions and certain vegetables, which produce more gas
- Big meals late in the day

## What tends to help

Eat more slowly, have smaller meals, and keep a short food and symptom diary for a couple of weeks. Patterns are often easier to see written down than remembered.`,
    when_to_seek_care: `See a GP if bloating:

- lasts **three weeks or more**, or keeps coming back
- comes with **unexplained weight loss**, blood in your poo, or a lump in your tummy
- comes with changes to your bowel habits that last several weeks

Get urgent help if you have severe tummy pain, or you're being sick and can't keep fluids down.`,
    faq: [],
    sources: [
      ["https://www.nhs.uk/conditions/bloating/", "Bloating", "NHS"],
      [
        "https://www.nhs.uk/live-well/eat-well/digestive-health/good-foods-to-help-your-digestion/",
        "Good foods to help your digestion",
        "NHS",
      ],
      [
        "https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract",
        "Gas in the digestive tract",
        "NIDDK",
      ],
    ],
    axis: 1,
  },
  {
    slug: "sample-desk-neck",
    category: "movement",
    title: "Why your neck aches after a day at the screen",
    excerpt:
      "Neck stiffness after desk work is common, and usually eases with small changes to your setup and how often you move.",
    key_points: [
      "Holding one position for hours is a bigger factor than having 'perfect' posture.",
      "Screen at eye level and an arm's length away reduces strain.",
      "Short movement breaks every 30–60 minutes help more than one long stretch.",
      "Neck pain with numbness, weakness or after an injury should be checked.",
    ],
    source: "human",
    published_at: days(8),
    reading_time_min: 3,
    body_md: `## It's more about stillness than posture

There's no single correct way to sit. Most desk neck ache comes from staying in one position for a long time, whatever that position is.

## Quick setup checks

- Top of the screen roughly at eye level
- Screen about an arm's length away
- Laptop raised, with a separate keyboard, if you use one for long periods
- Feet flat and shoulders relaxed

## Move little and often

Stand up, roll your shoulders, and look into the distance every 30 to 60 minutes. Gentle movement usually does more than a single long stretch at the end of the day.`,
    when_to_seek_care: `See a GP or physiotherapist if:

- the pain hasn't started to improve after **a few weeks**
- you have **numbness, pins and needles, or weakness** in your arms or hands
- it started after a fall or accident

Get urgent help if neck pain comes with a high temperature and feeling very unwell, or after a significant injury.`,
    faq: [],
    sources: [
      ["https://www.nhs.uk/conditions/neck-pain/", "Neck pain", "NHS"],
      ["https://www.hse.gov.uk/msd/dse/", "Working safely with display screen equipment", "HSE"],
      ["https://www.nhs.uk/live-well/exercise/", "Exercise", "NHS"],
    ],
    axis: 2,
  },
];

// ---------------------------------------------------------------------------
const categories = must(await db.from("categories").select("id, slug"));
const categoryId = (slug) => categories.find((category) => category.slug === slug).id;

must(await db.from("posts").delete().like("slug", "sample-%"));

// Controllable 768-dim vectors: same axis = related. Real embeddings arrive with M4.
const vector = (axis, blend = 0) => {
  const v = new Array(768).fill(0);
  v[axis] = 1 - blend;
  v[axis + 10] = blend;
  return `[${v.join(",")}]`;
};

for (const article of articles) {
  const { sources, category, axis, blend, reviewed, ...fields } = article;
  const post = must(
    await db
      .from("posts")
      .insert({
        ...fields,
        category_id: categoryId(category),
        status: "published",
        reviewer_id: reviewed ? reviewer.id : null,
        reviewed_at: reviewed ? fields.published_at : null,
      })
      .select("id")
      .single(),
  );
  must(
    await db.from("post_sources").insert(
      sources.map(([url, title, publisher], i) => ({
        post_id: post.id,
        url,
        title,
        publisher,
        sort_order: i,
      })),
    ),
  );
  must(
    await db.from("post_embeddings").insert({
      post_id: post.id,
      embedding: vector(axis, blend),
      content_hash: "sample",
      model: "sample",
    }),
  );
}

let filler = 0;
if (process.argv.includes("--bulk")) {
  // Spread across categories so grids show every motif; Sleep keeps enough to paginate.
  const spread = ["sleep", "digestion", "movement", "food", "mind", "everyday-body", "prevention"];
  const rows = Array.from({ length: 24 }, (_, i) => {
    const category = i < 14 ? spread[i % spread.length] : "sleep";
    return {
      slug: `sample-filler-${i + 1}`,
      title: `Sample ${category.replace("-", " ")} note ${i + 1}`,
      excerpt: "Filler post for exercising layouts and pagination in local development.",
      key_points: ["One", "Two", "Three"],
      body_md: "Filler.",
      when_to_seek_care: "Filler.",
      category_id: categoryId(category),
      status: "published",
      source: "ai",
      published_at: days(10 + i),
    };
  });
  filler = must(await db.from("posts").insert(rows).select("id")).length;
}

console.log(
  `Seeded ${articles.length} sample articles${filler ? ` + ${filler} filler posts` : ""} into ${status.API_URL}.`,
);
