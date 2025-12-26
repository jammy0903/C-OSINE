# Working Log: 폴더 구조 리팩토링 + 레이아웃 분리

**Date**: 2025-12-26
**Feature**: 프론트엔드 폴더 구조 현대화 및 레이아웃 시스템 구축
**Status**: Completed

---

## 1. 목표

2025년 React 베스트 프랙티스에 맞춰 폴더 구조 정리 및 레이아웃 문제 해결

### 해결한 문제
- Footer가 하단에 고정되지 않음
- `min-h-[calc(100vh-200px)]` 하드코딩으로 인한 레이아웃 깨짐
- App.tsx에 모든 코드가 집중 (200줄+)
- 기능별 분리 없이 components에 모든 것이 혼재

---

## 2. 변경 사항

### 2.1 레이아웃 시스템 구축

**Before:**
```tsx
// App.tsx (200줄+)
<div className="min-h-screen flex flex-col">
  <header>...</header>
  <main>
    <div className="min-h-[calc(100vh-200px)]">  {/* 문제! */}
      ...
    </div>
  </main>
  <footer>...</footer>
</div>
```

**After:**
```tsx
// layouts/MainLayout.tsx
<div className="h-screen flex flex-col overflow-hidden">
  <header className="shrink-0">...</header>
  <main className="flex-1 overflow-auto p-4">
    {children}
  </main>
  <footer className="shrink-0">...</footer>
</div>

// App.tsx (45줄)
<MainLayout>
  {activeTab === 'problems' && ...}
  {activeTab === 'memory' && ...}
  {activeTab === 'chat' && ...}
</MainLayout>
```

### 2.2 Features 폴더 구조

**Before:**
```
src/
├── components/
│   ├── Chat.tsx
│   ├── CodeEditor.tsx
│   ├── ProblemList.tsx
│   ├── MemoryViz.tsx (unused)
│   ├── memory-viz/
│   └── ui/
```

**After:**
```
src/
├── layouts/
│   ├── MainLayout.tsx
│   └── index.ts
├── features/
│   ├── index.ts
│   ├── chat/
│   │   ├── Chat.tsx
│   │   └── index.ts
│   ├── problems/
│   │   ├── CodeEditor.tsx
│   │   ├── ProblemList.tsx
│   │   └── index.ts
│   └── memory/
│       ├── index.ts
│       └── memory-viz/
│           ├── components/
│           ├── hooks/
│           ├── constants.ts
│           ├── types.ts
│           └── utils.ts
├── components/
│   ├── ThemeToggle.tsx
│   └── ui/           # shadcn only
├── hooks/
├── services/
├── stores/
└── lib/
```

---

## 3. 핵심 파일 변경

| 파일 | 변경 내용 |
|------|-----------|
| `src/layouts/MainLayout.tsx` | 새로 생성 - Header/Footer/레이아웃 |
| `src/App.tsx` | 200줄 → 45줄로 간소화 |
| `src/features/index.ts` | 통합 export |
| `src/features/chat/` | Chat.tsx 이동 |
| `src/features/problems/` | CodeEditor, ProblemList 이동 |
| `src/features/memory/` | memory-viz 폴더 이동 |
| `src/components/MemoryViz.tsx` | 삭제 (미사용) |

---

## 4. 기술 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| 레이아웃 방식 | `h-screen` + `flex-col` | viewport 높이 정확히 채움 |
| 스크롤 위치 | `main`에 `overflow-auto` | Header/Footer 고정, 콘텐츠만 스크롤 |
| 폴더 구조 | Feature-Based | 2025 베스트 프랙티스, 기능별 응집도 |
| 중첩 깊이 | 최대 2-3단계 | 깊은 중첩 방지 |

---

## 5. TODO (앞으로 할 것)

### 5.1 라우팅 시스템 도입
- [ ] react-router-dom 설정
- [ ] `router.tsx` 생성
- [ ] 탭 기반 → URL 기반 네비게이션
- [ ] Admin 페이지 분리 (`/admin` 라우트)

### 5.2 추가 레이아웃 (필요시)
- [ ] `AuthLayout.tsx` - 로그인/회원가입용 (미니멀)
- [ ] `AdminLayout.tsx` - 관리자 대시보드용 (사이드바)

### 5.3 Features 확장
- [ ] `features/problems/` 내부 세분화
  - `components/` - ProblemCard, TestCaseList 등
  - `hooks/` - useSubmission, useTestRunner 등
  - `api/` - problems API 호출
- [ ] `features/chat/` 내부 세분화
  - `components/` - ChatMessage, ChatInput 등

### 5.4 공통 컴포넌트 정리
- [ ] `components/common/` 폴더 추가
- [ ] ThemeToggle 등 공통 컴포넌트 이동
- [ ] Logo 컴포넌트 생성

### 5.5 코드 품질
- [ ] 각 feature에 `README.md` 추가 (선택)
- [ ] barrel exports 패턴 일관성 유지
- [ ] 경로 alias 설정 (`@/features`, `@/layouts` 등)

---

## 6. 참고 자료

- [Recommended Folder Structure for React 2025](https://dev.to/pramod_boda/recommended-folder-structure-for-react-2025-48mc)
- [React Folder Structure in 5 Steps](https://www.robinwieruch.de/react-folder-structure/)
- [How to Structure a React Project in 2025](https://dev.to/algo_sync/how-to-structure-a-react-project-in-2025-clean-scalable-and-practical-15j6)

---

## 7. 최종 상태

```
TypeScript 컴파일: ✅ 통과
레이아웃 동작: ✅ Footer 하단 고정
코드 품질: ✅ App.tsx 80% 감소
```
