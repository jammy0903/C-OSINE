import { useState, useRef, useEffect } from 'react';
import { useStore } from '../stores/store';
import { askAI } from '../services/ollama';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Trash2, Sparkles, ChevronRight } from 'lucide-react';

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
    <div className="flex flex-col h-full rounded-xl overflow-hidden">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto py-12">
            {/* Hero */}
            <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">AI Tutor</h2>
            <p className="text-muted-foreground text-sm mb-8 text-center">
              Ask questions about C programming and operating systems
            </p>

            {/* Suggestions */}
            <div className="grid grid-cols-1 gap-2 w-full">
              {suggestions.map(({ icon, text }) => (
                <Card
                  key={text}
                  className="cursor-pointer hover:border-primary/50 transition-all group"
                  onClick={() => setInput(text)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-base">{icon}</span>
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                      {text}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  {/* Avatar & Label */}
                  <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <Badge
                      variant={msg.role === 'user' ? 'default' : 'secondary'}
                      className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-medium"
                    >
                      {msg.role === 'user' ? 'U' : 'AI'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {msg.role === 'user' ? 'You' : 'AI Tutor'}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <Card className={`${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : ''
                  }`}>
                    <CardContent className="p-3">
                      <MessageContent content={msg.content} isUser={msg.role === 'user'} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}

            {isAiLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-medium">
                      AI
                    </Badge>
                    <span className="text-xs text-muted-foreground">AI Tutor</span>
                  </div>
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-muted-foreground text-sm">Thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-4 py-3 bg-card shrink-0">
        <div className="max-w-3xl mx-auto">
          <Card className="p-2">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about C or OS..."
                aria-label="Chat message input"
                className="flex-1 border-0 bg-transparent px-2 py-1.5 resize-none text-sm focus-visible:ring-0 min-h-[36px] max-h-[100px]"
                rows={1}
                disabled={isAiLoading}
              />
              <div className="flex items-center gap-2 shrink-0">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearMessages}
                    aria-label="Clear chat history"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={isAiLoading || !input.trim()}
                  aria-label="Send message"
                >
                  {isAiLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`whitespace-pre-wrap leading-relaxed text-sm ${isUser ? '' : 'text-muted-foreground'}`}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, lang, code] = match;
            return (
              <Card key={i} className="my-3 overflow-hidden">
                {lang && (
                  <div className="px-3 py-1.5 bg-muted border-b">
                    <span className="text-xs text-muted-foreground font-mono">{lang}</span>
                  </div>
                )}
                <pre className="p-3 bg-background text-muted-foreground text-sm overflow-x-auto">
                  <code className="font-mono">{code.trim()}</code>
                </pre>
              </Card>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
