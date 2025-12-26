/**
 * MSW Server Setup
 * Vitest 환경용 서버 설정
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// MSW 서버 생성
export const server = setupServer(...handlers);
