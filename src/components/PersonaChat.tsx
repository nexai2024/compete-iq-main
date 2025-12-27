'use client';

import { useState, useEffect, useRef } from 'react';
import { DollarSign, Zap, Building2, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatting';

interface PersonaChatProps {
  analysisId: string;
  personas: Array<{
    id: string;
    personaType: 'price_sensitive' | 'power_user' | 'corporate_buyer';
    name: string;
    title: string;
    description: string;
    painPoints: unknown;
    priorities: unknown;
    behaviorProfile: string;
  }>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  createdAt: string;
  isStreaming?: boolean;
}

const personaTypeIcons = {
  price_sensitive: DollarSign,
  power_user: Zap,
  corporate_buyer: Building2,
};

export function PersonaChat({ analysisId, personas }: PersonaChatProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(personas[0]?.id || '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPersonaDetails, setShowPersonaDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message with SSE streaming
  const sendMessage = async (message: string) => {
    if (!message.trim() || isStreaming) return;

    setIsStreaming(true);
    setError(null);

    // Add user message to UI
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      message,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Create empty assistant message
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      message: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch(
        `/api/analyses/${analysisId}/personas/${selectedPersonaId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId ? { ...m, isStreaming: false } : m
                )
              );
              setIsStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId ? { ...m, message: m.message + parsed.content } : m
                  )
                );
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch {
      setError('Failed to send message. Please try again.');
      // Remove assistant message bubble
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  if (!selectedPersona) {
    return (
      <div className="text-center text-gray-500 py-12">
        No personas available for this analysis
      </div>
    );
  }

  const Icon = personaTypeIcons[selectedPersona.personaType];
  const painPoints = Array.isArray(selectedPersona.painPoints)
    ? selectedPersona.painPoints
    : [];
  const priorities = Array.isArray(selectedPersona.priorities)
    ? selectedPersona.priorities
    : [];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col lg:flex-row" style={{ height: '600px' }}>
        {/* Persona Selection Sidebar */}
        <div className="lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Persona</h3>
            <div className="space-y-2">
              {personas.map((persona) => {
                const PersonaIcon = personaTypeIcons[persona.personaType];
                return (
                  <button
                    key={persona.id}
                    onClick={() => {
                      setSelectedPersonaId(persona.id);
                      setMessages([]);
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedPersonaId === persona.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <PersonaIcon className="w-5 h-5 mr-2 text-gray-700" />
                      <span className="font-bold text-sm">{persona.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{persona.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{persona.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Persona Details */}
            {selectedPersona && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowPersonaDetails(!showPersonaDetails)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 mb-2"
                >
                  View Profile
                  {showPersonaDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showPersonaDetails && (
                  <div className="space-y-3 text-xs">
                    {painPoints.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Pain Points</h4>
                        <ul className="space-y-1">
                          {painPoints.map((point: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <span className="text-gray-700">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {priorities.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Priorities</h4>
                        <ul className="space-y-1">
                          {priorities.map((priority: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="text-yellow-500 mr-2">★</span>
                              <span className="text-gray-700">{priority}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Behavior Profile</h4>
                      <p className="text-gray-700">{selectedPersona.behaviorProfile}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <div className="flex items-center">
              <Icon className="w-6 h-6 mr-2 text-gray-700" />
              <div>
                <h3 className="font-bold text-gray-900">{selectedPersona.name}</h3>
                <p className="text-xs text-gray-600">{selectedPersona.title}</p>
              </div>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Start a conversation with {selectedPersona.name}</p>
                <div className="flex flex-col gap-2 max-w-md mx-auto">
                  <button
                    onClick={() => sendMessage('What do you think about our app?')}
                    className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    What do you think about our app?
                  </button>
                  <button
                    onClick={() => sendMessage('What are your main concerns?')}
                    className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    What are your main concerns?
                  </button>
                  <button
                    onClick={() => sendMessage('Would you use this product?')}
                    className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    Would you use this product?
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatDateTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.4s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            {error && (
              <div className="mb-2 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={`Ask ${selectedPersona.name} about your app...`}
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                maxLength={2000}
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isStreaming}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-1">
              {inputValue.length}/2000 • Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
