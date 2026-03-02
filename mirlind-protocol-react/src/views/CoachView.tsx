import { useState, useRef, useEffect } from 'react';
import { EMOJIS } from '../utils/emojis';
import { useGame } from '../store/useGame';
import {
  applyCoachActions,
  generateCoachActions,
  getCoachActionHistory,
  sendCoachMessage,
  type CoachActionDomain,
  type CoachActionItem,
} from '../services/coachApi';
import { aiCoreRagQuery, aiCoreTranscribe, aiCoreUpsertMemory } from '../services/aiCoreApi';
import { useAuth } from '../contexts/useAuth';
import { logger } from '../utils/logger';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type CoachInferenceMode = 'legacy' | 'local';

const DOMAIN_OPTION_STYLE = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
};

export function CoachView() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Report your objective, obstacle, and time limit. I will return a cold execution path and the next action to take now.',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionIntent, setActionIntent] = useState('');
  const [actionDomain, setActionDomain] = useState<CoachActionDomain>('career');
  const [generatedActions, setGeneratedActions] = useState<CoachActionItem[]>([]);
  const [actionRunId, setActionRunId] = useState<number | null>(null);
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  const [isApplyingActions, setIsApplyingActions] = useState(false);
  const [inferenceMode, setInferenceMode] = useState<CoachInferenceMode>('local');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastAppliedSummary, setLastAppliedSummary] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { trackActivity, showToast } = useGame();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getCoachActionHistory().catch((error) => logger.error('Failed to load coach action history:', error));
  }, [isAuthenticated]);

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

    try {
      const history = messages
        .slice(-10)
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      let reply: string;
      if (inferenceMode === 'local') {
        const ragResponse = await aiCoreRagQuery({
          question: userMsg.content,
          limit: 6,
        });
        reply = ragResponse.answer;

        void aiCoreUpsertMemory({
          text: userMsg.content,
          metadata: {
            source: 'coach_chat',
            mode: 'local_rag',
          },
        }).catch((error) => logger.error('Failed to upsert memory:', error));
      } else {
        const response = await sendCoachMessage(userMsg.content, history);
        reply = response.reply;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      logger.error('Coach request failed:', err);
      showToast(
        inferenceMode === 'local'
          ? 'Local AI core is unavailable. Check Ollama/Qdrant/Whisper services.'
          : 'Coach is temporarily unavailable. Try again shortly.',
        'warning',
        3000
      );
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Service is temporarily unavailable. Take one concrete action now and message me again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const data = typeof reader.result === 'string' ? reader.result : '';
        const base64 = data.includes(',') ? data.split(',')[1] : data;
        if (!base64) {
          reject(new Error('Could not read audio file'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsDataURL(file);
    });
  };

  const handleVoiceFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isTranscribing) return;

    setIsTranscribing(true);
    try {
      const audioBase64 = await fileToBase64(file);
      const result = await aiCoreTranscribe({
        audioBase64,
        language: 'en',
        prompt: 'Transcribe user voice note for task planning and coaching.',
      });
      setInput((previous) => (previous.trim() ? `${previous} ${result.text}` : result.text));
      showToast('Voice note transcribed with Whisper', 'success', 2500);
    } catch (error) {
      logger.error('Whisper transcription failed:', error);
      showToast('Could not transcribe voice note', 'error', 2500);
    } finally {
      setIsTranscribing(false);
      event.target.value = '';
    }
  };

  const openVoicePicker = () => {
    fileInputRef.current?.click();
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

  const handleGenerateActions = async () => {
    if (!actionIntent.trim() || isGeneratingActions) return;
    setIsGeneratingActions(true);
    try {
      const response = await generateCoachActions(actionIntent.trim(), actionDomain);
      setGeneratedActions(response.actions);
      setActionRunId(response.runId);
      setLastAppliedSummary('');
      showToast('AI action plan generated', 'success');
    } catch (error) {
      logger.error('Failed to generate AI actions:', error);
      showToast('Could not generate AI action plan', 'error');
    } finally {
      setIsGeneratingActions(false);
    }
  };

  const handleApplyActions = async () => {
    if (!generatedActions.length || isApplyingActions) return;
    setIsApplyingActions(true);
    try {
      const response = await applyCoachActions({
        runId: actionRunId ?? undefined,
        actions: actionRunId ? undefined : generatedActions,
      });
      const capCount = response.applied.financeCaps.length;
      const summary = `Applied ${response.applied.actions.length} actions, ${response.applied.objectives.length} objectives${capCount ? `, ${capCount} finance cap(s)` : ''}.`;
      setLastAppliedSummary(summary);
      showToast('AI actions applied to your plan', 'success');
    } catch (error) {
      logger.error('Failed to apply AI actions:', error);
      showToast('Could not apply AI actions', 'error');
    } finally {
      setIsApplyingActions(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-slide-up">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-text-primary mb-2 neon-text">
          {EMOJIS.COACH} AI Protocol Coach
        </h2>
        <p className="text-text-secondary">Your guide to mastery and discipline</p>
        <div className="mt-3 inline-flex rounded-xl border border-border bg-black/30 p-1 gap-1">
          <button
            onClick={() => setInferenceMode('local')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${inferenceMode === 'local' ? 'bg-accent-cyan-dark text-white' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Local AI Core
          </button>
          <button
            onClick={() => setInferenceMode('legacy')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${inferenceMode === 'legacy' ? 'bg-accent-purple-dark text-white' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Legacy Coach
          </button>
        </div>
      </div>

      <div className="glass-card neon-panel rounded-2xl p-4 mb-4 border border-accent-cyan/30 bg-accent-cyan/5">
        <h3 className="text-lg font-semibold text-text-primary mb-2">AI Action Mode</h3>
        <p className="text-xs text-text-secondary mb-3">
          Generate concrete actions and apply them directly to weekly objectives, daily actions, and finance caps.
        </p>
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-2">
          <input
            value={actionIntent}
            onChange={(e) => setActionIntent(e.target.value)}
            placeholder="Example: rebalance my week for job interviews and gym consistency"
            className="px-3 py-2 rounded-lg bg-black/30 border border-border text-text-primary"
          />
          <select
            value={actionDomain}
            onChange={(e) => setActionDomain(e.target.value as CoachActionDomain)}
            className="cyber-select px-3 py-2 rounded-lg text-slate-100"
          >
            <option value="career" style={DOMAIN_OPTION_STYLE}>Career</option>
            <option value="body" style={DOMAIN_OPTION_STYLE}>Body</option>
            <option value="mind" style={DOMAIN_OPTION_STYLE}>Mind</option>
            <option value="finance" style={DOMAIN_OPTION_STYLE}>Finance</option>
            <option value="german" style={DOMAIN_OPTION_STYLE}>German</option>
            <option value="custom" style={DOMAIN_OPTION_STYLE}>Custom</option>
          </select>
          <button
            onClick={handleGenerateActions}
            disabled={isGeneratingActions || !actionIntent.trim()}
            className="px-4 py-2 rounded-lg bg-accent-cyan-dark text-white hover:bg-accent-cyan-dark/80 disabled:opacity-60"
          >
            {isGeneratingActions ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {generatedActions.length > 0 && (
          <div className="mt-3 space-y-2">
            {generatedActions.map((action, idx) => (
              <div key={`${action.title}-${idx}`} className="rounded-lg border border-border bg-bg-secondary/30 p-3">
                <p className="text-sm font-semibold text-text-primary">{action.title}</p>
                <p className="text-xs text-text-muted">
                  {action.domain.toUpperCase()} • {action.objectiveTitle} • {action.minutes}m • target {action.targetCount}
                </p>
                {action.reason && <p className="text-xs text-text-secondary mt-1">{action.reason}</p>}
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={handleApplyActions}
                disabled={isApplyingActions}
                className="px-3 py-2 rounded-lg bg-accent-green text-black font-semibold disabled:opacity-60"
              >
                {isApplyingActions ? 'Applying...' : 'Apply To Plan'}
              </button>
            </div>
          </div>
        )}

        {lastAppliedSummary && (
          <p className="mt-2 text-xs text-accent-green">{lastAppliedSummary}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 glass-card neon-panel rounded-2xl overflow-hidden flex flex-col">
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
                  : 'bg-accent-purple-dark text-white rounded-tr-sm'
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
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleVoiceFileSelected}
            />
            <button
              onClick={openVoicePicker}
              disabled={isTranscribing}
              className="px-3 py-3 bg-accent-cyan-dark/70 hover:bg-accent-cyan-dark disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              title="Transcribe voice note with Whisper"
            >
              {isTranscribing ? '...' : 'Whisper'}
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inferenceMode === 'local' ? 'Ask your local AI core...' : 'Ask your coach for guidance...'}
              className="flex-1 px-4 py-3 bg-black/30 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-accent-purple-dark hover:bg-accent-purple-dark/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {EMOJIS.SEND}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
