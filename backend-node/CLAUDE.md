# 테스트케이스 생성 작업 지침

## 작업 목표
`pending-problems.json`의 문제들에 대해 C언어 모범답안과 테스트케이스를 생성하여 `testcases-queue.json`에 저장

## 파일 구조
```
backend-node/
├── data/
│   ├── pending-problems.json   # 작업 대상 (읽기)
│   └── testcases-queue.json    # 결과 저장 (쓰기)
└── prisma/
    └── dev.db                  # SQLite DB (import-tc가 저장)
```

## 작업 흐름

### 1. 문제 선택
```python
# pending-problems.json에서 첫 번째 문제 선택
with open('data/pending-problems.json') as f:
    data = json.load(f)
problem = data['problems'][0]  # 순차 처리
```

### 2. 백준에서 문제 정보 크롤링
```
https://www.acmicpc.net/problem/{number}
```
- 입력/출력 형식
- 예제 입출력
- 제한 조건

### 3. 테스트케이스 생성
- C언어 모범답안 작성
- 테스트케이스 5개 생성 (예제 포함)
- 엣지케이스 고려

### 4. 결과 저장
```json
// testcases-queue.json
{
  "1330": {
    "testCases": [
      {"input": "1 2", "output": "<"},
      {"input": "10 10", "output": "=="}
    ]
  }
}
```

### 5. 완료 후
- pending-problems.json에서 해당 문제 제거
- 다음 문제로 이동

## 주의사항
- GMP 필요한 큰 수 문제는 스킵 (note 추가)
- 컴파일 에러 나는 코드 금지
- 테스트케이스 output은 정확해야 함

## 실행 명령
```bash
# 다른 터미널에서 import-tc:watch 실행
cd backend-node && npm run import-tc:watch
```
