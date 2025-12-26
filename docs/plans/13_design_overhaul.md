# 13. 디자인 전면 개편 계획

> 프로 웹 디자이너 관점의 UI/UX 개선 로드맵

---

## 현재 상태 평가

| 영역 | 등급 | 주요 문제 |
|------|------|----------|
| SEO | F | meta 태그 전무, sitemap 없음 |
| 폰트 | D | 6개 폰트 로드 (성능 저하) |
| UI 일관성 | C | theme.ts vs Button.tsx 충돌 |
| 반응형 | D | 모바일 대응 미흡 |
| 접근성 | D | aria-label 부족, 키보드 네비게이션 미흡 |
| 컴포넌트 구조 | C | God Component, 재사용성 부족 |
| 시각 디자인 | C | 여백 불일관, 호버 상태 약함 |
| 성능 | C | 번들 크기, 폰트 로딩 문제 |

---

## Phase 1: 긴급 수정 (SEO + 성능)

### 1.1 SEO 메타 태그 추가

**파일:** `index.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- 기본 SEO -->
  <title>COSLAB - C 프로그래밍 & OS 학습 플랫폼</title>
  <meta name="description" content="C 언어와 운영체제를 시각적으로 학습하세요. 메모리 시뮬레이터, AI 튜터, 실시간 코드 실행을 제공합니다." />
  <meta name="keywords" content="C언어, 운영체제, 프로그래밍, 메모리, 포인터, 학습, 코딩" />
  <meta name="author" content="COSLAB" />

  <!-- Open Graph (Facebook, LinkedIn) -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://coslab.dev/" />
  <meta property="og:title" content="COSLAB - C 프로그래밍 & OS 학습 플랫폼" />
  <meta property="og:description" content="C 언어와 운영체제를 시각적으로 학습하세요." />
  <meta property="og:image" content="https://coslab.dev/og-image.png" />
  <meta property="og:locale" content="ko_KR" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="COSLAB - C 프로그래밍 & OS 학습 플랫폼" />
  <meta name="twitter:description" content="C 언어와 운영체제를 시각적으로 학습하세요." />
  <meta name="twitter:image" content="https://coslab.dev/og-image.png" />

  <!-- Canonical -->
  <link rel="canonical" href="https://coslab.dev/" />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

  <!-- Theme Color -->
  <meta name="theme-color" content="#6366f1" />
</head>
```

**체크리스트:**
- [ ] index.html 메타 태그 추가
- [ ] og-image.png 생성 (1200x630)
- [ ] favicon.svg 생성
- [ ] apple-touch-icon.png 생성 (180x180)

---

### 1.2 sitemap.xml & robots.txt

**파일:** `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://coslab.dev/</loc>
    <lastmod>2024-12-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://coslab.dev/problems</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**파일:** `public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /manajammy/

Sitemap: https://coslab.dev/sitemap.xml
```

**체크리스트:**
- [ ] public/sitemap.xml 생성
- [ ] public/robots.txt 생성

---

### 1.3 폰트 최적화

**현재 (6개 폰트):**
```
Do Hyeon, Gothic A1, Gugi, Orbitron, Rajdhani, Space Grotesk
약 500KB+ 로드
```

**개선 (2개 폰트):**
```
Pretendard (본문) - 한글 최적화, 가변 폰트
JetBrains Mono (코드) - 모노스페이스
약 150KB 로드
```

**파일:** `index.html`

```html
<!-- 기존 폰트 제거, 아래로 교체 -->
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" />
```

**파일:** `src/index.css`

```css
:root {
  --font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
}
```

**체크리스트:**
- [ ] index.html 폰트 링크 교체
- [ ] index.css 폰트 변수 수정
- [ ] tailwind.config.js 폰트 설정 확인

---

## Phase 2: UI 일관성 통일

### 2.1 Button.tsx를 theme.ts 기반으로 재작성

**문제:** Button.tsx가 `white/5`, `white/10` 등 하드코딩 사용

**해결:** theme.ts의 CSS 변수 기반 클래스 사용

```tsx
// src/components/ui/Button.tsx (개선)
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-primary-hover text-white',
  secondary: 'bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text border border-border',
  ghost: 'bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text',
  success: 'bg-success hover:bg-success-dark text-white',
  danger: 'bg-danger hover:bg-danger-dark text-white',
};
```

**체크리스트:**
- [ ] Button.tsx 색상 클래스 수정
- [ ] 테마 전환 시 버튼 색상 확인

---

### 2.2 UI 컴포넌트 추가

**생성할 파일:**

```
src/components/ui/
├── index.ts        # 통합 export
├── Button.tsx      # 기존 (수정)
├── Input.tsx       # 새로 생성
├── Card.tsx        # 새로 생성
├── Badge.tsx       # 새로 생성
├── Avatar.tsx      # 새로 생성
├── Spinner.tsx     # 새로 생성
└── Icon.tsx        # 아이콘 래퍼 (새로 생성)
```

**Input.tsx 예시:**

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-text-tertiary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full bg-bg border border-border rounded-lg
            text-text placeholder-text-muted
            focus:outline-none focus:border-primary
            transition-colors
            ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2 text-sm
            ${error ? 'border-danger' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
```

