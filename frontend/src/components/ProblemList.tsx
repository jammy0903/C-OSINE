import { useState } from 'react';
import { useStore } from '../stores/store';

// Problem 타입 정의
interface Problem {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  acceptedCount: number;
  submissionCount: number;
  userStatus?: 'solved' | 'attempted';
  testCases: { input: string; output: string }[];
}

// 티어별 색상 (C-ode-to-you 스타일)
const tierColors: Record<string, string> = {
  bronze: 'bg-amber-700',
  silver: 'bg-slate-500',
  gold: 'bg-yellow-500',
  platinum: 'bg-emerald-400',
  diamond: 'bg-sky-400',
  ruby: 'bg-rose-500',
};

const tierTextColors: Record<string, string> = {
  bronze: 'text-amber-700',
  silver: 'text-slate-400',
  gold: 'text-yellow-500',
  platinum: 'text-emerald-400',
  diamond: 'text-sky-400',
  ruby: 'text-rose-500',
};

// 목업 데이터
const mockProblems: Problem[] = [
  {
    id: '1',
    number: 1000,
    title: 'A+B',
    description: `두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.

## 입력
첫째 줄에 A와 B가 주어진다. (0 < A, B < 10)

## 출력
첫째 줄에 A+B를 출력한다.

## 예제 입력
1 2

## 예제 출력
3`,
    difficulty: 'bronze_5',
    tags: ['입출력', '사칙연산'],
    acceptedCount: 150000,
    submissionCount: 200000,
    userStatus: 'solved',
    testCases: [{ input: '1 2', output: '3' }, { input: '5 7', output: '12' }],
  },
  {
    id: '2',
    number: 1001,
    title: 'A-B',
    description: `두 정수 A와 B를 입력받은 다음, A-B를 출력하는 프로그램을 작성하시오.

## 입력
첫째 줄에 A와 B가 주어진다. (0 < A, B < 10)

## 출력
첫째 줄에 A-B를 출력한다.`,
    difficulty: 'bronze_5',
    tags: ['입출력', '사칙연산'],
    acceptedCount: 120000,
    submissionCount: 150000,
    userStatus: 'solved',
    testCases: [{ input: '3 2', output: '1' }],
  },
  {
    id: '3',
    number: 1008,
    title: 'A/B',
    description: `두 정수 A와 B를 입력받은 다음, A/B를 출력하는 프로그램을 작성하시오.

## 입력
첫째 줄에 A와 B가 주어진다. (0 < A, B < 10)

## 출력
첫째 줄에 A/B를 출력한다. 실제 정답과 출력값의 절대오차 또는 상대오차가 10^-9 이하이면 정답이다.`,
    difficulty: 'bronze_4',
    tags: ['입출력', '사칙연산'],
    acceptedCount: 80000,
    submissionCount: 200000,
    userStatus: 'attempted',
    testCases: [{ input: '1 3', output: '0.333333333333' }],
  },
  {
    id: '4',
    number: 10818,
    title: '최소, 최대',
    description: `N개의 정수가 주어진다. 이때, 최솟값과 최댓값을 구하는 프로그램을 작성하시오.

## 입력
첫째 줄에 정수의 개수 N (1 ≤ N ≤ 1,000,000)이 주어진다.
둘째 줄에는 N개의 정수를 공백으로 구분해서 주어진다.

## 출력
첫째 줄에 최솟값과 최댓값을 공백으로 구분해 출력한다.`,
    difficulty: 'bronze_3',
    tags: ['배열', '반복문'],
    acceptedCount: 90000,
    submissionCount: 180000,
    testCases: [{ input: '5\n20 10 35 30 7', output: '7 35' }],
  },
  {
    id: '5',
    number: 2557,
    title: 'Hello World',
    description: `Hello World!를 출력하시오.

## 입력
없음

## 출력
Hello World!를 출력하시오.`,
    difficulty: 'bronze_5',
    tags: ['입출력'],
    acceptedCount: 200000,
    submissionCount: 250000,
    userStatus: 'solved',
    testCases: [{ input: '', output: 'Hello World!' }],
  },
  {
    id: '6',
    number: 1546,
    title: '평균',
    description: `세준이는 기말고사를 망쳤다. 그래서 점수를 조작해서 엄마에게 보여주려고 한다.

점수를 조작하는 방법은 다음과 같다. 우선, 최고점을 M이라고 한다.
모든 점수를 점수/M*100으로 바꾼다.

예를 들어, 최고점이 70이고, 점수가 50이면 새로운 점수는 50/70*100이므로 71.43점이다.

세준이의 성적을 위의 방법대로 새로 계산했을 때, 새로운 평균을 구하는 프로그램을 작성하시오.`,
    difficulty: 'bronze_1',
    tags: ['배열', '수학'],
    acceptedCount: 60000,
    submissionCount: 150000,
    testCases: [{ input: '3\n40 80 60', output: '75.0' }],
  },
  {
    id: '7',
    number: 2750,
    title: '수 정렬하기',
    description: `N개의 수가 주어졌을 때, 이를 오름차순으로 정렬하는 프로그램을 작성하시오.

## 입력
첫째 줄에 수의 개수 N(1 ≤ N ≤ 1,000)이 주어진다.
둘째 줄부터 N개의 줄에는 수가 주어진다.

## 출력
첫째 줄부터 N개의 줄에 오름차순으로 정렬한 결과를 한 줄에 하나씩 출력한다.`,
    difficulty: 'silver_5',
    tags: ['정렬'],
    acceptedCount: 100000,
    submissionCount: 200000,
    testCases: [{ input: '5\n5\n2\n3\n4\n1', output: '1\n2\n3\n4\n5' }],
  },
  {
    id: '8',
    number: 11720,
    title: '숫자의 합',
    description: `N개의 숫자가 공백 없이 쓰여있다. 이 숫자를 모두 합해서 출력하는 프로그램을 작성하시오.

## 입력
첫째 줄에 숫자의 개수 N (1 ≤ N ≤ 100)이 주어진다.
둘째 줄에 숫자 N개가 공백없이 주어진다.

## 출력
입력으로 주어진 숫자 N개의 합을 출력한다.`,
    difficulty: 'bronze_4',
    tags: ['문자열', '수학'],
    acceptedCount: 70000,
    submissionCount: 100000,
    userStatus: 'attempted',
    testCases: [{ input: '5\n54321', output: '15' }],
  },
];


