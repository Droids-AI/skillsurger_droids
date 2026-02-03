import OpenAI from 'openai';

// ⚠️ SECURITY: OpenAI API calls should ONLY be made from the backend server
// Client-side API calls expose your API key and are a critical security vulnerability
// All AI features should use the backend API endpoints instead

// This file is kept for legacy compatibility but should not be used for actual API calls
// Use backendApi.ts for all AI-powered features

const apiKey = ''; // Intentionally empty - do not add API key here!

// Always return false to prevent client-side API usage
export const isOpenAIConfigured = (): boolean => {
  console.warn('⚠️ Client-side OpenAI is disabled for security. Use backend API endpoints instead.');
  return false;
};

// Export a stub client that will fail if used (safety measure)
export const openai = new OpenAI({
  apiKey: 'dummy-key-do-not-use', // Intentionally invalid
  dangerouslyAllowBrowser: true // Required for type compatibility, but key is invalid
});