**체크리스트:**
- [ ] Input.tsx 생성
- [ ] Card.tsx 생성
- [ ] Badge.tsx 생성
- [ ] Avatar.tsx 생성
- [ ] Spinner.tsx 생성
- [ ] Icon.tsx 생성
- [ ] index.ts 통합 export

---

### 2.3 하드코딩 색상 제거

**검색 패턴:**
```bash
# 하드코딩 색상 찾기
grep -r "white/" src/
grep -r "#[0-9a-fA-F]" src/
grep -r "rgba(" src/
```

**교체 규칙:**

| 현재 | 변경 |
|------|------|
| `white` | `text-text` |
| `white/5` | `bg-bg-tertiary` 또는 `border-border-light` |
| `white/10` | `bg-bg-hover` |
| `white/30` | `text-text-muted` |
| `white/60` | `text-text-secondary` |
| `#0a0a0b` | `bg-bg` |
| `rgba(...)` | CSS 변수 또는 Tailwind 클래스 |

**체크리스트:**
- [ ] ProblemList.tsx 색상 수정
- [ ] Chat.tsx 색상 수정
- [ ] CodeEditor.tsx 색상 수정
- [ ] MemoryViz.tsx 색상 수정
- [ ] LoginButton.tsx 색상 수정

---

## Phase 3: 반응형 + 접근성

### 3.1 반응형 브레이크포인트

**Tailwind 기본 브레이크포인트:**
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

**적용 규칙:**

```tsx
// 현재 (모바일 미대응)
<div className="grid grid-cols-4 gap-4">

// 개선 (모바일 우선)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
```

**주요 수정 위치:**
- [ ] ProblemList.tsx - Stats 카드 그리드
- [ ] Admin.tsx - Stats 카드 그리드
- [ ] App.tsx - 헤더 네비게이션
- [ ] CodeEditor.tsx - 패널 레이아웃
- [ ] MemoryViz.tsx - 2분할 레이아웃

---

### 3.2 접근성 개선

**aria-label 추가:**

```tsx
// 현재
<button onClick={...}>
  <svg>...</svg>
</button>

// 개선
<button
  onClick={...}
  aria-label="테마 전환"
  title="테마 전환"
>
  <svg aria-hidden="true">...</svg>
</button>
```

**입력 필드 label:**

```tsx
// 현재
<input placeholder="Search..." />

// 개선
<label htmlFor="search" className="sr-only">검색</label>
<input id="search" placeholder="Search..." aria-label="검색" />
```

**키보드 네비게이션:**
- [ ] Tab 순서 확인
- [ ] Enter/Space로 버튼 활성화 확인
- [ ] Escape로 모달/드롭다운 닫기
- [ ] 포커스 표시 명확하게

**체크리스트:**
- [ ] 모든 아이콘 버튼에 aria-label 추가
- [ ] 모든 입력 필드에 label 연결
- [ ] sr-only 클래스로 숨김 레이블 추가
- [ ] 키보드 네비게이션 테스트

