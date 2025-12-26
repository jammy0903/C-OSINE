/**
 * 환경변수 설정 (Zod 스키마 기반)
 * 모든 환경변수를 중앙에서 타입 안전하게 관리
 */

import { z } from 'zod';

const envSchema = z.object({
  // === API ===
  VITE_API_URL: z.string().default('http://localhost:3000'),

  // === Firebase ===
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),

  // === Ollama AI ===
  VITE_OLLAMA_URL: z.string().default('http://localhost:11434'),
  VITE_OLLAMA_MODEL: z.string().default('qwen2.5-coder:7b'),
  VITE_OLLAMA_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  VITE_OLLAMA_NUM_PREDICT: z.coerce.number().positive().default(1024),

  // === Timeouts (seconds) ===
  VITE_C_RUN_TIMEOUT: z.coerce.number().positive().default(10),
  VITE_C_JUDGE_TIMEOUT: z.coerce.number().positive().default(5),
  VITE_TRACER_TIMEOUT: z.coerce.number().positive().default(10),

  // === UI ===
  VITE_PROBLEMS_PER_PAGE: z.coerce.number().positive().default(30),
});

// Vite 환경변수 파싱 (import.meta.env 사용)
function getEnv() {
  return envSchema.parse({
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    VITE_OLLAMA_URL: import.meta.env.VITE_OLLAMA_URL,
    VITE_OLLAMA_MODEL: import.meta.env.VITE_OLLAMA_MODEL,
    VITE_OLLAMA_TEMPERATURE: import.meta.env.VITE_OLLAMA_TEMPERATURE,
    VITE_OLLAMA_NUM_PREDICT: import.meta.env.VITE_OLLAMA_NUM_PREDICT,
    VITE_C_RUN_TIMEOUT: import.meta.env.VITE_C_RUN_TIMEOUT,
    VITE_C_JUDGE_TIMEOUT: import.meta.env.VITE_C_JUDGE_TIMEOUT,
    VITE_TRACER_TIMEOUT: import.meta.env.VITE_TRACER_TIMEOUT,
    VITE_PROBLEMS_PER_PAGE: import.meta.env.VITE_PROBLEMS_PER_PAGE,
  });
}

export const env = getEnv();

// 타입 export
export type Env = z.infer<typeof envSchema>;
