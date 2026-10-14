import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import Button from './Button';
import { type AIMentorshipSession, sendMessageToAIMentor } from '../lib/mentorship';

interface Props {
  session: AIMentorshipSession;
  onMessageSent: (session: AIMentorshipSession) => void;
}

export default function AIMentorChat({ session, onMessageSent }: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!sending) { setElapsedSeconds(0); return; }
    const timer = setInterval(() => setElapsedSeconds(seconds => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [sending]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [session.conversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      setError('');

      // Optimistically update UI
      const optimisticSession: AIMentorshipSession = {
        ...session,
        conversation: [
          ...session.conversation,
          { role: 'user', content: message }
        ]
      };
      onMessageSent(optimisticSession);
      
      // Send message and get response
      const response = await sendMessageToAIMentor(session.id, message);
      
      // Update with actual response
      const updatedSession: AIMentorshipSession = {
        ...session,
        conversation: [
          ...session.conversation,
          { role: 'user', content: message },
          { role: 'assistant', content: response }
        ]
      };
      
      onMessageSent(updatedSession);
      setMessage('');

    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.message || 'Failed to send message. Please try again.');
      
      // Keep the draft for an explicit retry; uncertain sends must not duplicate messages.
      onMessageSent(session);
    } finally {
      setSending(false);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg items-center justify-center">
        <p className="text-gray-500">Session not found or has expired. Please start a new session.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold">AI Mentor</h3>
            <p className="text-sm text-gray-500">{session.topic}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {session.conversation.length === 0 && <p className="bg-gray-100 rounded-lg p-3 text-gray-900">Hi! I’m your AI career mentor. Let’s work on {session.topic}. What would you like to achieve?</p>}
        {session.conversation.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div role="status" className="bg-gray-100 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-2">{elapsedSeconds < 10 ? "Your mentor is preparing a response…" : "Still working on your response. You can keep this chat open."}</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            aria-label="Message your AI mentor"
            className="flex-1 min-w-0 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <Button type="submit" aria-label="Send message" disabled={sending || !message.trim()}>
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
