# AGENTS.md - Frontend

This guide provides coding agents with essential information about the JLP-text-generator frontend codebase.

**Backend Documentation**: See [../AGENTS.md](../AGENTS.md) for backend-specific guidelines.

## Build/Lint/Test Commands

```bash
cd frontend

# Development mode (with hot reload)
yarn dev

# Production build
yarn build

# Run linter
yarn lint

# Run all tests
yarn test

# Run tests in UI mode
yarn test --ui

# Run tests in watch mode
yarn test --watch

# Preview production build
yarn preview
```

## Architecture & File Organization

### Feature-Based Structure

The frontend uses a **feature-based architecture** with TanStack Router:

```
src/
├── api/                    # API client functions
├── components/             # Shared/reusable components
├── routes/                 # File-based routing (TanStack Router)
│   ├── -private-module/    # Private route modules (dash prefix)
│   │   ├── Feature.service.tsx   # Custom hooks/business logic
│   │   ├── Feature.view.tsx      # Main component/view
│   │   ├── Feature.storage.ts    # Local storage persistence
│   │   ├── Feature.types.ts      # Feature-specific types
│   │   └── components/           # Feature-specific components
│   ├── __root.tsx          # Root layout
│   └── index.tsx           # Home page
├── store/                  # Global state management (Zustand)
├── types/                  # Shared TypeScript types
└── config.ts               # App configuration
```

**Private Route Modules**: Folders prefixed with `-` (e.g., `-text-generator/`) contain all feature-specific code that doesn't need to be shared across the app.

### File Naming Convention

```
[Name].[purpose].[extension]

Examples:
- TextGenerator.service.tsx    # Custom hooks/business logic
- TextGenerator.view.tsx        # Main view component
- TextGenerator.storage.ts      # Storage layer
- TextGenerator.types.ts        # TypeScript types
- Token.component.tsx           # Reusable component
- analyze.api.ts                # API client
```

**Naming Rules**:

- Components: PascalCase (e.g., `TextGenerator.view.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useGenerateText`)
- API clients: camelCase (e.g., `generator.api.ts`)
- Storage: PascalCase (e.g., `TextGenerator.storage.ts`)

## Code Style Guidelines

### Imports

- **No file extensions** in imports (Vite handles this)
- Use `type` imports for types: `import type {FC} from 'react'`
- Group imports: React → third-party → internal → styles (last)
- Use **relative paths** (no path aliases)

```typescript
// Good
import {useState, useCallback, type FC} from 'react'
import classNames from 'classnames'
import {generateEvent} from '../../../api/generator.api'
import type {Dict} from '../../../types/analyzedText.types'
import styles from './Component.module.css'

// Bad - missing type import, wrong order
import {FC, useState} from 'react'
import styles from './Component.module.css'
import classNames from 'classnames'
```

### Formatting

- **Indentation**: Tabs (not spaces)
- **Semicolons**: Required
- **Quotes**: Single quotes for strings
- **Trailing commas**: Use in multiline arrays/objects

### TypeScript Patterns

**Component Props**:

```typescript
import type {FC, ButtonHTMLAttributes} from 'react'

interface Props {
	variant?: 'primary' | 'secondary'
	onSubmit: () => void
}

export const Button: FC<Props> = ({variant = 'primary', onSubmit}) => {
	return <button onClick={onSubmit}>{/* ... */}</button>
}

// For extending native elements
interface ExtendedProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary'
}

export const ExtendedButton: FC<ExtendedProps> = (props) => {
	const {className, variant = 'primary', ...otherProps} = props
	return <button {...otherProps} className={className} />
}
```

**Discriminated Unions**:

```typescript
interface InactiveState {
	data: undefined
	error: undefined
	status: 'inactive'
}

interface SuccessState {
	data: AnalyzeData
	error: undefined
	status: 'success'
}

type State = InactiveState | SuccessState

// Type guard
export function isSuccess(state: State): state is SuccessState {
	return state.status === 'success'
}
```

**Config Pattern**:

```typescript
export const CONFIG = {
	API_URL: import.meta.env.DEV
		? import.meta.env.VITE_DEV_API
		: `${window.location.protocol}//${window.location.host}/api`
} as const
```

## React Patterns

### Custom Hooks in Service Files

Service files (`.service.ts`) export custom hooks that encapsulate business logic:

```typescript
export function useGenerateText() {
	const [paragraphs, setParagraphs] = useState<Paragraph[]>([])
	const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')

	const generateText = useCallback(() => {
		const event = generateEvent(userPrompt)

		event.onmessage = (e) => {
			const data = JSON.parse(e.data)
			setParagraphs((prev) => [...prev, data])
		}

		return () => event.close()
	}, [userPrompt])

	return {
		generateText,
		paragraphs,
		connectionState
	}
}
```

**Hook Best Practices**:

- Use `useState` for local component state
- Use `useCallback` for memoized functions
- Use `useMemo` for expensive computations
- Use `useEffect` for side effects (cache saving, cleanup)

### State Management with Zustand

**Store Pattern**:

```typescript
import {create} from 'zustand'
import {Storage} from './Feature.storage'

