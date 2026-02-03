import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import Button from './Button';

interface GenerateCVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (interests: string) => void;
  loading?: boolean;
}

export default function GenerateCVModal({ isOpen, onClose, onGenerate, loading = false }: GenerateCVModalProps) {
  const [interests, setInterests] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interests.trim()) {
      onGenerate(interests.trim());
    }
  };

  const handleClose = () => {
    setInterests('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <Sparkles className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Generate Your CV</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Help us create a personalized CV by sharing your career interests and goals. This will help us generate relevant projects, skills, and content for your CV.
            </p>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Career Interests & Goals *
            </label>
            <textarea
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="e.g., Software Development, Data Science, Marketing, Finance, Healthcare, Entrepreneurship, Research, Teaching..."
              required
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Be specific about the roles, industries, or career paths you're interested in.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!interests.trim() || loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate CV
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
