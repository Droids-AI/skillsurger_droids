import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Bot, Video, Users, Book, Trash2, Archive, AlertTriangle, X, Loader2, Mic, MicOff, Briefcase, ChevronDown, Calendar } from 'lucide-react';
import Button from './Button';
import {
  type MockInterview,
  type MentorProfile,
  type MentorshipSession,
  type AIMentorshipSession,
  scheduleMockInterview,
  getMentors,
  scheduleMentorshipSession,
  startAIMentorshipSession,
  sendMessageToAIMentor,
  generateInterviewResponse,
  endInterview
} from '../lib/mentorship';
// Removed: analyzeFeedbackAndGenerateRecommendations - now handled by backend
import { supabase } from '../lib/supabase';
import AIMentorChat from './AIMentorChat';
import VideoCapture, { getVideoFrames } from './VideoCapture';
import { useUser } from '../context/UserContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface SavedJob {
  id: string;
  title: string;
  company: string;
  description: string;
}

interface InterviewMessage {
  role: 'user' | 'interviewer';
  content: string;
}

export default function MentorshipHub() {
  const navigate = useNavigate();
  const { checkSubscriptionForAI } = useUser();
  const [activeTab, setActiveTab] = useState<'mock-interviews' | 'ai-mentor' | 'human-mentors'>('mock-interviews');
  const [mockInterviews, setMockInterviews] = useState<MockInterview[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [aiSessions, setAiSessions] = useState<AIMentorshipSession[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [interviewDate, setInterviewDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  
  const [activeInterview, setActiveInterview] = useState<MockInterview | null>(null);
  const [interviewMessages, setInterviewMessages] = useState<InterviewMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [isInterviewResponseLoading, setIsInterviewResponseLoading] = useState(false);
  const [isEndingInterview, setIsEndingInterview] = useState(false);

  const [mentorshipTopic, setMentorshipTopic] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [interviewMessages, isInterviewResponseLoading]);

  // Speech recognition for voice input
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isSpeechSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // Auto-fill input with transcript and auto-send when speech ends
  useEffect(() => {
    if (transcript && !isListening && activeInterview) {
      // Speech has ended, set message and auto-send
      const finalTranscript = transcript.trim();
      if (finalTranscript) {
        setCurrentMessage(finalTranscript);
        
        // Auto-submit after a brief delay to show the text
        setTimeout(async () => {
          try {
            const updatedMessages: InterviewMessage[] = [
              ...interviewMessages,
              { role: 'user' as 'user', content: finalTranscript }
            ];
            setInterviewMessages(updatedMessages);
            setCurrentMessage('');
            setIsInterviewResponseLoading(true);
            resetTranscript();

            const response = await generateInterviewResponse(
              activeInterview.job_role,
              finalTranscript,
              updatedMessages.map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            );

            setInterviewMessages([
              ...updatedMessages,
              { role: 'interviewer' as 'interviewer', content: response }
            ]);
            setIsInterviewResponseLoading(false);
          } catch (error) {
            console.error('Interview response error:', error);
            setError('Failed to process interview response. Please try again.');
            setIsInterviewResponseLoading(false);
            resetTranscript();
          }
        }, 800); // Small delay to show transcript before sending
      } else {
        resetTranscript();
      }
    }
  }, [transcript, isListening, activeInterview]);

  // Update input with interim results while speaking
  useEffect(() => {
    if (isListening && (transcript || interimTranscript)) {
      setCurrentMessage(transcript + interimTranscript);
    }
  }, [transcript, interimTranscript, isListening]);

  useEffect(() => {
    loadMentors();
    loadSavedJobs();
    loadMockInterviews();
    loadAISessions();
  }, []);

  async function loadSavedJobs() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: jobs, error: jobsError } = await supabase
        .from('saved_jobs')
        .select('id, title, company, description')
        .eq('user_id', user.id);

      if (jobsError) throw jobsError;
      setSavedJobs(jobs || []);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    }
  }

  async function loadMockInterviews() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: interviews, error: interviewsError } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: false });

      if (interviewsError) throw interviewsError;
      setMockInterviews(interviews || []);
    } catch (error) {
      console.error('Error loading mock interviews:', error);
    }
  }

  async function loadAISessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions, error: sessionsError } = await supabase
        .from('ai_mentorship_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      setAiSessions(sessions || []);
    } catch (error) {
      console.error('Error loading AI sessions:', error);
    }
  }

  async function loadMentors() {
    const mentorsList = await getMentors();
    setMentors(mentorsList);
    setLoading(false);
  }

  const handleDeleteInterview = async (interviewId: string) => {
    const deleteKey = `interview-${interviewId}`;
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete interview and related feedback metrics
      const { error } = await supabase
        .from('mock_interviews')
        .delete()
        .eq('id', interviewId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setMockInterviews(prev => prev.filter(interview => interview.id !== interviewId));
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Interview deleted successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Error deleting interview:', error);
      setError(error.message || 'Failed to delete interview');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAISession = async (sessionId: string) => {
    const deleteKey = `ai-session-${sessionId}`;
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete AI session
      const { error } = await supabase
        .from('ai_mentorship_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setAiSessions(prev => prev.filter(session => session.id !== sessionId));
      setShowDeleteConfirm(null);

      // If this was the active session, clear it
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'AI mentorship session deleted successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Error deleting AI session:', error);
      setError(error.message || 'Failed to delete AI session');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllInterviews = async () => {
    const deleteKey = 'all-interviews';
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all interviews
      const { error } = await supabase
        .from('mock_interviews')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setMockInterviews([]);
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'All interviews deleted successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Error deleting all interviews:', error);
      setError(error.message || 'Failed to delete all interviews');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllAISessions = async () => {
    const deleteKey = 'all-ai-sessions';
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all AI sessions
      const { error } = await supabase
        .from('ai_mentorship_sessions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setAiSessions([]);
      setActiveSessionId(null);
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'All AI mentorship sessions deleted successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Error deleting all AI sessions:', error);
      setError(error.message || 'Failed to delete all AI sessions');
    } finally {
      setDeleting(null);
    }
  };

  const renderDeleteButton = (deleteKey: string, onDelete: () => void, label: string) => {
    const isConfirming = showDeleteConfirm === deleteKey;
    const isDeleting = deleting === deleteKey;

    if (!isConfirming) {
      return (
        <Button
          onClick={onDelete}
          variant="outline"
          size="sm"
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-red-600">Delete {label}?</span>
        <Button
          onClick={onDelete}
          disabled={isDeleting}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isDeleting ? 'Deleting...' : 'Yes'}
        </Button>
        <Button
          onClick={() => setShowDeleteConfirm(null)}
          disabled={isDeleting}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    );
  };

  async function handleScheduleInterview(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!selectedJob || !interviewDate) {
      setError('Please select a job and interview date');
      return;
    }

    // Check subscription for AI features
    if (!checkSubscriptionForAI()) {
      return;
    }

    try {
      setSchedulingInterview(true);
      const selectedJobData = savedJobs.find(job => job.id === selectedJob);
      if (!selectedJobData) {
        setError('Selected job not found');
        setSchedulingInterview(false);
        return;
      }

      const jobRole = `${selectedJobData.title} at ${selectedJobData.company}`;
      const interview = await scheduleMockInterview(jobRole, interviewDate);
      
      if (interview) {
        setMockInterviews([interview, ...mockInterviews]);
        setSelectedJob('');
        setInterviewDate('');
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        successDiv.innerHTML = `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Interview scheduled successfully!
        `;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 3000);
      }
    } catch (error) {
      setError('Failed to schedule interview. Please try again.');
    } finally {
      setSchedulingInterview(false);
    }
  }

  const startInterview = async (interview: MockInterview) => {
    setActiveInterview(interview);
    setIsInterviewing(true);
    
    const initialMessages: InterviewMessage[] = [
      {
        role: 'interviewer',
        content: `Hello! I'll be conducting your interview today for the ${interview.job_role} position. Let's begin with a brief introduction about yourself and your interest in this role.`
      }
    ];
    setInterviewMessages(initialMessages);
  };

  const handleSendInterviewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !activeInterview) return;

    try {
      const updatedMessages: InterviewMessage[] = [
        ...interviewMessages,
        { role: 'user' as 'user', content: currentMessage }
      ];
      setInterviewMessages(updatedMessages);
      setCurrentMessage('');
      setIsInterviewResponseLoading(true);

      const response = await generateInterviewResponse(
        activeInterview.job_role,
        currentMessage,
        updatedMessages.map(msg => ({
          role: msg.role, // already 'user' or 'interviewer'
          content: msg.content
        }))
      );

      setInterviewMessages([
        ...updatedMessages,
        { role: 'interviewer' as 'interviewer', content: response }
      ]);
      setIsInterviewResponseLoading(false);
    } catch (error) {
      console.error('Interview response error:', error);
      setError('Failed to process interview response. Please try again.');
      setIsInterviewResponseLoading(false);
    }
  };

  const handleEndInterview = async () => {
    if (!activeInterview) return;

    try {
      setError('');
      setIsEndingInterview(true);
      
      // Collect video frames for analysis
      const videoFrames = getVideoFrames();
      console.log(`Collected ${videoFrames.length} video frames for analysis`);
      
      const { error: updateError } = await supabase
        .from('mock_interviews')
        .update({
          conversation: interviewMessages,
          status: 'completed'
        })
        .eq('id', activeInterview.id);

      if (updateError) throw updateError;

      // Pass video frames to backend for Gemini analysis
      const result = await endInterview(activeInterview.id, videoFrames);

      setMockInterviews(prevInterviews =>
        prevInterviews.map(interview =>
          interview.id === activeInterview.id
            ? {
                ...interview,
                status: 'completed',
                feedback: result.feedback,
                technical_score: result.technicalScore,
                communication_score: result.communicationScore,
                overall_score: result.overallScore,
                detailed_feedback: result.detailedFeedback,
                video_analysis: result.videoAnalysis // Store video analysis results
              }
            : interview
        )
      );

      // Note: Learning recommendations are now generated by the backend
      // The backend's endInterview function with GPT-5.1 and Gemini provides comprehensive
      // feedback including verbal responses and video analysis (body language, eye contact, etc.)

      setActiveInterview(null);
      setIsInterviewing(false);
      setInterviewMessages([]);
      setCurrentMessage('');
      setIsEndingInterview(false);

    } catch (error: any) {
      console.error('Error ending interview:', error);
      setError(error.message || 'Failed to end interview. Please try again.');
      setIsEndingInterview(false);
    }
  };

  async function handleStartAIMentorship(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    // Check subscription for AI features
    if (!checkSubscriptionForAI()) {
      return;
    }
    
    try {
      const session = await startAIMentorshipSession(mentorshipTopic);
      if (session) {
        setAiSessions([session, ...aiSessions]);
        setActiveSessionId(session.id);
        setMentorshipTopic('');
      }
    } catch (error) {
      setError('Failed to start mentorship session. Please try again.');
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSessionId || !aiMessage.trim()) return;

    // Check subscription for AI features
    if (!checkSubscriptionForAI()) {
      return;
    }

    try {
      const response = await sendMessageToAIMentor(activeSessionId, aiMessage);
      setAiSessions(sessions => 
        sessions.map(session => 
          session.id === activeSessionId
            ? {
                ...session,
                conversation: [
                  ...session.conversation,
                  { role: 'user', content: aiMessage },
                  { role: 'assistant', content: response }
                ]
              }
            : session
        )
      );
      setAiMessage('');
    } catch (error) {
      setError('Failed to send message. Please try again.');
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold">Mentorship Hub</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button
            variant={activeTab === 'mock-interviews' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('mock-interviews')}
          >
            <Video className="w-4 h-4 mr-2" />
            Mock Interviews
          </Button>
          <Button
            variant={activeTab === 'ai-mentor' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('ai-mentor')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Mentor
          </Button>
          <Button
            variant={activeTab === 'human-mentors' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('human-mentors')}
          >
            <Users className="w-4 h-4 mr-2" />
            Human Mentors
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {activeTab === 'mock-interviews' && (
        <div className="space-y-8">
          {isInterviewing ? (
            <div className="fixed inset-0 bg-gray-50 z-50 overflow-auto">
              {/* Full Screen Interview Layout */}
              <div className="h-screen flex flex-col">
                {/* Header Bar */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{activeInterview?.job_role}</h2>
                      <p className="text-sm text-gray-500">AI Mock Interview Session</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleEndInterview}
                    disabled={isEndingInterview}
                    className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                  >
                    {isEndingInterview ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Ending...
                      </>
                    ) : (
                      'End Interview'
                    )}
                  </Button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-0 overflow-hidden">
                  {/* Left Side: Video Feed */}
                  <div className="bg-gray-900 p-6 flex flex-col overflow-y-auto">
                    <div className="mb-4">
                      <h3 className="text-white text-sm font-medium mb-1">Your Video</h3>
                      <p className="text-gray-400 text-xs">Maintain eye contact and good posture</p>
                    </div>
                    <div className="flex-1 flex items-start">
                      <VideoCapture 
                        isActive={isInterviewing}
                        captureInterval={10000}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Right Side: Interview Chat */}
                  <div className="flex flex-col bg-white h-full">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                      {interviewMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900 border border-gray-200'
                            }`}
                          >
                            {message.role === 'interviewer' && (
                              <div className="flex items-center mb-2">
                                <Bot className="w-5 h-5 mr-2 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-600">AI Interviewer</span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      {isInterviewResponseLoading && (
                        <div className="flex items-start">
                          <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 flex items-center space-x-3">
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-600 text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      )}
                      {/* Invisible div for auto-scroll */}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <form onSubmit={handleSendInterviewMessage} className="flex gap-3">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Type or click mic to speak..."}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-base"
                            disabled={isInterviewResponseLoading || isListening}
                            autoFocus
                          />
                          {/* Mic Button inside input */}
                          {isSpeechSupported && (
                            <button
                              type="button"
                              onClick={isListening ? stopListening : startListening}
                              disabled={isInterviewResponseLoading}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                                isListening 
                                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                              title={isListening ? "Stop recording" : "Click to speak"}
                            >
                              {isListening ? (
                                <MicOff className="w-5 h-5" />
                              ) : (
                                <Mic className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                        <Button 
                          type="submit" 
                          disabled={!currentMessage.trim() || isInterviewResponseLoading || isListening} 
                          className="px-6 rounded-xl"
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </form>
                      
                      {/* Status Messages */}
                      <div className="mt-2 text-center space-y-1">
                        {isListening && (
                          <div className="flex items-center justify-center space-x-2 text-red-600 animate-pulse">
                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            <p className="text-sm font-medium">Recording... Speak now!</p>
                          </div>
                        )}
                        {speechError && !isListening && (
                          <p className="text-xs text-red-600">{speechError}</p>
                        )}
                        {!isListening && !speechError && (
                          <p className="text-xs text-gray-500">
                            {isSpeechSupported ? (
                              <>Press Enter to send • Click <Mic className="w-3 h-3 inline" /> to speak</>
                            ) : (
                              'Press Enter to send'
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <Video className="w-6 h-6 mr-2 text-blue-600" />
                      Schedule Mock Interview
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Practice with AI-powered interview simulation</p>
                  </div>
                </div>
                {savedJobs.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Saved Jobs Found</h4>
                    <p className="text-gray-600 mb-4">
                      To schedule a mock interview, you need to save jobs first from Career Explorer.
                    </p>
                    <Button
                      onClick={() => navigate('/dashboard?section=career')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Explore Careers & Save Jobs
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleScheduleInterview} className="space-y-6">
                    {/* Job Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        <Briefcase className="inline w-4 h-4 mr-2 text-blue-600" />
                        Select Job Position
                      </label>
                      <div className="relative">
                        <select
                          value={selectedJob}
                          onChange={(e) => setSelectedJob(e.target.value)}
                          className="appearance-none block w-full px-4 py-3.5 pr-10 text-base border-2 border-gray-200 rounded-xl shadow-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                          required
                        >
                          <option value="" disabled className="text-gray-400">
                            Choose a job position...
                          </option>
                          {savedJobs.map(job => (
                            <option key={job.id} value={job.id} className="py-2">
                              {job.title} at {job.company}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500">
                        Select the position you want to practice interviewing for
                      </p>
                    </div>

                    {/* Date & Time Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        <Calendar className="inline w-4 h-4 mr-2 text-blue-600" />
                        Interview Date & Time
                      </label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          value={interviewDate}
                          onChange={(e) => setInterviewDate(e.target.value)}
                          className="block w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl shadow-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          required
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500">
                        Choose when you'd like to conduct your mock interview
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      disabled={schedulingInterview}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {schedulingInterview ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
                          Scheduling Interview...
                        </>
                      ) : (
                        <>
                          <Video className="w-5 h-5 mr-2 inline" />
                          Schedule Mock Interview
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold">Your Interviews</h3>
                  {mockInterviews.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <span className="text-sm text-gray-500">{mockInterviews.length} interviews</span>
                      {renderDeleteButton('all-interviews', handleDeleteAllInterviews, 'all interviews')}
                    </div>
                  )}
                </div>
                {mockInterviews.length > 0 ? (
                  <div className="space-y-4">
                    {mockInterviews.map(interview => (
                      <div
                        key={interview.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                          <div>
                            <p className="font-medium break-words">{interview.job_role}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(interview.scheduled_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            {interview.status === 'scheduled' ? (
                              <Button
                                variant="outline"
                                onClick={() => startInterview(interview)}
                                className="w-full sm:w-auto"
                              >
                                Start Interview
                              </Button>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                Completed
                              </span>
                            )}
                            {renderDeleteButton(`interview-${interview.id}`, () => handleDeleteInterview(interview.id), 'interview')}
                          </div>
                        </div>
                        {interview.feedback && (
                          <div className="mt-4 space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium mb-2">Feedback</h4>
                              <p className="text-gray-700">{interview.feedback}</p>
                            </div>
                            {interview.detailed_feedback && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-green-50 rounded-lg">
                                  <h5 className="font-medium mb-2 text-green-800">Strengths</h5>
                                  <ul className="list-disc list-inside text-green-700">
                                    {interview.detailed_feedback.strengths.map((strength, i) => (
                                      <li key={i}>{strength}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="p-4 bg-yellow-50 rounded-lg">
                                  <h5 className="font-medium mb-2 text-yellow-800">Areas for Improvement</h5>
                                  <ul className="list-disc list-inside text-yellow-700">
                                    {interview.detailed_feedback.improvements.map((improvement, i) => (
                                      <li key={i}>{improvement}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                  <h5 className="font-medium mb-2 text-blue-800">Recommendations</h5>
                                  <ul className="list-disc list-inside text-blue-700">
                                    {interview.detailed_feedback.recommendations.map((rec, i) => (
                                      <li key={i}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Technical Score</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {interview.technical_score}/5
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Communication Score</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {interview.communication_score}/5
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Overall Score</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {interview.overall_score}/5
                                </p>
                              </div>
                            </div>

                            {/* Video Analysis Results */}
                            {interview.video_analysis && (
                              <div className="mt-6 space-y-4">
                                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                                  <h4 className="font-medium mb-4 text-purple-900 flex items-center">
                                    <Video className="w-5 h-5 mr-2" />
                                    Video Analysis Results (Powered by Gemini AI)
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">Body Language</p>
                                      <p className="text-xl font-bold text-purple-600">
                                        {interview.video_analysis.bodyLanguageScore}/10
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">Eye Contact</p>
                                      <p className="text-xl font-bold text-purple-600">
                                        {interview.video_analysis.eyeContactScore}/10
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">Appearance</p>
                                      <p className="text-xl font-bold text-purple-600">
                                        {interview.video_analysis.professionalAppearanceScore}/10
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">Energy Level</p>
                                      <p className="text-xl font-bold text-purple-600">
                                        {interview.video_analysis.energyScore}/10
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">Video Score</p>
                                      <p className="text-xl font-bold text-purple-700">
                                        {interview.video_analysis.overallVideoScore}/10
                                      </p>
                                    </div>
                                  </div>
                                  {interview.detailed_feedback?.videoStrengths && interview.detailed_feedback.videoStrengths.length > 0 && (
                                    <div className="mt-3">
                                      <h5 className="font-medium text-sm text-green-800 mb-2">Video Strengths</h5>
                                      <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                                        {interview.detailed_feedback.videoStrengths.map((strength, i) => (
                                          <li key={i}>{strength}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {interview.detailed_feedback?.videoImprovements && interview.detailed_feedback.videoImprovements.length > 0 && (
                                    <div className="mt-3">
                                      <h5 className="font-medium text-sm text-yellow-800 mb-2">Video Areas for Improvement</h5>
                                      <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                                        {interview.detailed_feedback.videoImprovements.map((improvement, i) => (
                                          <li key={i}>{improvement}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No interviews scheduled yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'ai-mentor' && (
        <div>
          {!activeSessionId ? (
            <div className="space-y-8">
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Start AI Mentorship Session</h3>
                <form onSubmit={handleStartAIMentorship} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Topic</label>
                    <input
                      type="text"
                      value={mentorshipTopic}
                      onChange={(e) => setMentorshipTopic(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Career Transition to Tech"
                      required
                    />
                  </div>
                  <Button type="submit">
                    Start Session
                  </Button>
                </form>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold">Previous AI Mentorship Sessions</h3>
                  {aiSessions.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <span className="text-sm text-gray-500">{aiSessions.length} sessions</span>
                      {renderDeleteButton('all-ai-sessions', handleDeleteAllAISessions, 'all sessions')}
                    </div>
                  )}
                </div>
                {aiSessions.length > 0 ? (
                  <div className="space-y-4">
                    {aiSessions.map(session => (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-medium break-words">{session.topic}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(session.created_at).toLocaleString()} • {session.conversation.length} messages
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveSessionId(session.id)}
                              className="w-full sm:w-auto"
                            >
                              Continue Chat
                            </Button>
                            {renderDeleteButton(`ai-session-${session.id}`, () => handleDeleteAISession(session.id), 'session')}
                          </div>
                        </div>
                        {session.conversation.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600">
                              Last message: {session.conversation[session.conversation.length - 1]?.content?.substring(0, 100)}...
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No previous AI mentorship sessions.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-semibold">AI Mentorship Session</h3>
                <Button
                  variant="outline"
                  onClick={() => setActiveSessionId(null)}
                  className="w-full sm:w-auto"
                >
                  Back to Sessions
                </Button>
              </div>
              <AIMentorChat
                session={aiSessions.find(s => s.id === activeSessionId)!}
                onMessageSent={(updatedSession) => {
                  setAiSessions(sessions =>
                    sessions.map(s =>
                      s.id === updatedSession.id ? updatedSession : s
                    )
                  );
                }}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'human-mentors' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p>Loading mentors...</p>
            ) : mentors.length > 0 ? (
              mentors.map(mentor => (
                <div
                  key={mentor.id}
                  className="border rounded-lg p-6 space-y-4"
                >
                  <div>
                    <h4 className="font-semibold break-words">{mentor.specialization}</h4>
                    <p className="text-sm text-gray-500">
                      {mentor.experience_years} years of experience
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rate</p>
                    <p className="text-lg font-bold">${mentor.hourly_rate}/hour</p>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full">
                      View Profile
                    </Button>
                    <Button variant="outline" className="w-full">
                      Book Session
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No mentors available at the moment.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}