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

      console.error('Backend API error:', {
        message: errorMessage,
        endpoint: `${BACKEND_BASE_URL}${endpoint}`,
        type,
        error
      });
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

  async scoreCVText(cvText: string, onProgress?: (message: string, step?: number) => void): Promise<CVScore> {
    // Use streaming if progress callback is provided
    if (onProgress) {
      return this.makeStreamingRequest<CVScore>(
        '/openai/skillsurger',
        { text: cvText },
        'scoreCVText',
        onProgress
      );
    }
    
    return this.makeRequest<CVScore>(
      '/openai/skillsurger',
      { text: cvText },
      'scoreCVText'
    );
  }

  async enhanceCVText(
    cvText: string, 
    targetRole?: string, 
    existingProjects?: Array<any>,
    onProgress?: (message: string, step?: number) => void
  ): Promise<CVEnhancement> {
    // Use streaming if progress callback is provided
    if (onProgress) {
      return this.makeStreamingRequest<CVEnhancement>(
        '/openai/skillsurger',
        { text: cvText, targetRole, existingProjects },
        'enhanceCVText',
        onProgress
      );
    }
    
    return this.makeRequest<CVEnhancement>(
      '/openai/skillsurger',
      { text: cvText, targetRole, existingProjects },
      'enhanceCVText'
    );
  }

  private async makeStreamingRequest<T>(
    endpoint: string,
    data: any,
    type: string,
    onProgress: (message: string, step?: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        const url = `${BACKEND_BASE_URL}${endpoint}?stream=true&type=${type}`;
        
        // Use fetch with ReadableStream for SSE streaming
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Use-Streaming': 'true', // Custom header to indicate streaming
          },
          body: JSON.stringify({
            ...data,
            type
          }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          if (!reader) {
            throw new Error('Response body is not readable');
          }

          const readChunk = (): Promise<void> => {
            return reader.read().then(({ done, value }) => {
              if (done) {
                return Promise.resolve();
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n\n');
              
              // Keep the last incomplete line in buffer
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.trim()) {
                  this.processSSEMessage(line, onProgress, resolve, reject);
                }
              }

              return readChunk();
            });
          };

          return readChunk().catch(error => {
            reject(new Error(`Streaming error: ${error.message}`));
          });
        })
        .catch(error => {
          reject(new Error(`Request failed: ${error.message}`));
        });
      } catch (error) {
        reject(new Error(`Failed to start streaming request: ${error.message}`));
      }
    });
  }

  private processSSEMessage(
    message: string,
    onProgress: (message: string, step?: number) => void,
    resolve: (value: any) => void,
    reject: (error: Error) => void
  ) {
    try {
      // Parse SSE message format: "event: type\ndata: {...}"
      let eventType = 'message';
      let data = '';

      for (const line of message.split('\n')) {
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          data = line.substring(5).trim();
        } else if (line.startsWith(':')) {
          // Comment/keep-alive line
          continue;
        }
      }

      if (!data) return;

      if (eventType === 'progress') {
        const progressData = JSON.parse(data);
        onProgress(progressData.message || 'Processing...', progressData.step);
      } else if (eventType === 'complete') {
        const result = JSON.parse(data);
        if (result.success) {
          resolve(result.data);
        } else {
          reject(new Error(result.error || 'Request failed'));
        }
      } else if (eventType === 'error') {
        const errorData = JSON.parse(data);
        reject(new Error(errorData.error || 'An error occurred'));
      }
    } catch (error) {
      console.error('Error processing SSE message:', error);
      // Don't reject on parse errors, just log them
    }
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
