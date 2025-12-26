# COSLAB 세션 상태

> 마지막 업데이트: 2024-12-13

---

## 📂 브랜치 구조

```
main              ← 데스크탑 개발용 / 프론트엔드 중심
│
└── oracle-vps    ← Oracle Cloud 배포용 / GDB 백엔드
```

---

## 🔵 main 브랜치 (현재)

### 완료된 것
- ✅ React + Vite + TypeScript 프로젝트
- ✅ Tailwind CSS 스타일링
- ✅ Zustand 상태관리
- ✅ Chat 컴포넌트 (Groq AI 튜터)
- ✅ CodeEditor 컴포넌트 (Judge0 C 실행)
- ✅ 기본 MemoryViz (수동 malloc 시뮬레이터 - 삭제 예정)

### 진행 중
- 🔄 API 설계 (프론트-백엔드 인터페이스)
- 🔄 커리큘럼 설계 (CURRICULUM.md)

### 해야 할 것
- [ ] 수동 malloc 시뮬레이터 삭제
- [ ] 새 MemoryViz 컴포넌트 설계
- [ ] 백엔드 API 타입 정의
- [ ] 프론트엔드 서비스 함수 작성

### 파일 구조
```
main/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.tsx         ✅ Groq AI
│   │   │   ├── CodeEditor.tsx   ✅ Judge0
│   │   │   └── MemoryViz.tsx    ⚠️ 재설계 필요
│   │   ├── services/
│   │   │   ├── groq.ts          ✅
│   │   │   └── judge0.ts        ✅
│   │   ├── stores/
│   │   │   └── store.ts         ✅ Zustand
│   │   └── types.ts             ✅
│   └── .env.example
│
├── backend/
│   ├── main.py                  ✅ FastAPI
│   ├── tracer.py                ⚠️ GDB (Termux에서 안됨)
│   └── Dockerfile
│
├── CURRICULUM.md                ✅ 학습 목차
├── SESSION_STATUS.md            ✅ 이 파일
└── .gitignore
```

---

## 🟠 oracle-vps 브랜치

### 완료된 것
- ✅ Docker Compose 설정
- ✅ 백엔드 Dockerfile (GDB + ptrace)
- ✅ 프론트엔드 Dockerfile (nginx)
- ✅ nginx 리버스 프록시
- ✅ 새 MemoryViz UI (GDB 연동)
- ✅ tracer API 서비스

### Oracle Cloud 상태
- ✅ VM 생성됨: `instance-20251213`
- ✅ Public IP: `146.56.105.189`
- ✅ Ubuntu 24.04 Minimal
- ✅ VCN, Subnet, Internet Gateway 설정
- ⏳ Docker 설치 중 (apt lock 문제 있었음)

### SSH 접속 정보
```bash
# Cloud Shell에서:
ssh -i cosine-ssh.key ubuntu@146.56.105.189

# 로컬에서:
ssh -i .secrets/oracle-cosine.key ubuntu@146.56.105.189
```

### 해야 할 것
- [ ] Docker 설치 완료
- [ ] docker-compose up 실행
- [ ] GDB 트레이서 테스트
- [ ] 프론트엔드 배포 확인

---

## 📋 API 설계 (공통)

### 엔드포인트
```
POST /api/trace     - C 코드 실행 + 메모리 추적
GET  /api/health    - 상태 체크
GET  /api/examples  - 예제 코드 목록
```

### 데이터 타입
```typescript
interface TraceResult {
  success: boolean;
  steps: Step[];
  sourceLines: string[];
  error?: string;
}

interface Step {
  line: number;
  code: string;
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  registers?: { rsp: string; rbp: string; };
}

interface MemoryBlock {
  name: string;        // "x", "ptr"
  address: string;     // "0x7fff1234"
  type: string;        // "int", "int*"
  size: number;        // 4, 8
  bytes: number[];     // [0x05, 0x00, 0x00, 0x00]
  value: string;       // "5"
  pointsTo?: string;   // 포인터가 가리키는 주소
}
```

---

## 🔑 시크릿 파일 위치

```
.secrets/                    ← git 무시됨
├── oracle-cosine.key        ← Oracle SSH 키
└── tls/                     ← (나중에) TLS 인증서
```

---

## 🎯 다음 세션에서 할 것

### 옵션 A: Oracle VPS 계속
1. Cloud Shell에서 Docker 설치 완료
2. 프로젝트 클론 & docker-compose up
3. GDB 트레이서 테스트

### 옵션 B: main 프론트엔드 개발
1. 새 MemoryViz 컴포넌트 설계
2. 바이트 박스 시각화
3. 포인터 화살표 구현

### 옵션 C: API 설계 상세화
1. 예제 코드 목록 정의
2. 에러 처리 설계
3. 타입 정의 파일 작성

---

## 📞 연락처 / 계정

- GitHub: jammy0903
- Repo: https://github.com/jammy0903/C-OSINE
- Oracle Cloud: fuso93 (ap-chuncheon-1 리전)
