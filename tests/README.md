# CQG Platform E2E Tests

This directory contains end-to-end tests for the CQG Platform using Playwright.

## Setup

The tests are already configured and ready to run. Make sure you have:

1. ✅ Playwright installed (`npm install -D @playwright/test`)
2. ✅ Browsers installed (`npx playwright install`)
3. ✅ Development server running (`npm run dev`)

## Running Tests

### Headless Mode (Recommended for CI/CD)
```bash
npm run test:e2e
```

### Headed Mode (Watch tests in browser)
```bash
npm run test:e2e:headed
```

### Run specific test file
```bash
npx playwright test navigation.test.ts
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

## Test Files

### `navigation.test.ts`
Tests the main navigation flow:
- Players page loads correctly
- Clicking players navigates to profiles
- Profile pages display correctly
- Tournament navigation works
- Player links within tournaments work

## Configuration

The tests are configured in `playwright.config.ts` at the project root:
- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Auto-start**: Development server starts automatically before tests

## Writing New Tests

1. Create a new `.test.ts` file in the `/tests` directory
2. Import `{ test, expect }` from `@playwright/test`
3. Use `test.describe()` to group related tests
4. Use `test()` for individual test cases

Example:
```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

## Tips

- Use `console.log()` for debugging output
- Use `page.waitForLoadState('networkidle')` to wait for page loads
- Use `page.locator()` to find elements
- Use `expect()` for assertions
- Tests run in parallel by default for speed

## Troubleshooting

- **Tests fail with connection errors**: Make sure your dev server is running on port 3000
- **Elements not found**: Check if the page has loaded completely with `waitForLoadState`
- **Tests are flaky**: Add proper waits and use more specific selectors


