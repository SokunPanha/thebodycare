import { readdirSync } from "node:fs";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// The non-negotiables in CLAUDE.md are enforced here, not by memory. (STRUCTURE.md §3)

const features = readdirSync("./src/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// Rule 2 — features are imported through index.ts only.
const deepFeatureImport = {
  regex: "^@/features/[^/]+/.+",
  message:
    'Import a feature through its index: "@/features/<name>". Deep paths break the feature\'s public surface (rule 2).',
};

// Rule 3 — DB access lives in features/*/queries.ts and actions.ts.
const supabaseImport = {
  regex: "^(@supabase/|@/lib/supabase/(server|browser|admin)$)",
  message:
    "Supabase clients are used only in features/*/queries.ts and actions.ts (rule 3). Add a query there instead.",
};

// Rule 4 — the service-role client is used only from app/api/** and server actions.
const adminClientImport = {
  regex: "^@/lib/supabase/admin$",
  message:
    "The service-role client bypasses RLS. Only app/api/** and actions.ts may import it (rule 4).",
};

const restrictedImports = (...patterns) => [
  "error",
  { patterns: [deepFeatureImport, ...patterns] },
];

// Rule 6 — no raw colours in components. Tokens only.
const hexColour = "/#[0-9a-fA-F]{3}([0-9a-fA-F]{3}([0-9a-fA-F]{2})?)?\\b/";
const noRawColour = [
  "error",
  {
    selector: `Literal[value=${hexColour}], TemplateElement[value.raw=${hexColour}]`,
    message: "Raw colour value. Use a token from src/styles/tokens.css (rule 6).",
  },
];

// Rule 4 — SUPABASE_SERVICE_ROLE_KEY has exactly one reader.
const noServiceRoleKey = {
  selector: "MemberExpression[property.name='SUPABASE_SERVICE_ROLE_KEY']",
  message: "Only src/lib/supabase/admin.ts may read SUPABASE_SERVICE_ROLE_KEY (rule 4).",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/lib/supabase/database.types.ts",
  ]),

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictedImports(supabaseImport, adminClientImport),
      "no-restricted-syntax": ["error", noServiceRoleKey],
    },
  },
  {
    files: ["src/**/*.tsx"],
    rules: { "no-restricted-syntax": ["error", noServiceRoleKey, noRawColour[1]] },
  },

  // Where a Supabase client is allowed.
  {
    files: ["src/lib/supabase/**", "src/proxy.ts"],
    rules: { "no-restricted-imports": restrictedImports(adminClientImport) },
  },
  {
    files: ["src/features/*/queries.ts"],
    rules: { "no-restricted-imports": restrictedImports(adminClientImport) },
  },
  {
    files: ["src/features/*/actions.ts", "src/app/api/**"],
    rules: { "no-restricted-imports": restrictedImports() },
  },
  {
    files: ["src/lib/supabase/admin.ts", "src/env.ts"],
    rules: { "no-restricted-syntax": "off" },
  },

  // Rule 2, relative-path half: a feature may not reach into another feature's internals.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: features.map((feature) => ({
            target: `./src/features/${feature}`,
            from: "./src/features",
            except: [
              `./${feature}`,
              ...features
                .filter((other) => other !== feature)
                .map((other) => `./${other}/index.ts`),
            ],
            message: "Cross-feature imports go through the other feature's index.ts (rule 2).",
          })),
        },
      ],
    },
  },
]);

export default eslintConfig;
