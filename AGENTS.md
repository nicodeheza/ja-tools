# AGENTS.md - Backend

This guide provides coding agents with essential information about the JLP-text-generator backend codebase.

**Frontend Documentation**: See [frontend/AGENTS.md](./frontend/AGENTS.md) for frontend-specific guidelines.

## Project Overview

A Japanese text generator with AI-powered content creation, furigana annotation, and dictionary integration for educational purposes. Built with Node.js, Express, TypeScript, and React.

The scope of this project is going to grow, we will add more features and is going to be a collection of tools for learning Japanese. Also, the project is going to be renamed to something like ja-tools.

## Build/Lint/Test Commands

```bash
# Development mode (watch mode)
yarn dev

# Production build and start
yarn start

# Build TypeScript
tsc

# Run all tests
yarn test

# Run tests for a specific file
yarn test src/generator/routes.generator.test.ts

# Run tests in watch mode
yarn test --watch

# Dictionary setup (one-time)
yarn push:dict
yarn setup
```

## Architecture & File Organization

### Module Structure

The codebase follows a **domain-based modular architecture**:

- `src/analyzer/` - Text analysis and tokenization
- `src/generator/` - AI text generation
- `src/dict/` - Dictionary database and queries
- `src/infrastructure/` - External service integrations (AI, tokenizer)

### File Naming Convention

Files use **suffix-based naming** to indicate their module:

```
[name].[domain].[type].ts

Examples:
- service.analyzer.ts
- routes.generator.ts
- types.dict.ts
- db.dict.ts
- index.analyzer.ts
```

### Folder Structure per Module

```
module-name/
├── infrastructure/      # External dependencies/adapters
├── db/                  # Database schemas and queries (if applicable)
├── service.[module].ts  # Business logic
├── routes.[module].ts   # Express routes
├── handlers.[module].ts # Route handlers
├── types.[module].ts    # TypeScript types
├── utils.[module].ts    # Helper functions
└── index.[module].ts    # Public API exports
```

## TypeScript Configuration

### Compiler Settings

- **Target**: ES2020
- **Module**: NodeNext (ESM)
- **Strict mode**: Enabled
- **No implicit any**: Enforced
- Root: `./src`, Output: `./dist`

### Type Safety

- All functions and variables must have explicit types
- Use TypeScript discriminated unions for complex types
- Prefer `interface` for objects, `type` for unions/intersections
- Use `as const` for constant objects

## Code Style Guidelines

### Imports

- **Always use `.js` extensions** in imports (TypeScript ESM requirement)
- Group imports by: external packages → internal modules → types
- Use named exports, avoid default exports except for routes/routers

```typescript
// Good
import express from 'express'
import {analyzeText} from './infrastructure/analyzer.generator.js'
import {AnalyzedStoryChunk} from './types.generator.js'

// Bad - missing .js extension
import {analyzeText} from './infrastructure/analyzer.generator'
```

### Formatting

- **Indentation**: Tabs (not spaces)
- **Line length**: Keep reasonable, break long lines
- **Semicolons**: Required
- **Quotes**: Single quotes for strings
- **Trailing commas**: Use in multiline arrays/objects

### Naming Conventions

- **Variables/Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE (for config values)
- **Files**: [name].[module].[type].ts
- **Async functions**: Use descriptive names, suffix with specific action

```typescript
// Good
export const CONFIG = {
	PORT: process.env.PORT,
	IS_PROD: process.env.NODE_ENV === 'production'
} as const

async function analyzeText(text: string): Promise<AnalyzeRes> {
	// ...
}

type Token = {original: string; isWord: boolean}
```

### Functions

- Prefer `async/await` over promises
- Use async generators for streaming: `async function*`
- Keep functions small and focused (single responsibility)
- Place helper functions below main function or in utils file

### Error Handling

- Use try-catch blocks for async operations
- Log errors with `console.error()`
- Gracefully handle external service failures
- Clean up resources (e.g., database connections) in finally blocks or exit handlers

```typescript
// Example from index.ts
function onExit() {
	const signals = ['SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM']
	signals.forEach((signal) => {
		process.on(signal, () => {
			try {
				DictDb.close()
			} catch (e) {
				console.error(e)
			} finally {
				process.exit()
			}
		})
	})
}
```

## Testing Guidelines

### Framework

- **Test runner**: Vitest
- **HTTP testing**: Supertest
- **Setup file**: `src/vitest.setup.ts`

### Test Structure

- Place tests next to source files: `[name].[module].test.ts`
- Use `describe` for grouping, nested describes for endpoints/methods
- Mock external dependencies with `vi.mock()`
- Use descriptive test names: "should [expected behavior] when [condition]"

```typescript
import {describe, expect, it, vi} from 'vitest'
import * as aiModule from '../infrastructure/Ai/index.ai.js'

vi.mock('../infrastructure/Ai/index.ai.js')

describe('Generator Routes', () => {
	describe('GET /story', () => {
		it('should stream analyzed AI generated text via SSE', async () => {
			// Arrange
			vi.mocked(aiModule.aiStreamResponse).mockImplementation(...)

			// Act
			const response = await request(app).get('/story')

			// Assert
			expect(response.status).toEqual(200)
		})
	})
})
```

### Mocking Patterns

- Mock entire modules at the top level
- Use `vi.mocked()` for type-safe mocks
- Mock async generators with `async function*`
- Reset mocks between tests if needed

## Key Technologies & Patterns

### AI Integration

- Google Gemini via `@google/genai`
- Streaming responses for real-time generation
- System instructions for prompt engineering

### Japanese Text Processing

- **MeCab**: Tokenization (requires system installation)
- **Furigana**: Automatic reading annotations
- **Wanakana**: Kana/romaji conversion

### Database

- **better-sqlite3**: Synchronous SQLite for JMDict
- **Drizzle ORM**: Type-safe queries
- Dictionary queries by kanji/kana + POS

### Express Patterns

- Router-based modular routing
- Separate handlers from routes
- SSE (Server-Sent Events) for streaming
- CORS enabled in development only

## Environment Variables

Required in `.env` file:

```
GEMINI_API_KEY=<your_api_key>
NODE_ENV=production  # Optional, defaults to development
PORT=4000           # Optional
```

## Git Commit Style

Based on recent commits, use concise present-tense messages:

- `refactor [module]` - Code restructuring
- `add [feature]` - New functionality
- `fix [issue]` - Bug fixes
- `update [component]` - Enhancements

Example: `refactor analyzer`, `add /story test`, `fix dict query and map`
