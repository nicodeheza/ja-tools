---
name: vitest
description: Best practices for using the vitest testing library in this project
---

## When to use me

When you are working with test using vitest. Only use this skill in files that ends with `.test.ts` or `test.tsx`.

## Mocks

Use this mock pattern when is possible:

```typescript
import * as generatorApi from '../../../api/generator.api'

vi.mock('../../../api/generator.api')

describe('Some Describe', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})
	it('should do something', async () => {
		vi.mocked(generatorApi.generateEvent).mockReturnValue({
			foo: 'bar'
		})
	})
})
```

## Type-checking test files

Vitest transpiles tests with esbuild and does not type-check them. Also, `api/tsconfig.json` excludes `**/*.test.ts`, so `pnpm check` will not catch TypeScript errors in API test files. (Frontend test files ARE type-checked by `tsc -b`.)

After writing or editing an API test file, verify it type-checks:

```bash
pnpm --filter api exec tsc --noEmit --strict --module nodenext --moduleResolution nodenext --target es2020 --skipLibCheck --esModuleInterop src/<path>/<your-test-file>.test.ts
```

Replace `src/<path>/<your-test-file>.test.ts` with the test file you changed. Passing an explicit file to `tsc` bypasses the tsconfig `paths` mapping, so test files that import `@ja-tools/share-types` through the alias may report spurious "cannot find module" errors; files using only relative imports are checked accurately.
