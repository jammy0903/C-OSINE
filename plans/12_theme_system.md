# 12. 테마 시스템 (다크/라이트 모드)

> 사용자가 다크/라이트 모드를 전환할 수 있는 기능

---

## 목표

1. 다크 모드 / 라이트 모드 전환 버튼
2. 시스템 설정 자동 감지 (prefers-color-scheme)
3. 사용자 선택 localStorage 저장
4. 부드러운 전환 애니메이션

---

## 색상 팔레트

### Dark Mode (Lighter Dark - Option D)

```
bg:          #1f2937  ████  Gray-800
bg-elevated: #374151  ████  Gray-700
bg-tertiary: #4b5563  ████  Gray-600
bg-hover:    #4b5563  ████  Gray-600

text:        #ffffff  ████  White
text-secondary: #d1d5db  ████  Gray-300
text-tertiary:  #9ca3af  ████  Gray-400
text-muted:     #6b7280  ████  Gray-500

border:      rgba(255, 255, 255, 0.1)
```

### Light Mode (제안)

```
bg:          #ffffff  ████  White
bg-elevated: #f9fafb  ████  Gray-50
bg-tertiary: #f3f4f6  ████  Gray-100
bg-hover:    #e5e7eb  ████  Gray-200

text:        #111827  ████  Gray-900
text-secondary: #374151  ████  Gray-700
text-tertiary:  #6b7280  ████  Gray-500
text-muted:     #9ca3af  ████  Gray-400

border:      rgba(0, 0, 0, 0.1)
```

---

## 구현 방법

### 1. Tailwind CSS 다크 모드 설정

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',  // 'class' 또는 'media'
  // ...
}
```

### 2. CSS 변수 방식 (권장)

```css
/* index.css */
:root {
  /* Light Mode (기본) */
  --color-bg: #ffffff;
  --color-bg-elevated: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  --color-text: #111827;
  --color-text-secondary: #374151;
  --color-border: rgba(0, 0, 0, 0.1);
}

:root.dark {
  /* Dark Mode */
  --color-bg: #1f2937;
  --color-bg-elevated: #374151;
  --color-bg-tertiary: #4b5563;
  --color-text: #ffffff;
  --color-text-secondary: #d1d5db;
  --color-border: rgba(255, 255, 255, 0.1);
}
```

```js
// tailwind.config.js
colors: {
  bg: {
    DEFAULT: 'var(--color-bg)',
    elevated: 'var(--color-bg-elevated)',
    // ...
  }
}
```

### 3. 테마 전환 Hook

```typescript
// hooks/useTheme.ts
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark' || (theme === 'system' && systemDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
```

### 4. 테마 토글 버튼

```tsx
// components/ThemeToggle.tsx
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-bg-hover transition-colors"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

---

## 구현 순서

1. [ ] tailwind.config.js에 `darkMode: 'class'` 추가
2. [ ] index.css에 CSS 변수 정의 (light/dark)
3. [ ] tailwind.config.js 색상을 CSS 변수로 교체
4. [ ] useTheme 훅 생성
5. [ ] ThemeToggle 컴포넌트 생성
6. [ ] App.tsx 헤더에 ThemeToggle 추가
7. [ ] 모든 컴포넌트 색상 테스트

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `tailwind.config.js` | darkMode: 'class', CSS 변수 사용 |
| `src/index.css` | CSS 변수 정의 |
| `src/hooks/useTheme.ts` | 새 파일 |
| `src/components/ThemeToggle.tsx` | 새 파일 |
| `src/App.tsx` | ThemeToggle 추가 |
| `src/stores/store.ts` | theme 상태 추가 (선택) |

---

## 예상 시간

- 구현: 2시간
- 테스트: 1시간
- 총: 3시간
