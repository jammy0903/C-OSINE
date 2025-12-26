/**
 * Ollama API - AI 튜터 (Qwen2.5-Coder:7b)
 * 100% 로컬, 무료
 */

import { env } from '../config/env';

const OLLAMA_URL = env.VITE_OLLAMA_URL;
const MODEL = env.VITE_OLLAMA_MODEL;

const SYSTEM_PROMPT = `당신은 C 언어와 운영체제(OS) 전문 튜터입니다.
이 플랫폼의 사용자는 C 프로그래밍과 OS를 배우러 온 학습자입니다.

## 핵심 원칙
모든 질문은 C/OS 학습 맥락에서 해석하세요:
- "이게 뭐야?" → C나 OS 관련 개념 질문으로 해석
- "왜 안돼?" → 코드 에러나 개념 이해 문제로 해석
- "어떻게 해?" → C 코드 작성법이나 OS 개념 적용 방법으로 해석
- 애매한 질문도 최대한 C/OS 맥락으로 연결해서 답변

## 답변 범위
✅ 답변함:
- C 문법, 포인터, 배열, 구조체, 메모리 관리
- malloc/free, 동적 메모리
- 운영체제 (프로세스, 스레드, 스케줄링, 페이징, 파일시스템)
- 컴파일러, 링커, 디버깅 개념
- 간단한 알고리즘 (C로 구현)

❌ 답변 안 함 (정중히 거절):
- C/OS와 전혀 관련 없는 질문 (요리, 여행, 연예인 등)
- 다른 프로그래밍 언어 (Python, JavaScript 등) → "여기선 C만 다뤄요"
- 숙제 전체 대신 풀어주기 → 힌트만 제공

## 답변 스타일
- 한국어로 답변
- 짧고 핵심적으로 (200단어 이내)
- 코드 예제는 \`\`\`c 블록 사용
- 초보자 눈높이에 맞춤
- 친근하지만 정확하게

## 예시
사용자: "포인터 뭐임"
→ 포인터 설명 (대충 물어봐도 이해하고 답변)

사용자: "이거 왜 안됨"
→ "어떤 코드가 안 되나요? 코드를 보여주시면 도움드릴게요!"

사용자: "오늘 날씨 어때?"
→ "저는 C 언어와 OS 튜터라서 날씨는 모르지만, 포인터나 메모리 관련 질문은 환영해요!"`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAI(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  // 메시지 구성 (Ollama 형식)
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6), // 최근 6개만 (메모리 절약)
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        options: {
          temperature: env.VITE_OLLAMA_TEMPERATURE,
          num_predict: env.VITE_OLLAMA_NUM_PREDICT,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return `⚠️ Ollama 서버에 연결할 수 없습니다.

1. Ollama 설치:
   curl -fsSL https://ollama.com/install.sh | sh

2. 모델 다운로드:
   ollama pull qwen2.5-coder:7b

3. 서버 실행:
   ollama serve`;
      }
      return `API 오류 (${response.status}): ${response.statusText}`;
    }

    const data = await response.json();
    return data.message?.content || '응답을 받지 못했습니다.';
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return `⚠️ Ollama 서버에 연결할 수 없습니다.

ollama serve 명령어로 서버를 실행해주세요.`;
    }
    return `네트워크 오류: ${error instanceof Error ? error.message : 'Unknown'}`;
  }
}