---

## Phase 4: 시각 디자인 폴리싱

### 4.1 여백 시스템 통일

**spacing scale 정의:**

```ts
// src/styles/spacing.ts
export const spacing = {
  // 컴포넌트 내부 패딩
  card: {
    sm: 'p-3',      // 12px
    md: 'p-4',      // 16px
    lg: 'p-6',      // 24px
  },

  // 섹션 간격
  section: {
    sm: 'py-4',     // 16px
    md: 'py-6',     // 24px
    lg: 'py-8',     // 32px
  },

  // 요소 간격
  gap: {
    xs: 'gap-1',    // 4px
    sm: 'gap-2',    // 8px
    md: 'gap-3',    // 12px
    lg: 'gap-4',    // 16px
    xl: 'gap-6',    // 24px
  },

  // 인라인 요소 간격
  inline: {
    xs: 'gap-1',
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-3',
  },
};
```

---

### 4.2 호버/액티브 상태 강화

**버튼:**
```css
/* 현재 */
hover:bg-primary-hover

/* 개선 */
hover:bg-primary-hover hover:shadow-md
active:scale-[0.98] active:shadow-sm
transition-all duration-150
```

**카드:**
```css
/* 현재 */
hover:border-primary/50

/* 개선 */
hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5
transition-all duration-200
```

**테이블 행:**
```css
/* 현재 */
hover:bg-bg-hover

/* 개선 */
hover:bg-bg-hover relative
before:absolute before:left-0 before:top-0 before:bottom-0
before:w-1 before:bg-primary before:scale-y-0
hover:before:scale-y-100 before:transition-transform
```

---

### 4.3 마이크로 애니메이션

**추가할 애니메이션:**

```css
/* tailwind.config.js */
animation: {
  'fade-in': 'fadeIn 0.2s ease-out',
  'slide-up': 'slideUp 0.3s ease-out',
  'slide-down': 'slideDown 0.2s ease-out',
  'scale-in': 'scaleIn 0.15s ease-out',
  'spin-slow': 'spin 2s linear infinite',
},
keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  slideUp: {
    '0%': { opacity: '0', transform: 'translateY(10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  slideDown: {
    '0%': { opacity: '0', transform: 'translateY(-10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  scaleIn: {
    '0%': { opacity: '0', transform: 'scale(0.95)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
},
```

**적용:**
- 페이지 전환: `animate-fade-in`
- 모달 열기: `animate-scale-in`
- 드롭다운: `animate-slide-down`
- 토스트: `animate-slide-up`

---

## 실행 순서 체크리스트

### Phase 1: 긴급 (1일)
- [ ] 1.1 SEO 메타 태그 추가
- [ ] 1.2 sitemap.xml, robots.txt 생성
- [ ] 1.3 폰트 2개로 최적화

### Phase 2: UI 일관성 (2일)
- [ ] 2.1 Button.tsx 수정
- [ ] 2.2 UI 컴포넌트 생성 (Input, Card, Badge 등)
- [ ] 2.3 하드코딩 색상 제거

### Phase 3: 반응형 + 접근성 (2일)
- [ ] 3.1 모바일 반응형 추가
- [ ] 3.2 접근성 개선 (aria-label, label)

### Phase 4: 폴리싱 (1일)
- [ ] 4.1 여백 시스템 통일
- [ ] 4.2 호버/액티브 상태 강화
- [ ] 4.3 마이크로 애니메이션 추가

---

## 예상 결과

| 영역 | 현재 | 목표 |
|------|------|------|
| SEO | F | A |
| 폰트 | D | A |
| UI 일관성 | C | A |
| 반응형 | D | B+ |
| 접근성 | D | B |
| 시각 디자인 | C | A |
| 성능 | C | B+ |
| **종합** | **D+** | **A-** |

---

## 참고 자료

- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [Google SEO 가이드](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs)
- [React 접근성](https://ko.reactjs.org/docs/accessibility.html)
