import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    ...nextVitals,
    ...nextTypeScript,
    globalIgnores([
        ".next/**",
        "coverage/**",
        "playwright-report/**",
        "test-results/**",
        "supabase/.temp/**",
        // Untitled UI components are vendored from the official CLI and are
        // validated by typecheck/build. Application linting focuses on ATQ code.
        "src/components/application/**",
        "src/components/base/**",
        "src/components/foundations/**",
        "src/components/shared-assets/**",
        "src/hooks/**",
        "src/utils/countries.tsx",
    ]),
]);