function getTierInfo(difficulty: string) {
  const [tier, level] = difficulty.split('_');
  return { tier, level };
}

function getTierColorClass(difficulty: string) {
  const { tier } = getTierInfo(difficulty);
  return tierColors[tier] || 'bg-gray-500';
}

function getTierTextColorClass(difficulty: string) {
  const { tier } = getTierInfo(difficulty);
  return tierTextColors[tier] || 'text-gray-500';
}

function formatDifficulty(difficulty: string) {
  const { tier, level } = getTierInfo(difficulty);
  return `${tier.charAt(0).toUpperCase() + tier.slice(1)} ${level}`;
}

function calculateAcceptanceRate(accepted: number, total: number) {
  if (total === 0) return '0';
  return ((accepted / total) * 100).toFixed(1);
}

export function ProblemList() {
  const { selectProblem } = useStore();
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const filteredProblems = mockProblems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.number.toString().includes(search);
    const matchesTier = !selectedTier || p.difficulty.includes(selectedTier);
    return matchesSearch && matchesTier;
  });

  const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'ruby'];

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* 검색바 */}
      <div className="p-4 bg-[#1a1a1a] border-b border-gray-800">
        <input
          type="text"
          placeholder="문제 번호 또는 제목 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* 필터 */}
      <div className="px-4 py-3 bg-[#1a1a1a] border-b border-gray-800 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedTier(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            selectedTier === null
              ? 'bg-blue-600 text-white'
              : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
          }`}
        >
          전체
        </button>
        {tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedTier === tier
                ? `${tierColors[tier]} text-white`
                : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
            }`}
          >
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </button>
        ))}
      </div>

      {/* 문제 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredProblems.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            문제를 찾을 수 없습니다
          </div>
        ) : (
          filteredProblems.map((problem) => (
            <div
              key={problem.id}
              onClick={() => selectProblem(problem)}
              className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800 hover:border-gray-600 cursor-pointer transition-colors group"
            >
              {/* 상단: 번호 + 티어 + 상태 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm font-medium">
                    #{problem.number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${getTierColorClass(
                      problem.difficulty
                    )}`}
                  >
                    {formatDifficulty(problem.difficulty)}
                  </span>
                </div>
                {problem.userStatus && (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      problem.userStatus === 'solved'
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {problem.userStatus === 'solved' ? '✓' : '○'}
                  </div>
                )}
              </div>

              {/* 제목 */}
              <h3 className="text-white font-medium text-lg mb-2 group-hover:text-blue-400 transition-colors">
                {problem.title}
              </h3>

              {/* 태그 */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {problem.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-[#2a2a2a] text-gray-400 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 통계 */}
              <div className="text-xs text-gray-500">
                정답률:{' '}
                <span className={getTierTextColorClass(problem.difficulty)}>
                  {calculateAcceptanceRate(
                    problem.acceptedCount,
                    problem.submissionCount
                  )}
                  %
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
