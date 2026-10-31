import { reportError } from './safeLogging';
import { assertFactPreservingCV } from './cvFactuality';
import { formatFactualCV } from './factualCVFormatter';
// Backend API service for AI Mentor functionality
// Note: VITE_BACKEND_API should include /api/v1 path
// Example: https://api.wisedroids.ai/api/v1 or http://localhost:5002/api/v1
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';

export interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AIMentorResponse {
  message: string;
  topic?: string;
  userId?: string;
}

export interface InterviewResponse {
  message: string;
}

export interface InterviewFeedback {
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
  videoAnalysis?: {
    bodyLanguageScore: number;
    eyeContactScore: number;
    professionalAppearanceScore: number;
    energyScore: number;
    overallVideoScore: number;
  };
}

export interface CVScore {
  overallScore: number;
  scores: {
    atsOptimization: number;
    contentQuality: number;
    formatting: number;
    keywordRelevance: number;
    impact: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missingElements: string[];
}

export interface CVEnhancement {
  canApplyToProfile?: boolean;
  enhancedCV: string;
  parsedData: {
    full_name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    current_role?: string;
    years_of_experience?: number;
    summary?: string;
    experience?: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    projects?: Array<{
      name: string;
      description: string;
      technologies: string[];
    }>;
    skills?: string[];
    education?: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    languages?: string[];
    certifications?: Array<{
      name: string;
      issuer: string;
      date: string;
    }>;
  };
  changesSummary: string[];
  keyImprovements: {
    atsOptimization: string;
    contentStrength: string;
    formattingChanges: string;
  };
}

class BackendApiService {
  private async makeRequest<T>(
    endpoint: string,
    data: any,
    type: string,
    timeoutMs: number = 300000 // 5 minutes default timeout (CV enhancement can take time)
  ): Promise<T> {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          type
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error response for more details
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If parsing fails, use the default error message
          const responseText = await response.text();
          if (responseText) {
            errorMessage = `${errorMessage}: ${responseText.substring(0, 200)}`;
          }
        }
        throw new Error(errorMessage);
      }

      const result: BackendResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Request failed');
      }

      return result.data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Better error message extraction
      let errorMessage: string;
      
      if (error instanceof Error && error.name === 'AbortError') {
        errorMessage = `Request timed out after ${timeoutMs / 1000} seconds. The operation may still be processing. Please try again.`;
      } else if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
        // Network error - likely CORS, connection refused, or wrong URL
        errorMessage = `Failed to connect to backend API. Please check if the server is running and the API URL is correct: ${BACKEND_BASE_URL}${endpoint}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = 'An unknown error occurred';
      }

      reportError('backendApi', 'operation_failed');
      throw new Error(errorMessage);
    }
  }

  async startAIMentorshipSession(topic: string, userId: string): Promise<AIMentorResponse> {
    return this.makeRequest<AIMentorResponse>(
      '/openai/skillsurger',
      { topic, userId },
      'startAIMentorshipSession'
    );
  }

  async sendMessageToAIMentor(
    topic: string,
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<AIMentorResponse> {
    return this.makeRequest<AIMentorResponse>(
      '/openai/skillsurger',
      { topic, message, conversationHistory },
      'sendMessageToAIMentor'
    );
  }

  async generateInterviewResponse(
    jobRole: string,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<InterviewResponse> {
    return this.makeRequest<InterviewResponse>(
      '/openai/skillsurger',
      { jobRole, userMessage, conversationHistory },
      'generateInterviewResponse'
    );
  }

  async endInterview(
    jobRole: string,
    conversationHistory: Array<{ role: string; content: string }>,
    videoFrames?: string[]
  ): Promise<InterviewFeedback> {
    return this.makeRequest<InterviewFeedback>(
      '/openai/skillsurger',
      { jobRole, conversationHistory, videoFrames },
      'endInterview'
    );
  }

  async scoreCVText(cvText: string, onProgress?: (message: string, step?: number) => void, targetRole?: string): Promise<CVScore> {
    // Use streaming if progress callback is provided
    if (onProgress) {
      return this.makeStreamingRequest<CVScore>(
        '/openai/skillsurger',
        { text: cvText, targetRole },
        'scoreCVText',
        onProgress
      );
    }
    
    return this.makeRequest<CVScore>(
      '/openai/skillsurger',
      { text: cvText, targetRole },
      'scoreCVText'
    );
  }

  async enhanceCVText(
    cvText: string, 
    _targetRole?: string,
    existingProjects?: Array<any>,
    onProgress?: (message: string, step?: number) => void
  ): Promise<CVEnhancement> {
    // Factual formatting is deterministic. Generative rewrites are not safe to auto-apply.
    onProgress?.('Formatting your supplied resume without changing facts...', 10);
    const result = formatFactualCV(cvText);
    assertFactPreservingCV(cvText, result, existingProjects);
    onProgress?.('Formatting complete. Add verified metrics to your source resume where needed.', 100);
    return result;
  }

  private async makeStreamingRequest<T>(
    endpoint: string,
    data: any,
    type: string,
    onProgress: (message: string, step?: number) => void
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetch(`${BACKEND_BASE_URL}${endpoint}?stream=true&type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Use-Streaming': 'true' },
        body: JSON.stringify({ ...data, type }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Request failed (HTTP ${response.status}). Please try again.`);
      // Some proxies return the regular JSON response even when streaming is requested.
      if (response.headers.get('content-type')?.includes('application/json')) {
        const result = await response.json();
        if (!result.success) throw new Error(result.message || result.error || 'Request failed');
        return result.data;
      }
      reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
        let boundary: RegExpExecArray | null;
        while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
          const block = buffer.slice(0, boundary.index);
          buffer = buffer.slice(boundary.index + boundary[0].length);
          const result = this.processSSEMessage<T>(block, onProgress);
          if (result) return result.data;
        }
        if (done) {
          const result = this.processSSEMessage<T>(buffer, onProgress);
          if (result) return result.data;
          throw new Error('The AI response ended before a result arrived. Please try again.');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('CV scoring timed out. Please try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      await reader?.cancel().catch(() => {});
    }
  }

  private processSSEMessage<T>(
    message: string,
    onProgress: (message: string, step?: number) => void
  ): { data: T } | undefined {
    let eventType = 'message';
    const dataLines: string[] = [];
    for (const line of message.split(/\r?\n/)) {
      if (line.startsWith('event:')) eventType = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (!dataLines.length) return;
    const result = JSON.parse(dataLines.join('\n'));
    if (eventType === 'error' || (eventType === 'complete' && !result.success)) {
      throw new Error(result.error || result.message || 'CV scoring failed. Please try again.');
    }
    if (eventType === 'progress') onProgress(result.message || 'Processing...', result.step);
    if (eventType === 'complete') return { data: result.data };
  }

  async analyzeCVText(cvText: string): Promise<any> {
    return this.makeRequest<any>(
      '/openai/skillsurger',
      { text: cvText },
      'analyzeCVText'
    );
  }
}

export const backendApi = new BackendApiService();