interface Store {
	data: SomeType
	updateData: (newData: SomeType) => void
}

const useStore = create<Store>((set) => ({
	data: Storage.getData() ?? initialValue,
	updateData: (newData) => {
		Storage.saveData(newData)
		set({data: newData})
	}
}))

export function useCustomStore() {
	return useStore((store) => store)
}
```

**Storage Integration**:

```typescript
// Feature.storage.ts
export class JsonStorage<T> {
	constructor(private key: string) {}

	getData(): T | null {
		const data = localStorage.getItem(this.key)
		return data ? JSON.parse(data) : null
	}

	saveData(data: T): void {
		localStorage.setItem(this.key, JSON.stringify(data))
	}
}

export const GeneratedTextStorage = new JsonStorage<CachedEvent>('_event_cache')
```

## Routing (TanStack Router)

### File-Based Routes

```typescript
// routes/generator/index.tsx
import {createFileRoute} from '@tanstack/react-router'
import {TextGenerator} from './-text-generator/TextGenerator.view'

export const Route = createFileRoute('/generator/')({
	component: RouteComponent
})

function RouteComponent() {
	return <TextGenerator />
}
```

**Route Structure**:

- `routes/__root.tsx` - Root layout component
- `routes/index.tsx` - Home page (`/`)
- `routes/generator/index.tsx` - Generator page (`/generator`)
- Auto-generated: `routeTree.gen.ts` (do not edit manually)

## Styling with CSS Modules

```typescript
import styles from './Button.module.css'
import classNames from 'classnames'

export const Button: FC<Props> = ({variant, className}) => {
	return (
		<button
			className={classNames(
				styles.button,
				{
					[styles.primary]: variant === 'primary',
					[styles.secondary]: variant === 'secondary'
				},
				className
			)}
		/>
	)
}
```

## Testing Guidelines

### Framework

- **Test runner**: Vitest
- **Component testing**: React Testing Library
- **User interactions**: @testing-library/user-event
- **Matchers**: @testing-library/jest-dom

### Test Structure

```typescript
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'
import {render, screen, waitFor, cleanup} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '../../../api/generator.api'

vi.mock('../../../api/generator.api')

describe('Text Generator', () => {
	beforeEach(() => {
		vi.mocked(api.generateEvent).mockReturnValue(mockEventSource)
	})

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('should render the prompt form', () => {
		render(<TextGenerator />)
		expect(screen.getByRole('textbox')).toBeInTheDocument()
	})

	it('should submit prompt on button click', async () => {
		const user = userEvent.setup()
		render(<TextGenerator />)

		await user.type(screen.getByRole('textbox'), 'Test prompt')
		await user.click(screen.getByRole('button'))

		await waitFor(() => {
			expect(api.generateEvent).toHaveBeenCalledWith('Test prompt')
		})
	})
})
```

**Testing Best Practices**:

- Use `screen.getByRole()` for queries (preferred)
- Mock entire modules at top level
- Use `vi.mocked()` for type-safe mock access
- Clean up in `afterEach`
- Test user interactions, not implementation details
- Use descriptive test names: "should [expected behavior] when [condition]"

## API Integration

**API Client Pattern**:

```typescript
// api/generator.api.ts
import {CONFIG} from '../config'

export function generateEvent(prompt: string): EventSource {
	const params = new URLSearchParams({p: prompt})
	return new EventSource(`${CONFIG.API_URL}/generate/story?${params}`)
}

export async function getAnalysis(text: string): Promise<AnalyzeRes> {
	const res = await fetch(`${CONFIG.API_URL}/analyze`, {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({text})
	})

	if (!res.ok) throw new Error('Failed to analyze text')
	return res.json()
}
```

**SSE (Server-Sent Events) Pattern**:

```typescript
const event = generateEvent(userPrompt)

event.onopen = () => setConnectionState('connected')
event.onmessage = (e) => {
	const data = JSON.parse(e.data)
	handleData(data)
}
event.onerror = (error) => {
	console.error('SSE error:', error)
	event.close()
}
```

## Key Technologies

- **React 19**: Functional components with hooks
- **TanStack Router**: File-based routing
- **Zustand**: Global state management
- **Vite**: Build tool and dev server
- **CSS Modules**: Component-scoped styling
- **Vitest**: Testing framework
- **Radix UI**: Accessible UI primitives
- **classnames**: Conditional CSS classes

## Common Patterns

**Toggle State**:

```typescript
const [show, setShow] = useState(false)
const onToggle = () => setShow((prev) => !prev)
```

**Derived State**:

```typescript
const isConnected = connectionState === 'connected'
const canSubmit = isDisconnected && !isLoading
```

**Controlled Inputs**:

```typescript
<textarea
	value={userPrompt}
	onChange={(e) => setUserPrompt(e.target.value)}
	disabled={!canSubmit}
	required
/>
```
