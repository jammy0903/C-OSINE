/**
 * Problems Feature Constants
 * 태그 색상, 난이도 설정 등
 */

// Tag color mapping (Tailwind classes)
export const TAG_COLORS: Record<string, string> = {
  '구현': 'bg-indigo-500/15 text-indigo-400',
  '시뮬레이션': 'bg-indigo-500/15 text-indigo-400',
  '브루트포스': 'bg-red-400/15 text-red-400',
  '완전탐색': 'bg-red-400/15 text-red-400',
  '수학': 'bg-amber-400/15 text-amber-400',
  '문자열': 'bg-emerald-400/15 text-emerald-400',
  '자료구조': 'bg-cyan-400/15 text-cyan-400',
  '정렬': 'bg-orange-400/15 text-orange-400',
  '탐색': 'bg-pink-400/15 text-pink-400',
  'dp': 'bg-violet-400/15 text-violet-400',
  '그리디': 'bg-lime-400/15 text-lime-400',
  '그래프': 'bg-teal-400/15 text-teal-400',
};

export const FALLBACK_COLORS = [
  'bg-purple-500/15 text-purple-400',
  'bg-sky-500/15 text-sky-400',
];

// Difficulty config (Tailwind classes)
export const DIFFICULTY_CONFIG: Record<string, { className: string; label: string }> = {
  bronze: { className: 'bg-amber-600/15 text-amber-600', label: 'Bronze' },
  silver: { className: 'bg-slate-400/15 text-slate-400', label: 'Silver' },
  gold: { className: 'bg-amber-400/15 text-amber-400', label: 'Gold' },
  platinum: { className: 'bg-emerald-400/15 text-emerald-400', label: 'Platinum' },
  diamond: { className: 'bg-cyan-400/15 text-cyan-400', label: 'Diamond' },
  ruby: { className: 'bg-red-400/15 text-red-400', label: 'Ruby' },
};

export const DIFFICULTIES = ['All', 'Bronze', 'Silver', 'Gold', 'Platinum'] as const;

/**
 * 태그 색상 가져오기
 */
export function getTagColor(tag: string, index: number): string {
  const lowerTag = tag.toLowerCase();
  for (const [key, value] of Object.entries(TAG_COLORS)) {
    if (lowerTag.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerTag)) {
      return value;
    }
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

/**
 * 난이도 정보 가져오기
 */
export function getDifficultyInfo(diff: string): { className: string; label: string } {
  const lower = diff.toLowerCase();
  for (const [key, value] of Object.entries(DIFFICULTY_CONFIG)) {
    if (lower.includes(key)) return value;
  }
  return { className: 'bg-muted text-muted-foreground', label: diff };
}
