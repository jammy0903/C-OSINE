import { create } from 'zustand';
import type { Message, RunResult, MemBlock, TabType } from '../types';

interface Store {
  // === 탭 ===
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

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

  // === 메모리 시뮬레이터 ===
  memBlocks: MemBlock[];
  nextAddress: number;
  malloc: (name: string, size: number) => void;
  free: (name: string) => void;
  resetMemory: () => void;
}

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`;

export const useStore = create<Store>((set) => ({
  // === 탭 ===
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),

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

  // === 메모리 시뮬레이터 ===
  memBlocks: [],
  nextAddress: 0x1000, // 시작 주소

  malloc: (name, size) => set((s) => {
    // 중복 이름 체크
    if (s.memBlocks.some((b) => b.name === name)) {
      return s; // 변경 없음
    }

    const block: MemBlock = {
      id: crypto.randomUUID(),
      name,
      size,
      address: s.nextAddress,
    };

    return {
      memBlocks: [...s.memBlocks, block],
      nextAddress: s.nextAddress + size,
    };
  }),

  free: (name) => set((s) => ({
    memBlocks: s.memBlocks.filter((b) => b.name !== name),
  })),

  resetMemory: () => set({
    memBlocks: [],
    nextAddress: 0x1000,
  }),
}));
