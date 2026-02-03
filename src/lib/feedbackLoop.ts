import { openai, isOpenAIConfigured } from './openaiConfig';
import { supabase } from './supabase';
import { extractJsonFromMarkdown } from './utils';

export interface InterviewFeedbackMetrics {
  id: string;
  interview_id: string;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  improvement_areas: string[];
}

export interface LearningRecommendation {
  id: string;
  skill_area: string;
  resource_type: string;
  resource_url: string;
  priority: number;
  completed_at: string | null;
}

export async function getLearningRecommendations(): Promise<LearningRecommendation[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('learning_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting learning recommendations:', error);
    throw error;
  }
}

export async function markRecommendationComplete(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('learning_recommendations')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking recommendation complete:', error);
    throw error;
  }
}

export async function analyzeFeedbackAndGenerateRecommendations(
  interviewId: string,
  feedback: string
): Promise<void> {
  try {
    if (!isOpenAIConfigured()) {
      console.warn('OpenAI not configured. Skipping feedback analysis.');
      return;
    }

    // Get interview details
    const { data: interview } = await supabase
      .from('mock_interviews')
      .select('user_id, job_role')
      .eq('id', interviewId)
      .single();

    if (!interview) {
      throw new Error('Interview not found');
    }

    // Analyze feedback using GPT-4
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Analyze interview feedback and provide scores and recommendations in the following format:

          {
            "technical_score": (number between 1-5),
            "communication_score": (number between 1-5),
            "problem_solving_score": (number between 1-5),
            "improvement_areas": ["area 1", "area 2", ...]
          }

          Ensure the response is valid JSON and contains all required fields.`
        },
        {
          role: "user",
          content: feedback
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('Failed to analyze feedback');
    }

    let analysis;
    try {
      const content = response.choices[0].message.content.trim();
      
      // Extract JSON from markdown if needed
      const cleanedContent = extractJsonFromMarkdown(content);
      
      analysis = JSON.parse(cleanedContent);
      
      // Validate analysis structure
      if (!analysis.technical_score || !analysis.communication_score || 
          !analysis.problem_solving_score || !analysis.improvement_areas) {
        throw new Error('Invalid analysis format');
      }
    } catch (parseError) {
      console.error('Error parsing analysis:', parseError);
      throw new Error('Failed to parse feedback analysis');
    }

    // Store feedback metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('interview_feedback_metrics')
      .insert([{
        interview_id: interviewId,
        technical_score: analysis.technical_score,
        communication_score: analysis.communication_score,
        problem_solving_score: analysis.problem_solving_score,
        improvement_areas: analysis.improvement_areas
      }])
      .select()
      .single();

    if (metricsError) throw metricsError;

    // Generate learning recommendations
    const recommendationsResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Based on interview feedback, generate learning recommendations in the following format:

          {
            "recommendations": [
              {
                "skill_area": "string",
                "resource_type": "string",
                "resource_url": "string",
                "priority": number (1-3)
              }
            ]
          }

          Ensure the response is valid JSON and contains all required fields.`
        },
        {
          role: "user",
          content: `Job Role: ${interview.job_role}
          Improvement Areas: ${analysis.improvement_areas.join(', ')}
          Technical Score: ${analysis.technical_score}/5
          Communication Score: ${analysis.communication_score}/5
          Problem Solving Score: ${analysis.problem_solving_score}/5`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    if (!recommendationsResponse.choices[0]?.message?.content) {
      throw new Error('Failed to generate recommendations');
    }

    let recommendations;
    try {
      const content = recommendationsResponse.choices[0].message.content.trim();
      
      // Extract JSON from markdown if needed
      const cleanedContent = extractJsonFromMarkdown(content);
      
      recommendations = JSON.parse(cleanedContent);
      
      // Validate recommendations structure
      if (!Array.isArray(recommendations.recommendations)) {
        throw new Error('Invalid recommendations format');
      }
    } catch (parseError) {
      console.error('Error parsing recommendations:', parseError);
      throw new Error('Failed to parse recommendations');
    }

    // Store recommendations
    await supabase
      .from('learning_recommendations')
      .insert(
        recommendations.recommendations.map((rec: any) => ({
          user_id: interview.user_id,
          ...rec
        }))
      );

  } catch (error) {
    console.error('Error in feedback loop:', error);
    throw error;
  }
}