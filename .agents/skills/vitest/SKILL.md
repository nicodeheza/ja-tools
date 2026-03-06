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
