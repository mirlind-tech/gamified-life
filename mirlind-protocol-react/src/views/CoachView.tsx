import { useState, useRef, useEffect } from 'react';
import { EMOJIS } from '../utils/emojis';
import { useGame } from '../store/useGame';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function CoachView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Greetings, seeker of mastery. I am your AI Protocol Coach. Share your challenges, your goals, or your doubts. I shall guide you on the path to becoming your strongest self.',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { trackActivity } = useGame();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    trackActivity('aiCoachChats', 1);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'Discipline is the bridge between goals and accomplishment. What specific action will you take today?',
        'Remember: The pain of discipline is far less than the pain of regret. Push through.',
        'Excellence is not a destination but a continuous journey. How can I help you stay on track?',
        'Your habits shape your identity. Focus on becoming the type of person who never misses.',
        'Deep work requires deep rest. Have you scheduled your recovery periods?',
      ];
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-slide-up">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {EMOJIS.COACH} AI Protocol Coach
        </h2>
        <p className="text-text-secondary">Your guide to mastery and discipline</p>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div 
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${message.role === 'assistant' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'bg-accent-cyan/20 text-accent-cyan'
                }
              `}>
                {message.role === 'assistant' ? EMOJIS.COACH : EMOJIS.USER}
              </div>
              <div className={`
                max-w-[80%] rounded-2xl px-4 py-3
                ${message.role === 'assistant'
                  ? 'bg-bg-secondary text-text-primary rounded-tl-sm'
                  : 'bg-accent-purple text-white rounded-tr-sm'
                }
              `}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className={`
                  text-xs mt-1 block
                  ${message.role === 'assistant' ? 'text-text-muted' : 'text-white/60'}
                `}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-purple/20 text-accent-purple flex items-center justify-center">
                {EMOJIS.COACH}
              </div>
              <div className="bg-bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-bg-secondary/30">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach for guidance..."
              className="flex-1 px-4 py-3 bg-black/30 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {EMOJIS.SEND}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
