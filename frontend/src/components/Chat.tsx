import { useState, useRef, useEffect } from 'react';
import { useStore } from '../stores/store';
import { askAI } from '../services/groq';

export function Chat() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isAiLoading, addMessage, setAiLoading, clearMessages } = useStore();

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isAiLoading) return;

    // 사용자 메시지 추가
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: trimmed,
    };
    addMessage(userMsg);
    setInput('');
    setAiLoading(true);

    try {
      // AI 응답 요청
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const response = await askAI(trimmed, history);

      // AI 메시지 추가
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
      });
    } catch (error) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '오류가 발생했습니다. 다시 시도해주세요.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">👋 안녕하세요!</p>
            <p>C 언어나 운영체제에 대해 질문해보세요.</p>
            <div className="mt-4 space-y-2">
              <SuggestedQuestion onClick={setInput}>포인터가 뭐야?</SuggestedQuestion>
              <SuggestedQuestion onClick={setInput}>malloc과 free 설명해줘</SuggestedQuestion>
              <SuggestedQuestion onClick={setInput}>프로세스와 스레드 차이</SuggestedQuestion>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <MessageContent content={msg.content} />
            </div>
          </div>
        ))}

        {isAiLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-4 py-2 text-gray-400">
              <span className="animate-pulse">생각 중...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하세요... (Enter로 전송)"
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 resize-none focus:outline-none focus:border-blue-500"
            rows={2}
            disabled={isAiLoading}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSend}
              disabled={isAiLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              전송
            </button>
            <button
              onClick={clearMessages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 제안 질문 버튼
function SuggestedQuestion({
  children,
  onClick,
}: {
  children: string;
  onClick: (text: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(children)}
      className="block mx-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors"
    >
      {children}
    </button>
  );
}

// 메시지 내용 (코드 블록 처리)
function MessageContent({ content }: { content: string }) {
  // 코드 블록 분리
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          // 코드 블록
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, , code] = match;
            return (
              <pre
                key={i}
                className="my-2 p-3 bg-gray-900 rounded-lg overflow-x-auto text-sm"
              >
                <code>{code.trim()}</code>
              </pre>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
