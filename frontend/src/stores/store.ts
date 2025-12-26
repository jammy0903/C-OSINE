import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { Message, RunResult, TabType, Problem } from '../types';

interface Store {
  // === 사용자 ===
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  solvedProblems: string[];  // 정답 처리된 문제 ID 목록
  attemptedProblems: string[];  // 시도한 문제 ID 목록
  setSolvedStatus: (solved: string[], attempted: string[]) => void;

  // === 탭 ===
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // === 선택된 문제 ===
  selectedProblem: Problem | null;
  selectProblem: (problem: Problem) => void;
  clearProblem: () => void;

  // === 채팅 ===
  messages: Message[];
  isAiLoading: boolean;
  addMessage: (msg: Message) => void;
  setAiLoading: (loading: boolean) => void;
  clearMessages: () => void;

  // === 코드 에디터 ===
  code: string;
  setCode: (code: string) => void;
  result: RunResult | null;
  setResult: (result: RunResult | null) => void;
  isRunning: boolean;
  setRunning: (running: boolean) => void;
}

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`;

export const useStore = create<Store>((set) => ({
  // === 사용자 ===
  user: null,
  setUser: (user) => set({ user }),
  isAdmin: false,
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  solvedProblems: [],
  attemptedProblems: [],
  setSolvedStatus: (solved, attempted) => set({ solvedProblems: solved, attemptedProblems: attempted }),

  // === 탭 ===
  activeTab: 'problems',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // === 선택된 문제 ===
  selectedProblem: null,
  selectProblem: (problem) => set({ selectedProblem: problem }),
  clearProblem: () => set({ selectedProblem: null }),

  // === 채팅 ===
  messages: [],
  isAiLoading: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setAiLoading: (loading) => set({ isAiLoading: loading }),
  clearMessages: () => set({ messages: [] }),

  // === 코드 에디터 ===
  code: DEFAULT_CODE,
  setCode: (code) => set({ code }),
  result: null,
  setResult: (result) => set({ result }),
  isRunning: false,
  setRunning: (running) => set({ isRunning: running }),
}));
