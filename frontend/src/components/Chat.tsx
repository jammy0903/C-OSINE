import { useState, useRef, useEffect } from 'react';
import { useStore } from '../stores/store';
import { askAI } from '../services/ollama';
import { Button } from './ui';

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
    { icon: '🔗', text: 'What is a pointer?' },
    { icon: '📦', text: 'Explain malloc and free' },
    { icon: '⚡', text: 'Process vs Thread' },
  ];

  return (
    <div className="flex flex-col h-full bg-bg rounded-xl overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto">
            {/* Hero */}
            <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
              <svg width="28" height="28" className="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text mb-2">AI Tutor</h2>
            <p className="text-text-secondary text-sm mb-8 text-center">
              Ask questions about C programming and operating systems
            </p>

            {/* Suggestions */}
            <div className="grid grid-cols-1 gap-2 w-full">
              {suggestions.map(({ icon, text }) => (
                <button
                  key={text}
                  onClick={() => setInput(text)}
                  className="flex items-center gap-3 px-4 py-3 bg-bg-elevated rounded-lg border border-border hover:border-primary/50 transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-base">{icon}</span>
                  </div>
                  <span className="text-sm text-text-secondary group-hover:text-text transition-colors">
                    {text}
                  </span>
                  <svg width="14" height="14" className="text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  {/* Avatar & Label */}
                  <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-info/15 text-info'
                    }`}>
                      {msg.role === 'user' ? 'U' : 'AI'}
                    </div>
                    <span className="text-xs text-text-muted">
                      {msg.role === 'user' ? 'You' : 'AI Tutor'}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className={`rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-bg-elevated border border-border text-text rounded-tl-sm'
                  }`}>
                    <MessageContent content={msg.content} isUser={msg.role === 'user'} />
                  </div>
                </div>
              </div>
            ))}

            {isAiLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-info/15 text-info flex items-center justify-center text-xs font-medium">
                      AI
                    </div>
                    <span className="text-xs text-text-muted">AI Tutor</span>
                  </div>
                  <div className="bg-bg-elevated border border-border rounded-xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-text-secondary text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3 bg-bg-elevated shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-bg rounded-xl border border-border focus-within:border-primary transition-colors p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about C or OS..."
              className="flex-1 bg-transparent px-2 py-1.5 resize-none text-sm text-text placeholder-text-muted focus:outline-none min-h-[36px] max-h-[100px]"
              rows={1}
              disabled={isAiLoading}
            />
            <div className="flex items-center gap-2 shrink-0">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                >
                  Clear
                </Button>
              )}
              <Button
                onClick={handleSend}
                disabled={isAiLoading || !input.trim()}
                loading={isAiLoading}
                size="sm"
                icon={
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                }
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`whitespace-pre-wrap leading-relaxed text-sm ${isUser ? '' : 'text-text-secondary'}`}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, lang, code] = match;
            return (
              <div key={i} className="my-3 rounded-lg overflow-hidden border border-border">
                {lang && (
                  <div className="px-3 py-1.5 bg-bg-tertiary border-b border-border">
                    <span className="text-xs text-text-muted font-mono">{lang}</span>
                  </div>
                )}
                <pre className="p-3 bg-bg text-text-secondary text-sm overflow-x-auto">
                  <code className="font-mono">{code.trim()}</code>
                </pre>
              </div>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
