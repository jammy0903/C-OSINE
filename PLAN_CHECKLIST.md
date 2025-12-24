# COSLAB 개발 계획 체크리스트

> 구현 전 모든 계획을 완성하고 시작한다

---

## 📋 계획 완성 체크리스트

### 1. 요구사항 분석
- [x] 기능 요구사항 명세 (Functional Requirements)
- [x] 비기능 요구사항 명세 (Non-Functional Requirements)
- [x] 사용자 스토리 / 유스케이스 정의

### 2. 기술 결정 (Technical Decisions)
- [x] AI 튜터 LLM 선택 → **로컬 LLM (Ollama + Qwen2.5-Coder)**
- [x] 샌드박스 구현 방식 → **Docker**
- [x] 데이터베이스 선택 → **SQLite (MVP) → PostgreSQL (확장)**
- [x] 인증/세션 방식 → **MVP 이후 구현**
- [x] 배포 환경 → **VPS (Docker Compose)**

### 3. API 설계
- [x] 엔드포인트 상세 스펙 (Request/Response 스키마)
- [x] 에러 코드 정의
- [x] Rate Limiting 정책

### 4. 데이터 모델
- [x] 데이터베이스 스키마 (필요시)
- [x] 메모리 시뮬레이터 상태 모델
- [x] OS 시뮬레이터 상태 모델

### 5. UI/UX 설계
- [x] 페이지 구조 (라우팅)
- [x] 와이어프레임 / 레이아웃
- [x] 컴포넌트 계층 구조
- [x] 사용자 플로우

### 6. 보안 설계
- [x] 위협 모델링 (Threat Model)
- [x] 샌드박스 탈출 방지 전략
- [x] 입력 검증 정책
- [x] 리소스 제한 정책

### 7. 테스트 전략
- [x] 단위 테스트 범위
- [x] 통합 테스트 시나리오
- [x] E2E 테스트 시나리오

### 8. DevOps / 배포
- [x] 개발 환경 설정 가이드
- [x] CI/CD 파이프라인
- [x] 모니터링 / 로깅

---

## 📁 계획 문서 파일 목록

| 파일명 | 내용 | 상태 |
|--------|------|------|
| `CLAUDE.md` | 프로젝트 개요 | ✅ 완료 |
| `reference.md` | 빠른 참조 | ✅ 완료 |
| `PLAN_CHECKLIST.md` | 이 파일 | ✅ 완료 |
| `plans/01_requirements.md` | 요구사항 명세 | ✅ 완료 |
| `plans/02_tech_decisions.md` | 기술 결정 | ✅ 완료 |
| `plans/03_api_spec.md` | API 상세 스펙 | ✅ 완료 |
| `plans/04_data_models.md` | 데이터 모델 | ✅ 완료 |
| `plans/05_ui_design.md` | UI/UX 설계 | ✅ 완료 |
| `plans/06_security.md` | 보안 설계 | ✅ 완료 |
| `plans/07_testing.md` | 테스트 전략 | ✅ 완료 |
| `plans/08_devops.md` | DevOps/배포 | ✅ 완료 |
| `plans/11_real_mvp.md` | 진짜 MVP 설계 | ✅ 완료 |
| `plans/12_theme_system.md` | 다크/라이트 테마 | ✅ 완료 |
| `plans/13_design_overhaul.md` | 디자인 전면 개편 | 📝 계획됨 |
| `plans/14_develop_rules.md` | 개발 규칙 (스타일링) | ✅ 완료 |

---

## ✅ 결정된 사항 요약

| 항목 | 결정 |
|------|------|
| AI 튜터 LLM | Ollama + Qwen2.5-Coder (로컬) |
| 샌드박스 | Docker (seccomp, 네트워크 차단) |
| 메모리 시뮬레이터 | 백엔드 계산 |
| 타임아웃 | 10초 (설정 가능) |
| 인증 | MVP 이후 구현 |
| 배포 | VPS + Docker Compose |

---

## 🚀 다음 단계: 구현 시작

모든 계획이 완료되었습니다. 이제 구현을 시작할 수 있습니다.

### 구현 순서 (권장)

```
1. 백엔드 기본 구조
   ├── FastAPI 서버 설정
   ├── /health 엔드포인트
   └── CORS, 에러 핸들링

2. C 코드 실행기 (핵심)
   ├── Docker 샌드박스 이미지
   ├── /c/run 엔드포인트
   └── 보안 검증 로직

3. AI 튜터
   ├── Ollama 연동
   ├── /ai/ask 엔드포인트
   └── 프롬프트 템플릿

4. 메모리 시뮬레이터
   ├── 메모리 상태 모델
   ├── /os/sim/memory/* 엔드포인트
   └── 애니메이션 데이터

5. 프론트엔드
   ├── React + TypeScript 설정
   ├── Monaco Editor 통합
   ├── 채팅 UI
   └── 메모리 시각화
```

---

## 📝 참조 문서

각 단계별 상세 내용은 `plans/` 폴더의 문서 참조:

- 요구사항: `plans/01_requirements.md`
- 기술 결정: `plans/02_tech_decisions.md`
- API 스펙: `plans/03_api_spec.md`
- 데이터 모델: `plans/04_data_models.md`
- UI 설계: `plans/05_ui_design.md`
- 보안: `plans/06_security.md`
- 테스트: `plans/07_testing.md`
- DevOps: `plans/08_devops.md`
