/**
 * 테스트케이스 큐 임포터
 *
 * Usage: npm run import-testcases
 *
 * data/testcases-queue.json을 watch하면서
 * 새 테스트케이스가 추가되면 자동으로 DB에 저장
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const QUEUE_PATH = path.join(__dirname, '../data/testcases-queue.json');
const WATCH_INTERVAL = 5000; // 5초마다 체크

interface TestCase {
  input: string;
  output: string;
}

interface QueueItem {
  description?: string;
  testCases: TestCase[];
}

interface Queue {
  [problemId: string]: QueueItem;
}

function readQueue(): Queue {
  try {
    const content = fs.readFileSync(QUEUE_PATH, 'utf-8');
    return JSON.parse(content) || {};
  } catch {
    return {};
  }
}

function writeQueue(queue: Queue): void {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

async function processQueue(): Promise<number> {
  const queue = readQueue();
  const problemIds = Object.keys(queue);

  if (problemIds.length === 0) {
    return 0;
  }

  console.log(`\n📥 Processing ${problemIds.length} problem(s)...`);

  let processed = 0;

  for (const problemId of problemIds) {
    const item = queue[problemId];

    try {
      // DB 업데이트
      const updateData: any = {
        testCases: JSON.stringify(item.testCases),
      };

      if (item.description) {
        updateData.description = item.description;
      }

      await prisma.problem.update({
        where: { id: problemId },
        data: updateData,
      });

      console.log(`   ✅ #${problemId}: ${item.testCases.length} test cases`);

      // 성공하면 큐에서 제거
      delete queue[problemId];
      writeQueue(queue);

      processed++;
    } catch (error: any) {
      console.error(`   ❌ #${problemId}: ${error.message}`);
    }
  }

  return processed;
}

async function watch() {
  console.log('🔄 Test case importer started');
  console.log(`   Watching: ${QUEUE_PATH}`);
  console.log(`   Interval: ${WATCH_INTERVAL / 1000}s`);
  console.log('   Press Ctrl+C to stop\n');

  // 초기 처리
  await processQueue();

  // Watch 루프
  let lastSize = fs.existsSync(QUEUE_PATH) ? fs.statSync(QUEUE_PATH).size : 0;

  while (true) {
    await new Promise(resolve => setTimeout(resolve, WATCH_INTERVAL));

    // 파일 변경 체크
    if (fs.existsSync(QUEUE_PATH)) {
      const currentSize = fs.statSync(QUEUE_PATH).size;

      if (currentSize !== lastSize && currentSize > 2) { // {} = 2 bytes
        const count = await processQueue();
        if (count > 0) {
          console.log(`   📊 Total processed: ${count}`);
        }
        lastSize = fs.existsSync(QUEUE_PATH) ? fs.statSync(QUEUE_PATH).size : 0;
      }
    }
  }
}

// 한 번만 실행 모드
async function once() {
  const count = await processQueue();
  console.log(`\n✅ Processed ${count} problem(s)`);
}

// Main
const mode = process.argv[2];

if (mode === 'watch') {
  watch().catch(console.error);
} else {
  once()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
