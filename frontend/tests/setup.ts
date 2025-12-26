/**
 * Vitest Global Setup
 * - @testing-library/jest-dom matchers
 * - MSW server setup
 * - Cleanup utilities
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

// MSW Server 시작
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// 각 테스트 후 정리
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// 모든 테스트 후 서버 종료
afterAll(() => {
  server.close();
});

// Framer Motion 애니메이션 비활성화 (테스트용)
// @ts-expect-error - global mock
window.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
