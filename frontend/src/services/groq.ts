/**
 * xAI Grok API - AI 튜터
 * https://x.ai
 */

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const API_KEY = import.meta.env.VITE_XAI_API_KEY || '';

// Grok 모델
const MODEL = 'grok-3-mini-beta';

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
→ "저는 C 언어와 OS 튜터라서 날씨는 모르지만, 포인터나 메모리 관련 질문은 환영해요! 😊"`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function askAI(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  // API 키 체크
  if (!API_KEY) {
    return '⚠️ VITE_XAI_API_KEY가 설정되지 않았습니다.\n.env 파일에 API 키를 추가하세요.\n\nxAI API: https://x.ai';
  }

  // 메시지 구성
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6), // 최근 6개만 (토큰 절약)
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch(XAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      return `API 오류 (${response.status}): ${errorMsg}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '응답을 받지 못했습니다.';
  } catch (error) {
    return `네트워크 오류: ${error instanceof Error ? error.message : 'Unknown'}`;
  }
}
