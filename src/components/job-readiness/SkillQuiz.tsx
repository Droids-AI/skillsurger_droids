import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { QuizResult } from '../../pages/JobReadinessIndex';

type Props = {
  skills: string[];
  jobTitle: string;
  onQuizComplete: (result: QuizResult) => void;
};

type Question = {
  skill: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export default function SkillQuiz({ skills, jobTitle, onQuizComplete }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);

  useEffect(() => {
    const generatedQuestions = generateQuestions(skills.slice(0, 5), jobTitle);
    setQuestions(generatedQuestions);
    setAnsweredQuestions(new Array(generatedQuestions.length).fill(false));
  }, [skills, jobTitle]);

  const handleAnswerSelect = (index: number) => {
    if (!showFeedback) {
      setSelectedAnswer(index);
    }
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    if (!showFeedback) {
      // Show feedback
      setShowFeedback(true);
      const isCorrect = selectedAnswer === questions[currentQuestionIndex].correctAnswer;
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
      }
      const newAnswered = [...answeredQuestions];
      newAnswered[currentQuestionIndex] = true;
      setAnsweredQuestions(newAnswered);
    } else {
      // Move to next question or complete quiz
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // Quiz complete
        completeQuiz();
      }
    }
  };

  const completeQuiz = () => {
    const skillsVerified: string[] = [];
    const skillsFailed: string[] = [];

    questions.forEach((q, index) => {
      // In a real implementation, track individual answers
      // For now, approximate based on overall score
      if (index < correctAnswers) {
        skillsVerified.push(q.skill);
      } else {
        skillsFailed.push(q.skill);
      }
    });

    const result: QuizResult = {
      correctAnswers,
      totalQuestions: questions.length,
      skillsVerified,
      skillsFailed,
    };

    onQuizComplete(result);
  };

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your personalized quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                Step 2 of 4
              </div>
              <span className="text-sm font-semibold text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Verify Your Skills
            </h2>
            <p className="text-gray-600 mb-2">
              We found these skills on your resume:{' '}
              <span className="font-semibold">
                {skills.slice(0, 5).join(', ')}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Answer these questions to verify your expertise
            </p>
          </div>

          {/* Running Score */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Your Score:</span>
              <span className="text-lg font-bold text-blue-600">
                {correctAnswers}/{currentQuestionIndex + (showFeedback ? 1 : 0)} correct
                {correctAnswers > 0 && ' 🔥'}
              </span>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {currentQuestion.skill}
              </p>
              <h3 className="text-xl font-semibold text-gray-900">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === currentQuestion.correctAnswer;
                const showCorrect = showFeedback && isCorrectAnswer;
                const showIncorrect = showFeedback && isSelected && !isCorrectAnswer;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      showCorrect
                        ? 'border-green-500 bg-green-50'
                        : showIncorrect
                        ? 'border-red-500 bg-red-50'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`${showCorrect || showIncorrect ? 'font-semibold' : ''}`}>
                        {option}
                      </span>
                      {showCorrect && (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                      )}
                      {showIncorrect && (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
              }`}
            >
              <div className="flex items-start">
                {isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-semibold mb-1 ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                    {isCorrect ? 'Correct!' : 'Not quite.'}
                  </p>
                  <p className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center ${
              selectedAnswer === null
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg transform hover:scale-105'
            }`}
          >
            {showFeedback ? (
              currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  See My Results
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )
            ) : (
              'Submit Answer'
            )}
          </button>

          {/* Progress Dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentQuestionIndex
                    ? 'bg-purple-600 w-6'
                    : index < currentQuestionIndex
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Question generation logic
function generateQuestions(skills: string[], jobTitle: string): Question[] {
  const questionBank: Record<string, Question[]> = {
    'JavaScript': [
      {
        skill: 'JavaScript',
        question: 'What is the purpose of the "use strict" directive in JavaScript?',
        options: [
          'To enable strict mode, which catches common coding errors',
          'To improve performance of the code',
          'To enable new ES6 features',
          'To make variables globally accessible'
        ],
        correctAnswer: 0,
        explanation: 'The "use strict" directive enables strict mode, which helps catch common coding mistakes and prevents the use of certain error-prone features.'
      },
      {
        skill: 'JavaScript',
        question: 'Which method is used to add elements to the end of an array?',
        options: ['unshift()', 'push()', 'shift()', 'pop()'],
        correctAnswer: 1,
        explanation: 'The push() method adds one or more elements to the end of an array and returns the new length of the array.'
      }
    ],
    'React': [
      {
        skill: 'React',
        question: 'What is the primary purpose of React hooks like useState and useEffect?',
        options: [
          'To style components',
          'To manage state and side effects in functional components',
          'To optimize rendering performance',
          'To handle routing'
        ],
        correctAnswer: 1,
        explanation: 'React hooks allow you to use state and other React features in functional components without writing a class.'
      }
    ],
    'Python': [
      {
        skill: 'Python',
        question: 'What is a Python decorator?',
        options: [
          'A function that modifies another function',
          'A variable declaration',
          'A loop construct',
          'A data type'
        ],
        correctAnswer: 0,
        explanation: 'A decorator is a function that takes another function and extends its behavior without explicitly modifying it.'
      }
    ],
    'SQL': [
      {
        skill: 'SQL',
        question: 'Which SQL clause is used to filter results based on a condition?',
        options: ['SELECT', 'FROM', 'WHERE', 'ORDER BY'],
        correctAnswer: 2,
        explanation: 'The WHERE clause is used to filter records based on specified conditions.'
      }
    ],
    'Node.js': [
      {
        skill: 'Node.js',
        question: 'What is the purpose of package.json in a Node.js project?',
        options: [
          'To store database credentials',
          'To define project dependencies and metadata',
          'To configure the web server',
          'To compile JavaScript code'
        ],
        correctAnswer: 1,
        explanation: 'package.json contains metadata about the project and lists the packages that the project depends on.'
      }
    ],
    'TypeScript': [
      {
        skill: 'TypeScript',
        question: 'What is the main benefit of using TypeScript over JavaScript?',
        options: [
          'Faster execution speed',
          'Static type checking',
          'Smaller file sizes',
          'Better browser support'
        ],
        correctAnswer: 1,
        explanation: 'TypeScript adds static type checking, which helps catch errors during development rather than at runtime.'
      }
    ],
    'AWS': [
      {
        skill: 'AWS',
        question: 'Which AWS service is primarily used for object storage?',
        options: ['EC2', 'S3', 'RDS', 'Lambda'],
        correctAnswer: 1,
        explanation: 'Amazon S3 (Simple Storage Service) is designed for scalable object storage.'
      }
    ],
    'Docker': [
      {
        skill: 'Docker',
        question: 'What is a Docker container?',
        options: [
          'A virtual machine',
          'A lightweight, standalone executable package',
          'A cloud storage service',
          'A programming language'
        ],
        correctAnswer: 1,
        explanation: 'A Docker container is a lightweight, standalone, executable package that includes everything needed to run a piece of software.'
      }
    ],
    'default': [
      {
        skill: 'General',
        question: 'What is version control primarily used for?',
        options: [
          'To track and manage changes to code over time',
          'To compile code faster',
          'To encrypt source code',
          'To optimize database queries'
        ],
        correctAnswer: 0,
        explanation: 'Version control systems like Git help track changes to code, collaborate with others, and maintain project history.'
      }
    ]
  };

  const questions: Question[] = [];

  for (const skill of skills) {
    const skillQuestions = questionBank[skill] || questionBank['default'];
    const randomQuestion = skillQuestions[Math.floor(Math.random() * skillQuestions.length)];
    questions.push({ ...randomQuestion, skill });
  }

  return questions;
}
