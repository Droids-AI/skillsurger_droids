import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { ResumeAnalysis } from '../../pages/JobReadinessIndex';

type Props = {
  onAnalysisComplete: (analysis: ResumeAnalysis) => void;
  onBack: () => void;
};

export default function ResumeUpload({ onAnalysisComplete, onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError('');

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(file);
  };

  const analyzeResume = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError('');
    setProgress(0);

    try {
      // Simulate file reading and analysis
      const text = await readFileAsText(file);

      // Simulate progressive analysis
      setProgress(20);
      await delay(500);

      // Extract skills (simple keyword matching - in production, use AI/NLP)
      const skills = extractSkills(text);
      setProgress(40);
      await delay(500);

      // Extract experience
      const experience = extractExperience(text);
      setProgress(60);
      await delay(500);

      // Extract job title
      const jobTitle = extractJobTitle(text);
      setProgress(80);
      await delay(500);

      // Calculate resume quality
      const resumeQuality = calculateResumeQuality(text);
      setProgress(90);
      await delay(300);

      // Calculate ATS compatibility
      const atsCompatibility = calculateATSCompatibility(text, file.type);
      setProgress(100);
      await delay(300);

      const analysis: ResumeAnalysis = {
        skills,
        experience,
        jobTitle,
        resumeQuality,
        atsCompatibility,
        resumeText: text,
      };

      onAnalysisComplete(analysis);
    } catch (err) {
      setError('Failed to analyze resume. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const extractSkills = (text: string): string[] => {
    // Common tech skills - in production, use a comprehensive skills database
    const skillsDatabase = [
      'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Python',
      'Java', 'C++', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker',
      'Kubernetes', 'Git', 'REST API', 'GraphQL', 'HTML', 'CSS', 'Tailwind',
      'Leadership', 'Communication', 'Project Management', 'Agile', 'Scrum',
      'Data Analysis', 'Machine Learning', 'AI', 'DevOps', 'CI/CD', 'Testing',
      'Problem Solving', 'Team Collaboration', 'Critical Thinking'
    ];

    const foundSkills = skillsDatabase.filter(skill =>
      text.toLowerCase().includes(skill.toLowerCase())
    );

    return foundSkills.slice(0, 10); // Limit to top 10
  };

  const extractExperience = (text: string): string[] => {
    // Simple extraction - look for year patterns and job-related keywords
    const experienceKeywords = ['experience', 'worked', 'developed', 'managed', 'led'];
    const lines = text.split('\n');
    const experienceLines = lines.filter(line =>
      experienceKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );

    return experienceLines.slice(0, 5);
  };

  const extractJobTitle = (text: string): string => {
    // Common job titles - in production, use NLP
    const jobTitles = [
      'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
      'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer',
      'Project Manager', 'Business Analyst', 'Marketing Manager', 'Sales Manager'
    ];

    for (const title of jobTitles) {
      if (text.toLowerCase().includes(title.toLowerCase())) {
        return title;
      }
    }

    return 'Professional';
  };

  const calculateResumeQuality = (text: string): number => {
    let score = 0;

    // Length check (ideal: 400-800 words)
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 400 && wordCount <= 800) score += 25;
    else if (wordCount > 200) score += 15;

    // Quantified achievements (numbers)
    const numberMatches = text.match(/\d+%|\d+ years|\$\d+/g);
    if (numberMatches && numberMatches.length >= 5) score += 20;
    else if (numberMatches && numberMatches.length >= 2) score += 10;

    // Action verbs
    const actionVerbs = ['developed', 'led', 'managed', 'created', 'improved', 'increased', 'reduced'];
    const verbCount = actionVerbs.filter(verb => text.toLowerCase().includes(verb)).length;
    score += Math.min(verbCount * 5, 20);

    // Contact information
    if (text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)) score += 10;

    // Professional sections
    const sections = ['experience', 'education', 'skills'];
    const sectionCount = sections.filter(section => text.toLowerCase().includes(section)).length;
    score += sectionCount * 8;

    // Grammar check (basic - check for common errors)
    const grammarErrors = (text.match(/\s{2,}/g) || []).length;
    score += Math.max(7 - grammarErrors, 0);

    return Math.min(score, 100);
  };

  const calculateATSCompatibility = (text: string, fileType: string): number => {
    let score = 0;

    // File format (PDF is best)
    if (fileType === 'application/pdf') score += 30;
    else if (fileType.includes('word')) score += 25;
    else score += 15;

    // Standard sections
    const standardSections = ['experience', 'education', 'skills', 'summary'];
    const foundSections = standardSections.filter(section =>
      text.toLowerCase().includes(section)
    ).length;
    score += foundSections * 10;

    // No special characters that confuse ATS
    const specialChars = text.match(/[^\w\s@.\-,()]/g);
    if (!specialChars || specialChars.length < 10) score += 15;

    // Keyword density
    const keywords = ['experience', 'skills', 'developed', 'managed'];
    const keywordCount = keywords.filter(kw => text.toLowerCase().includes(kw)).length;
    score += Math.min(keywordCount * 5, 15);

    return Math.min(score, 100);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mb-4">
              Step 1 of 4
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Upload Your Resume
            </h2>
            <p className="text-gray-600">
              We'll analyze your resume for ATS compatibility, skills, and experience
            </p>
          </div>

          {!isAnalyzing ? (
            <>
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-3 border-dashed rounded-xl p-12 text-center transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      Drop your resume here or click to upload
                    </p>
                    <p className="text-sm text-gray-600 mb-6">
                      Supports PDF, DOC, DOCX, TXT (Max 5MB)
                    </p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileInput}
                      />
                      <span className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                        Choose File
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-green-600 mr-3" />
                      <div>
                        <p className="font-semibold text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>

                  <button
                    onClick={analyzeResume}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105"
                  >
                    Analyze My Resume
                  </button>

                  <button
                    onClick={() => setFile(null)}
                    className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Upload Different File
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="mt-8 bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  🔒 <strong>Your privacy matters:</strong> Your resume is analyzed locally and never stored on our servers.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  Analyzing your resume...
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <AnalysisStep completed={progress >= 20} label="Extracting text from resume" />
                <AnalysisStep completed={progress >= 40} label="Identifying skills and keywords" />
                <AnalysisStep completed={progress >= 60} label="Analyzing experience level" />
                <AnalysisStep completed={progress >= 80} label="Checking resume quality" />
                <AnalysisStep completed={progress >= 100} label="Evaluating ATS compatibility" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisStep({ completed, label }: { completed: boolean; label: string }) {
  return (
    <div className="flex items-center">
      {completed ? (
        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
      ) : (
        <div className="w-5 h-5 mr-3 flex-shrink-0">
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
        </div>
      )}
      <span className={completed ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
    </div>
  );
}
