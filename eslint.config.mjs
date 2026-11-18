import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The simulators keep live physics state in refs that are updated during render
    // and read inside the animation loop (DECISIONS D-007) — that keeps them at 60 fps.
    // The React Compiler rules below flag that pattern, so they are warnings, not errors.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      // getSimulatorComponent returns a stable component from a module-level map.
      'react-hooks/static-components': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
