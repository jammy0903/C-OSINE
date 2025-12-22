import { useState, useRef, useEffect } from 'react';
import { useStore } from '../stores/store';
import { askAI } from '../services/groq';

export function Chat() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isAiLoading, addMessage, setAiLoading, clearMessages } = useStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isAiLoading) return;

    addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    });
    setInput('');
    setAiLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await askAI(trimmed, history);
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
      });
    } catch {
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Error occurred. Please try again.',
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

  const suggestions = [
    'What is a pointer?',
    'Explain malloc and free',
    'Process vs Thread',
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <h2 className="font-title text-2xl font-light tracking-[0.2em] text-white mb-4">
              AI TUTOR
            </h2>
            <p className="font-body text-neutral-500 text-sm tracking-wide mb-12">
              Ask about C language or operating systems
            </p>
            <div className="flex flex-col gap-3">
              {suggestions.map((text) => (
                <button
                  key={text}
                  onClick={() => setInput(text)}
                  className="font-body px-6 py-3 border border-[#252525] text-neutral-400 text-sm tracking-wide hover:border-white hover:text-white transition-all duration-300"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((msg) => (
              <div key={msg.id} className={msg.role === 'user' ? 'text-right' : ''}>
                <span className="font-title text-neutral-600 text-xs tracking-[0.2em] uppercase mb-2 block">
                  {msg.role === 'user' ? 'YOU' : 'AI'}
                </span>
                <div className={`inline-block text-left max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-white text-black px-6 py-4'
                    : 'text-neutral-300'
                }`}>
                  <MessageContent content={msg.content} />
                </div>
              </div>
            ))}

            {isAiLoading && (
              <div>
                <span className="font-title text-neutral-600 text-xs tracking-[0.2em] uppercase mb-2 block">AI</span>
                <span className="font-body text-neutral-500 animate-pulse">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[#252525] px-8 py-6">
        <div className="max-w-3xl mx-auto flex gap-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="flex-1 bg-transparent border-b border-[#252525] px-0 py-3 resize-none focus:border-white transition-colors text-sm tracking-wide placeholder-neutral-600"
            rows={1}
            disabled={isAiLoading}
          />
          <button
            onClick={handleSend}
            disabled={isAiLoading || !input.trim()}
            className="font-title px-6 py-3 text-xs tracking-[0.2em] border border-[#252525] hover:border-white hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:border-[#252525] disabled:hover:bg-transparent disabled:hover:text-white transition-all duration-300"
          >
            SEND
          </button>
          <button
            onClick={clearMessages}
            className="font-title px-4 py-3 text-xs tracking-[0.15em] text-neutral-500 hover:text-white transition-colors duration-300"
          >
            CLEAR
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, , code] = match;
            return (
              <pre key={i} className="my-4 p-4 bg-[#111] text-neutral-300 text-sm overflow-x-auto">
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
