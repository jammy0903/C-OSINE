import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 기존 데이터 삭제
  await prisma.submission.deleteMany();
  await prisma.draft.deleteMany();
  await prisma.problem.deleteMany();

  // 샘플 문제 추가
  await prisma.problem.createMany({
    data: [
      {
        number: 1,
        title: 'Hello World',
        description: `# Hello World

printf 함수를 사용해서 "Hello World"를 출력하세요.

## 입력
없음

## 출력
\`\`\`
Hello World
\`\`\`

## 힌트
- printf() 함수는 <stdio.h> 헤더에 있습니다.
- 문자열은 큰따옴표("")로 감싸세요.`,
        difficulty: 'bronze_5',
        testCases: JSON.stringify([
          { input: '', output: 'Hello World' }
        ])
      },
      {
        number: 2,
        title: '두 수 더하기',
        description: `# 두 수 더하기

두 정수 A와 B를 입력받아 A+B를 출력하세요.

## 입력
첫 번째 줄에 두 정수 A, B가 공백으로 구분되어 주어집니다.

## 출력
A+B의 결과를 출력합니다.

## 예제
입력: \`1 2\`
출력: \`3\`

## 힌트
- scanf() 함수로 두 수를 입력받으세요.
- %d는 정수를 의미합니다.`,
        difficulty: 'bronze_5',
        testCases: JSON.stringify([
          { input: '1 2', output: '3' },
          { input: '5 7', output: '12' },
          { input: '100 200', output: '300' }
        ])
      },
      {
        number: 3,
        title: '포인터로 값 바꾸기',
        description: `# 포인터로 값 바꾸기

두 변수의 값을 포인터를 사용해서 교환하세요.

## 입력
두 정수 A, B가 주어집니다.

## 출력
B A 순서로 출력합니다 (교환된 결과).

## 예제
입력: \`3 5\`
출력: \`5 3\`

## 힌트
- 포인터를 사용해서 swap 함수를 만들어보세요.
- *p는 포인터가 가리키는 값을 의미합니다.
- 임시 변수를 사용하세요.`,
        difficulty: 'bronze_4',
        testCases: JSON.stringify([
          { input: '3 5', output: '5 3' },
          { input: '10 20', output: '20 10' }
        ])
      },
      {
        number: 4,
        title: '배열의 합',
        description: `# 배열의 합

5개의 정수를 입력받아 배열에 저장하고, 합계를 출력하세요.

## 입력
5개의 정수가 공백으로 구분되어 주어집니다.

## 출력
5개 정수의 합을 출력합니다.

## 예제
입력: \`1 2 3 4 5\`
출력: \`15\`

## 힌트
- int arr[5]; 로 배열을 선언하세요.
- for 루프로 입력받고 합계를 구하세요.`,
        difficulty: 'bronze_4',
        testCases: JSON.stringify([
          { input: '1 2 3 4 5', output: '15' },
          { input: '10 20 30 40 50', output: '150' }
        ])
      },
      {
        number: 5,
        title: '동적 배열 할당',
        description: `# 동적 배열 할당

n개의 정수를 입력받아 동적 배열에 저장하고, 역순으로 출력하세요.

## 입력
첫 줄에 정수 n이 주어집니다.
둘째 줄에 n개의 정수가 주어집니다.

## 출력
n개의 정수를 역순으로 출력합니다.

## 예제
입력:
\`\`\`
3
1 2 3
\`\`\`
출력: \`3 2 1\`

## 힌트
- malloc()으로 동적 할당
- free()로 메모리 해제
- sizeof(int) * n 바이트 할당`,
        difficulty: 'bronze_3',
        testCases: JSON.stringify([
          { input: '3\n1 2 3', output: '3 2 1' },
          { input: '5\n5 4 3 2 1', output: '1 2 3 4 5' }
        ])
      }
    ]
  });

  const count = await prisma.problem.count();
  console.log(`Seeded ${count} problems`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
