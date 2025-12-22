/**
 * 데이터 백업 스크립트
 *
 * Usage: npx ts-node scripts/backup.ts
 *
 * 백업 대상:
 * 1. SQLite DB 파일 복사
 * 2. Problems + TestCases → JSON 내보내기
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const BACKUP_DIR = path.join(__dirname, '../../backups');
const DB_PATH = path.join(__dirname, '../prisma/dev.db');

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, ''); // 20251222
}

async function backupDatabase() {
  console.log('📦 Starting backup...\n');

  // 백업 디렉토리 생성
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = getTimestamp();

  // 1. SQLite DB 파일 복사
  console.log('1️⃣ Copying SQLite database...');
  const dbBackupPath = path.join(BACKUP_DIR, `dev_${timestamp}.db`);

  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, dbBackupPath);
    const size = (fs.statSync(dbBackupPath).size / 1024 / 1024).toFixed(2);
    console.log(`   ✅ Saved: ${dbBackupPath} (${size} MB)\n`);
  } else {
    console.log('   ⚠️ Database file not found\n');
  }

  // 2. Problems + TestCases JSON 내보내기
  console.log('2️⃣ Exporting problems to JSON...');

  const problems = await prisma.problem.findMany({
    orderBy: { number: 'asc' },
  });

  const exportData = {
    exportedAt: new Date().toISOString(),
    totalProblems: problems.length,
    problemsWithTestCases: problems.filter(p => p.testCases !== '[]').length,
    problems: problems.map(p => ({
      id: p.id,
      number: p.number,
      title: p.title,
      description: p.description,
      difficulty: p.difficulty,
      tags: JSON.parse(p.tags),
      source: p.source,
      solution: p.solution,
      testCases: JSON.parse(p.testCases),
    })),
  };

  const jsonBackupPath = path.join(BACKUP_DIR, `problems_${timestamp}.json`);
  fs.writeFileSync(jsonBackupPath, JSON.stringify(exportData, null, 2));

  const jsonSize = (fs.statSync(jsonBackupPath).size / 1024).toFixed(1);
  console.log(`   ✅ Saved: ${jsonBackupPath} (${jsonSize} KB)`);
  console.log(`   📊 ${exportData.totalProblems} problems, ${exportData.problemsWithTestCases} with test cases\n`);

  // 3. Users & Submissions 백업
  console.log('3️⃣ Exporting users & submissions...');

  const users = await prisma.user.findMany();
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const userData = {
    exportedAt: new Date().toISOString(),
    users,
    submissions,
  };

  const usersBackupPath = path.join(BACKUP_DIR, `users_${timestamp}.json`);
  fs.writeFileSync(usersBackupPath, JSON.stringify(userData, null, 2));
  console.log(`   ✅ Saved: ${usersBackupPath}`);
  console.log(`   📊 ${users.length} users, ${submissions.length} submissions\n`);

  // 4. 오래된 백업 정리 (7일 이상)
  console.log('4️⃣ Cleaning old backups (>7 days)...');
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  let deleted = 0;
  for (const file of files) {
    const filePath = path.join(BACKUP_DIR, file);
    const stat = fs.statSync(filePath);
    if (now - stat.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  }
  console.log(`   🗑️ Deleted ${deleted} old backup(s)\n`);

  console.log('✅ Backup complete!');
}

// 복원 함수
async function restoreFromJson(jsonPath: string) {
  console.log(`🔄 Restoring from ${jsonPath}...\n`);

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  for (const problem of data.problems) {
    await prisma.problem.upsert({
      where: { id: problem.id },
      update: {
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        tags: JSON.stringify(problem.tags),
        source: problem.source,
        solution: problem.solution,
        testCases: JSON.stringify(problem.testCases),
      },
      create: {
        id: problem.id,
        number: problem.number,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        tags: JSON.stringify(problem.tags),
        source: problem.source,
        solution: problem.solution,
        testCases: JSON.stringify(problem.testCases),
      },
    });
  }

  console.log(`✅ Restored ${data.problems.length} problems`);
}

// Main
const command = process.argv[2];

if (command === 'restore' && process.argv[3]) {
  restoreFromJson(process.argv[3])
    .catch(console.error)
    .finally(() => prisma.$disconnect());
} else {
  backupDatabase()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
