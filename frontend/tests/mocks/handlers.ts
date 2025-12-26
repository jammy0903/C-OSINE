/**
 * MSW Request Handlers
 * API 모킹 핸들러
 */

import { http, HttpResponse } from 'msw';

// API 베이스 URL
const API_BASE = 'http://localhost:3001';

// 샘플 메모리 분석 응답
const sampleTraceResponse = {
  steps: [
    {
      rip: '0x401130',
      rsp: '0x7fffffffe3d0',
      rbp: '0x7fffffffe3e0',
      line: 4,
      code: 'int x = 5;',
      stack: [
        {
          name: 'x',
          type: 'int',
          value: '5',
          address: '0x7fffffffe3dc',
          size: 4,
        },
      ],
      heap: [],
    },
    {
      rip: '0x401138',
      rsp: '0x7fffffffe3d0',
      rbp: '0x7fffffffe3e0',
      line: 5,
      code: 'int y = 10;',
      stack: [
        {
          name: 'x',
          type: 'int',
          value: '5',
          address: '0x7fffffffe3dc',
          size: 4,
        },
        {
          name: 'y',
          type: 'int',
          value: '10',
          address: '0x7fffffffe3d8',
          size: 4,
        },
      ],
      heap: [],
    },
    {
      rip: '0x401140',
      rsp: '0x7fffffffe3d0',
      rbp: '0x7fffffffe3e0',
      line: 6,
      code: 'int *p = &x;',
      stack: [
        {
          name: 'x',
          type: 'int',
          value: '5',
          address: '0x7fffffffe3dc',
          size: 4,
        },
        {
          name: 'y',
          type: 'int',
          value: '10',
          address: '0x7fffffffe3d8',
          size: 4,
        },
        {
          name: 'p',
          type: 'int*',
          value: '0x7fffffffe3dc',
          address: '0x7fffffffe3d0',
          size: 8,
          points_to: '0x7fffffffe3dc',
        },
      ],
      heap: [],
    },
  ],
};

export const handlers = [
  // POST /api/trace - 메모리 분석 API
  http.post(`${API_BASE}/api/trace`, async () => {
    // 약간의 지연 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 100));

    return HttpResponse.json(sampleTraceResponse);
  }),

  // POST /api/trace - 컴파일 에러 케이스
  http.post(`${API_BASE}/api/trace/error`, async () => {
    return HttpResponse.json(
      {
        error: 'Compilation failed',
        message: "error: expected ';' before 'return'",
      },
      { status: 400 }
    );
  }),

  // GET /api/health - 헬스체크
  http.get(`${API_BASE}/api/health`, () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
