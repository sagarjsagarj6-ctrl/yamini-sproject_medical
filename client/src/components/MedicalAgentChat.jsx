import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  Stethoscope,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export default function MedicalAgentChat({ role = 'PATIENT', userName = 'User' }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiveAI, setIsLiveAI] = useState(false);
  const messagesEndRef = useRef(null);

  const patientSuggestions = [
    '🩺 Which doctor should I book an appointment with?',
    '📊 What is my current health condition & recovery status?',
    '💊 Check my active medicine dosages & food rules',
    '⚠️ Are my reported symptoms safe or critical?'
  ];

  const doctorSuggestions = [
    '⚠️ Which patients require immediate reassessment?',
    '📊 Summarize active patient adherence and symptoms',
    '💊 Drug safety review and treatment completion status'
  ];

  const suggestions = role === 'PATIENT' ? patientSuggestions : doctorSuggestions;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

  const sendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput('');
    setIsExpanded(true);

    const userMessage = { role: 'user', content: text, time: new Date() };
    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: text,
        history: currentHistory.map((m) => ({ role: m.role, content: m.content }))
      });

      setIsLiveAI(Boolean(response.data.isLiveAI));
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.reply,
          isLiveAI: response.data.isLiveAI,
          model: response.data.model,
          time: new Date()
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            error.response?.data?.message ||
            'I encountered an issue retrieving medical context. Please verify your connection or server configuration.',
          isError: true,
          time: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setIsExpanded(false);
  };

  return (
    <div className="rounded-3xl border border-brand-200/90 bg-gradient-to-r from-white via-cyan-50/25 to-emerald-50/30 p-4 sm:p-5 shadow-sm transition-all">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                {role === 'PATIENT' ? 'Personal Medical AI Agent' : 'Clinical Decision Support Agent'}
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isLiveAI
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-brand-50 text-brand-700 border border-brand-200/60'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isLiveAI ? 'bg-emerald-600 animate-pulse' : 'bg-brand-600'}`} />
                {isLiveAI ? 'Live Cloud LLM' : 'Grounded RAG Agent'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {role === 'PATIENT'
                ? 'Internal data grounding: your medical history, symptoms, medicines, and doctor recommendations'
                : 'Internal practice grounding: patient symptoms, severe risk alerts, and adherence trends'}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> <span>Show ({messages.length})</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={clearChat}
              className="rounded-xl border border-slate-200 bg-white p-1 text-slate-400 hover:text-slate-700"
              title="Clear conversation"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Conversation Area */}
      {isExpanded && messages.length > 0 && (
        <div className="mt-4 max-h-72 overflow-y-auto space-y-3 pr-1 animate-fade-in">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white text-xs shadow-xs mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-tr-sm shadow-sm'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-sm shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-line font-sans">{msg.content}</div>
                  <div
                    className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${
                      isUser ? 'text-brand-100' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {!isUser && msg.isLiveAI && (
                      <span className="text-emerald-600 font-semibold">· AI Live</span>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700 text-xs shadow-xs mt-1">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-slate-500 bg-white/70 p-3 rounded-2xl border border-slate-200/60 w-fit">
              <Sparkles className="h-4 w-4 text-brand-600 animate-spin" />
              <span>Analyzing internal records and generating medical guidance…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Quick Suggestion Chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={loading}
            onClick={() => sendMessage(suggestion)}
            className="rounded-full border border-slate-200/90 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-2xs transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Main Chat Input Bar */}
      <div className="mt-3 relative flex items-center">
        <input
          type="text"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            role === 'PATIENT'
              ? 'Ask your medical agent (e.g. Which doctor should I visit? What are my dose rules?)'
              : 'Ask clinical intelligence agent (e.g. Patient risk evaluation, contraindications, guidelines)'
          }
          className="w-full rounded-2xl border border-slate-300/80 bg-white py-3 pl-4 pr-12 text-xs text-slate-900 shadow-inner placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50"
        />
        <button
          type="button"
          disabled={!input.trim() || loading}
          onClick={() => sendMessage()}
          className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 active:scale-95"
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
