# COSLAB 개발 규칙 (Development Rules)

> 이 문서는 프로젝트의 일관성과 유지보수성을 위한 필수 규칙입니다.

---

## 1. 스타일링 규칙

### 1.1 단일 스타일링 시스템: Theme Factory

```
src/styles/theme.ts  →  유일한 스타일 정의 소스
```

**규칙:**
- 모든 스타일은 `theme.ts`에서 정의
- UI 컴포넌트 래퍼 (Button.tsx, Card.tsx 등) 금지
- 직접 `theme.btn.primary`, `theme.card.base` 형태로 사용

**올바른 사용:**
```tsx
import { theme } from '../styles/theme';

<button className={theme.btn.primary}>Submit</button>
<div className={theme.card.base}>Content</div>
```

**금지된 패턴:**
```tsx
// ❌ UI 컴포넌트 래퍼 금지
<Button variant="primary">Submit</Button>
<Card hover padding="md">Content</Card>
```

### 1.2 색상: CSS 변수 필수

**규칙:**
- 하드코딩 색상 금지 (`text-white`, `bg-gray-800` 등)
- CSS 변수 기반 색상만 사용 (`text-text`, `bg-bg-elevated` 등)

**예외:**
- Primary 버튼 내부 텍스트: `text-white` 허용 (대비 목적)
- 그라데이션, 특수 효과: 하드코딩 허용

**올바른 사용:**
```tsx
// ✅ CSS 변수 사용
<div className="bg-bg-elevated border-border text-text">

// ✅ 예외: Primary 버튼은 white 허용
<button className="bg-primary text-white">
```

**금지된 패턴:**
```tsx
// ❌ 하드코딩 금지
<div className="bg-gray-800 border-white/10 text-white">
<div className="bg-white/5 hover:bg-white/10">
```

### 1.3 색상 매핑 테이블

| 하드코딩 (금지) | CSS 변수 (사용) |
|-----------------|-----------------|
| `text-white` | `text-text` |
| `text-gray-400` | `text-text-secondary` |
| `bg-gray-800` | `bg-bg` |
| `bg-gray-700` | `bg-bg-elevated` |
| `border-white/10` | `border-border` |
| `bg-white/5` | `bg-bg-tertiary` |

---

## 2. 파일 구조 규칙

### 2.1 금지된 폴더/파일

```
src/components/ui/          ← 삭제됨, 재생성 금지
src/components/Button.tsx   ← 단독 UI 컴포넌트 금지
src/components/Card.tsx     ← 단독 UI 컴포넌트 금지
```

### 2.2 허용된 구조

```
src/
├── styles/
│   └── theme.ts           ← 유일한 스타일 정의
├── components/
│   ├── Chat.tsx           ← 기능 컴포넌트 (OK)
│   ├── CodeEditor.tsx     ← 기능 컴포넌트 (OK)
│   └── ThemeToggle.tsx    ← 기능 컴포넌트 (OK)
├── hooks/
│   └── useTheme.ts
└── pages/
    └── Admin.tsx
```

---

## 3. theme.ts 확장 규칙

### 3.1 새로운 스타일 추가 시

```typescript
// theme.ts에 추가
export const newComponent = {
  base: 'bg-bg-elevated rounded-xl border border-border',
  hover: 'hover:bg-bg-hover transition-colors',
};

// theme 객체에 등록
export const theme = {
  ...existing,
  newComponent,
};
```

### 3.2 조합 헬퍼 추가

```typescript
// 자주 쓰는 조합은 헬퍼로
export const btn = {
  primary: `${button.base} ${button.md} ${button.primary}`,
  primarySm: `${button.base} ${button.sm} ${button.primary}`,
  // ...
};
```

---

## 4. 라이트/다크 모드 규칙

### 4.1 CSS 변수 기반

```css
/* index.css */
:root {
  --color-bg: #ffffff;        /* 라이트 모드 */
  --color-text: #111827;
}

:root.dark {
  --color-bg: #1f2937;        /* 다크 모드 */
  --color-text: #ffffff;
}
```

### 4.2 Tailwind에서 사용

```typescript
// tailwind.config.js
colors: {
  bg: {
    DEFAULT: 'var(--color-bg)',
    elevated: 'var(--color-bg-elevated)',
  }
}
```

### 4.3 테마 전환

```tsx
import { useTheme } from '../hooks/useTheme';

const { toggleTheme, isDark } = useTheme();
```

---

## 5. 코드 리뷰 체크리스트

PR 전 확인사항:

- [ ] `src/components/ui/` 폴더 없음
- [ ] `import { Button } from './ui'` 없음
- [ ] `text-white` 사용 시 Primary 버튼인지 확인
- [ ] `border-white/`, `bg-white/` 패턴 없음
- [ ] 새 스타일은 `theme.ts`에 정의됨
- [ ] CSS 변수 기반 색상 사용

---

## 6. 예제 코드

### 6.1 버튼 사용

```tsx
import { theme } from '../styles/theme';

// Primary 버튼
<button className={theme.btn.primary}>
  Submit
</button>

// Ghost 버튼 (작은 크기)
<button className={theme.btn.ghostSm}>
  Cancel
</button>

// 로딩 상태
<button className={theme.btn.primary} disabled={loading}>
  {loading ? <Spinner /> : 'Submit'}
</button>
```

### 6.2 카드 사용

```tsx
<div className={theme.card.base + ' p-4'}>
  <h3 className={theme.text.h4}>Title</h3>
  <p className={theme.text.body}>Content</p>
</div>
```

### 6.3 테이블 사용

```tsx
<table className={theme.table.base}>
  <thead className={theme.table.thead}>
    <tr>
      <th className={theme.table.th}>Name</th>
    </tr>
  </thead>
  <tbody className={theme.table.tbody}>
    <tr className={theme.table.tr}>
      <td className={theme.table.td}>Value</td>
    </tr>
  </tbody>
</table>
```

---

## 7. 이 규칙을 만든 이유

### 7.1 이전 문제점

```
❌ UI 컴포넌트 (Button.tsx)와 theme.ts 이중 관리
❌ 하드코딩 white 색상으로 라이트 모드 깨짐
❌ 4개 UI 컴포넌트 중 3개 미사용 (낭비)
❌ 스타일 수정 시 두 곳 수정 필요
```

### 7.2 해결책

```
✅ 단일 소스: theme.ts만 관리
✅ CSS 변수: 라이트/다크 자동 대응
✅ 직접 사용: 추상화 레이어 제거
✅ 유지보수: 한 곳만 수정
```

---

**마지막 업데이트:** 2024-12-24
