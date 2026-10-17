import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Languages, 
  Mic, 
  MicOff, 
  Cpu, 
  UserCog,
  Loader2
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatbotProps {
  district: string;
  weatherInfo?: string;
}

const PRESET_QUESTIONS = [
  {
    title: '🌾 Kharif Crop Advisory',
    prompt: 'What are the top recommended crops for medium-deep black soil in Dharwad with moderate monsoon rainfall?'
  },
  {
    title: '🐛 Organic Pest Remedy',
    prompt: 'What is the natural organic treatment for sucking pests and leaf curl in Byadgi chillies?'
  },
  {
    title: '🧪 N-P-K Fertilizer Schedule',
    prompt: 'How to calculate the optimal N-P-K fertilizer split application for Sugarcane in North Karnataka?'
  },
  {
    title: '💰 APMC Market Timing',
    prompt: 'What is the best selling time and MSP support price outlook for cotton and jowar in Hubballi mandi?'
  }
];

export const Chatbot: React.FC<ChatbotProps> = ({ district, weatherInfo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Namaskara! 🙏 I am your **NammaKrushi AI Farming Advisor** (ನಮ್ಮ ಕೃಷಿ AI), integrated with Gemini.\n\nI am configured for **${district}, Karnataka** with multi-turn agronomic context. You can type or use the **microphone button** to transcribe your speech with **gemini-3.5-transcribe**!`,
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [language, setLanguage] = useState<'English' | 'Kannada Terms' | 'Hindi'>('English');
  
  // Model selection (gemini-3.8-flash for general, gemini-3.1-flash-lite for fast)
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  
  // Role selection
  const [selectedRole, setSelectedRole] = useState<'General Agronomist' | 'Soil Chemist & NPK Specialist' | 'Plant Pathologist & Disease Doctor' | 'APMC Market & Mandi Economist'>('General Agronomist');

  // Audio recording state for gemini-3.5-transcribe
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`]/g, '').slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.debug('Speech synthesis error', e);
    }
  };

  // Start microphone recording for gemini-3.5-transcribe
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone permissions to record and transcribe audio.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send audio to /api/transcribe_audio using gemini-3.5-transcribe
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const res = await fetch('/api/transcribe_audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: 'audio/webm'
          })
        });
        const data = await res.json();
        if (data.success && data.text) {
          setInput(data.text);
        }
        setIsTranscribing(false);
      };
    } catch (e) {
      console.error(e);
      setIsTranscribing(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/climate_smart_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          region: `${district}, Karnataka`,
          weatherContext: weatherInfo || '28°C, 66% RH, normal Kharif season',
          soilType: 'Deccan Black Cotton Soil & Red Sandy Loam',
          language: language,
          model: selectedModel,
          role: selectedRole,
          history: messages.slice(-8)
        })
      });

      const data = await res.json();
      const reply = data.reply || 'I could not generate a response. Please check your query.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      speakText(reply);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'model',
          content: '⚠️ Failed to connect to server. Please ensure the backend is active and retry.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        content: `Chat cleared! Ready for new farming queries for **${district}**.`,
        timestamp: 'Just now'
      }
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      
      {/* Chat Top Header */}
      <div className="bg-emerald-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-emerald-200 shadow-inner">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white">NammaKrushi AI Chatbot</h2>
              <span className="text-[11px] font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                {selectedModel}
              </span>
            </div>
            <p className="text-xs text-emerald-200">
              Role: <strong>{selectedRole}</strong> • Multi-turn Agronomic Memory
            </p>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Model Selector */}
          <div className="flex items-center gap-1 bg-emerald-800/90 px-2.5 py-1 rounded-lg border border-emerald-700">
            <Cpu className="w-3.5 h-3.5 text-emerald-300" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="bg-transparent text-white font-semibold focus:outline-hidden text-xs cursor-pointer"
            >
              <option value="gemini-3.8-flash" className="text-stone-900">gemini-3.8-flash (General)</option>
              <option value="gemini-3.1-flash-lite" className="text-stone-900">gemini-3.1-flash-lite (Fast)</option>
            </select>
          </div>

          {/* Role Preset Selector */}
          <div className="flex items-center gap-1 bg-emerald-800/90 px-2.5 py-1 rounded-lg border border-emerald-700">
            <UserCog className="w-3.5 h-3.5 text-emerald-300" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="bg-transparent text-white font-semibold focus:outline-hidden text-xs cursor-pointer max-w-[150px] truncate"
            >
              <option value="General Agronomist" className="text-stone-900">General Agronomist</option>
              <option value="Soil Chemist & NPK Specialist" className="text-stone-900">Soil & Fertilizer Chemist</option>
              <option value="Plant Pathologist & Disease Doctor" className="text-stone-900">Pest & Disease Doctor</option>
              <option value="APMC Market & Mandi Economist" className="text-stone-900">APMC Market Economist</option>
            </select>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-emerald-800/90 px-2 py-1 rounded-lg border border-emerald-700">
            <Languages className="w-3.5 h-3.5 text-emerald-300" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-white font-semibold focus:outline-hidden text-xs cursor-pointer"
            >
              <option value="English" className="text-stone-900">English</option>
              <option value="Kannada Terms" className="text-stone-900">Kannada (ಕನ್ನಡ)</option>
              <option value="Hindi" className="text-stone-900">Hindi</option>
            </select>
          </div>

          {/* Voice Output Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 ${
              voiceEnabled ? 'bg-emerald-600 text-white' : 'bg-emerald-800/60 text-emerald-300 hover:text-white'
            }`}
            title="Toggle Voice Readout"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Clear Button */}
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg text-xs bg-emerald-800/60 text-emerald-300 hover:text-white transition cursor-pointer"
            title="Clear Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Container (Scrollable Thread) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                  isUser
                    ? 'bg-stone-900 text-white'
                    : 'bg-emerald-700 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`rounded-2xl p-4 text-sm relative group leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-stone-900 text-white rounded-tr-xs'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {msg.content}
                </div>

                <div className={`flex items-center justify-between mt-2 pt-1 border-t text-[11px] ${
                  isUser ? 'border-stone-800 text-stone-400' : 'border-stone-100 text-stone-400'
                }`}>
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-stone-700 cursor-pointer flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-4 text-sm text-stone-600 shadow-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Analyzing agronomic parameters with {selectedModel}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Prompts Chips */}
      <div className="p-2.5 bg-white border-t border-stone-200 flex gap-2 overflow-x-auto scrollbar-none text-xs">
        <span className="text-stone-400 font-semibold flex items-center shrink-0 pl-1 text-[11px]">
          Quick Topics:
        </span>
        {PRESET_QUESTIONS.map((pq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(pq.prompt)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-stone-200 text-stone-700 whitespace-nowrap transition cursor-pointer text-xs font-medium disabled:opacity-50"
          >
            {pq.title}
          </button>
        ))}
      </div>

      {/* Input Form with Audio Transcription (gemini-3.5-transcribe) */}
      <div className="p-3.5 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Audio Recording / Transcription Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
            className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center shadow-xs ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 border border-stone-300'
            }`}
            title={isRecording ? 'Click to stop and transcribe' : 'Record voice note (gemini-3.5-transcribe)'}
          >
            {isTranscribing ? (
              <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isRecording
                ? '🔴 Recording your voice... Speak now...'
                : isTranscribing
                ? 'Transcribing audio using gemini-3.5-transcribe...'
                : 'Ask questions or tap microphone to speak...'
            }
            disabled={loading || isTranscribing}
            className="flex-1 bg-stone-50 border border-stone-300 focus:border-emerald-600 focus:bg-white rounded-xl px-4 py-3 text-sm focus:outline-hidden transition"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading || isTranscribing}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white p-3 rounded-xl transition cursor-pointer shadow-xs disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
