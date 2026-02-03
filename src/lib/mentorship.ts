import { supabase } from './supabase';
import { backendApi } from './backendApi';

export interface MentorshipSession {
  id: string;
  mentee_id: string;
  mentor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string | null;
}

export interface MockInterview {
  id: string;
  user_id: string;
  job_role: string;
  scheduled_at: string;
  feedback: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  conversation?: Array<{
    role: 'user' | 'interviewer';
    content: string;
  }>;
  technical_score?: number;
  communication_score?: number;
  overall_score?: number;
  detailed_feedback?: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export interface MentorProfile {
  id: string;
  user_id: string;
  specialization: string;
  experience_years: number;
  hourly_rate: number;
  availability: Array<{
    day: string;
    times: string[];
  }>;
}

export interface AIMentorshipSession {
  id: string;
  user_id: string;
  topic: string;
  conversation: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function startAIMentorshipSession(topic: string): Promise<AIMentorshipSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('ai_mentorship_sessions')
      .insert([{
        user_id: user.id,
        topic,
        conversation: []
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      user_id: data.user_id,
      topic: data.topic,
      conversation: data.conversation || []
    };
  } catch (error) {
    console.error('Error starting AI mentorship session:', error);
    return null;
  }
}

export async function sendMessageToAIMentor(
  sessionId: string,
  message: string
): Promise<string> {
  try {
    const { data: session, error: sessionError } = await supabase
      .from('ai_mentorship_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) throw sessionError;
    if (!session) throw new Error('Session not found');

    const currentConversation = session.conversation || [];

    // Call backend API instead of direct OpenAI
    const response = await backendApi.sendMessageToAIMentor(
      session.topic,
      message,
      currentConversation
    );

    const aiResponse = response.message || 'No response generated';

    const updatedConversation = [
      ...currentConversation,
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    ];

    const { error: updateError } = await supabase
      .from('ai_mentorship_sessions')
      .update({ conversation: updatedConversation })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    return aiResponse;
  } catch (error: any) {
    console.error('Error sending message to AI mentor:', error);
    throw new Error(error.message || 'Failed to process message');
  }
}

export async function scheduleMockInterview(jobRole: string, scheduledAt: string): Promise<MockInterview | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('mock_interviews')
      .insert([{
        user_id: user.id,
        job_role: jobRole,
        scheduled_at: scheduledAt,
        status: 'scheduled',
        conversation: []
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error scheduling mock interview:', error);
    return null;
  }
}

export async function generateInterviewResponse(
  jobRole: string,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    // Call backend API instead of direct OpenAI
    const response = await backendApi.generateInterviewResponse(
      jobRole,
      userMessage,
      conversationHistory
    );

    return response.message || 'Could you please elaborate on that?';
  } catch (error) {
    console.error('Error generating interview response:', error);
    throw new Error('Failed to generate interview response');
  }
}

export async function endInterview(interviewId: string, videoFrames?: string[]): Promise<{
  feedback: string;
  technicalScore: number;
  communicationScore: number;
  overallScore: number;
  detailedFeedback: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    videoStrengths?: string[];
    videoImprovements?: string[];
  };
  videoAnalysis?: any;
}> {
  try {
    // Get the interview with conversation
    const { data: interview, error: getError } = await supabase
      .from('mock_interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (getError) throw getError;
    if (!interview) throw new Error('Interview not found');
    if (!interview.conversation || !Array.isArray(interview.conversation)) {
      throw new Error('No interview conversation found');
    }

    // Format conversation for analysis
    const formattedConversation = interview.conversation
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));

    // Call backend API with video frames for enhanced analysis
    const feedbackData = await backendApi.endInterview(
      interview.job_role,
      formattedConversation,
      videoFrames // Pass video frames for Gemini analysis
    );

    // Update interview with feedback including video analysis
    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update({
        status: 'completed',
        feedback: feedbackData.feedback,
        technical_score: feedbackData.technicalScore,
        communication_score: feedbackData.communicationScore,
        overall_score: feedbackData.overallScore,
        detailed_feedback: feedbackData.detailedFeedback,
        video_analysis: feedbackData.videoAnalysis // Store video analysis
      })
      .eq('id', interviewId);

    if (updateError) throw updateError;

    return {
      feedback: feedbackData.feedback,
      technicalScore: feedbackData.technicalScore,
      communicationScore: feedbackData.communicationScore,
      overallScore: feedbackData.overallScore,
      detailedFeedback: feedbackData.detailedFeedback
    };
  } catch (error: any) {
    console.error('Error ending interview:', error);
    throw error;
  }
}

export async function getMentors(): Promise<MentorProfile[]> {
  try {
    const { data, error } = await supabase
      .from('mentor_profiles')
      .select(`
        *,
        profiles (
          full_name,
          linkedin_url
        )
      `);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return [];
  }
}

export async function scheduleMentorshipSession(
  mentorId: string,
  scheduledAt: string,
  durationMinutes: number = 60
): Promise<MentorshipSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert([{
        mentee_id: user.id,
        mentor_id: mentorId,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        status: 'scheduled'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error scheduling mentorship session:', error);
    return null;
  }
}