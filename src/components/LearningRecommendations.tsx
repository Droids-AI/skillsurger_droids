import { useState, useEffect } from 'react';
import { Book, CheckCircle, ExternalLink } from 'lucide-react';
import Button from './Button';
import {
  type LearningRecommendation,
  getLearningRecommendations,
  markRecommendationComplete
} from '../lib/feedbackLoop';

export default function LearningRecommendations() {
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      const data = await getLearningRecommendations();
      setRecommendations(data);
    } catch (error) {
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkComplete(id: string) {
    try {
      await markRecommendationComplete(id);
      setRecommendations(recommendations.map(rec =>
        rec.id === id
          ? { ...rec, completed_at: new Date().toISOString() }
          : rec
      ));
    } catch (error) {
      setError('Failed to update recommendation');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Book className="w-5 h-5 mr-2 text-blue-600" />
          Learning Recommendations
        </h3>
      </div>

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map(rec => (
            <div
              key={rec.id}
              className={`border rounded-lg p-4 ${
                rec.completed_at ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{rec.skill_area}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {rec.resource_type}
                  </p>
                  <a
                    href={rec.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-2 flex items-center"
                  >
                    View Resource
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rec.priority === 1
                      ? 'bg-red-100 text-red-800'
                      : rec.priority === 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    Priority {rec.priority}
                  </span>
                  {rec.completed_at ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="w-5 h-5" />
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkComplete(rec.id)}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          No learning recommendations available yet. Complete a mock interview to get personalized suggestions.
        </p>
      )}
    </div>
  );
}