'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Question = {
  num1: number;
  num2: number;
  operator: string;
  correctAnswer: number;
  options: number[];
  userAnswer: number | null;
  isCorrect: boolean | null;
  timedOut: boolean;
};

export default function Game() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (gameStarted && !gameFinished) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStarted, gameFinished, currentQuestionIndex]);

  const generateQuestions = () => {
    const operators = ['+', '-', 'x', '/'];
    const generatedQuestions: Question[] = [];
    const usedEquations = new Set();

    while (generatedQuestions.length < 10) {
      const num1 = Math.floor(Math.random() * 10);
      const num2 = Math.floor(Math.random() * 10);
      const operator = operators[Math.floor(Math.random() * operators.length)];
      
      // For division, ensure we have whole number results
      if (operator === '/' && (num2 === 0 || num1 % num2 !== 0)) {
        continue;
      }

      const equation = `${num1}${operator}${num2}`;
      if (usedEquations.has(equation)) {
        continue;
      }
      usedEquations.add(equation);

      let correctAnswer;
      switch (operator) {
        case '+':
          correctAnswer = num1 + num2;
          break;
        case '-':
          correctAnswer = num1 - num2;
          break;
        case 'x':
          correctAnswer = num1 * num2;
          break;
        case '/':
          correctAnswer = num1 / num2;
          break;
        default:
          correctAnswer = 0;
      }

      // Generate options (including the correct answer)
      const options = [correctAnswer];
      while (options.length < 4) {
        const randomOption = Math.floor(Math.random() * 81) - 40; // Range from -40 to 40
        if (!options.includes(randomOption)) {
          options.push(randomOption);
        }
      }

      // Shuffle options
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      generatedQuestions.push({
        num1,
        num2,
        operator,
        correctAnswer,
        options,
        userAnswer: null,
        isCorrect: null,
        timedOut: false
      });
    }

    return generatedQuestions;
  };

  const startGame = () => {
    const newQuestions = generateQuestions();
    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setTimeLeft(30);
    setGameStarted(true);
    setGameFinished(false);
    setScore(0);
  };

  const handleAnswer = (selectedAnswer: number) => {
    const updatedQuestions = [...questions];
    const currentQuestion = updatedQuestions[currentQuestionIndex];
    
    currentQuestion.userAnswer = selectedAnswer;
    currentQuestion.isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    if (currentQuestion.isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setQuestions(updatedQuestions);
    
    if (currentQuestionIndex < 9) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(30);
    } else {
      finishGame(updatedQuestions);
    }
  };

  const handleTimeout = () => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].timedOut = true;
    
    setQuestions(updatedQuestions);
    
    if (currentQuestionIndex < 9) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(30);
    } else {
      finishGame(updatedQuestions);
    }
  };

  const finishGame = async (finalQuestions: Question[]) => {
    setGameFinished(true);
    
    // Prepare data for saving
    const gameData = {
      score,
      questions: finalQuestions.map(q => ({
        equation: `${q.num1} ${q.operator} ${q.num2}`,
        userAnswer: q.userAnswer !== null ? q.userAnswer.toString() : 'No answer',
        correctAnswer: q.correctAnswer.toString(),
        isCorrect: q.isCorrect,
        timedOut: q.timedOut
      }))
    };
    
    try {
      await fetch('/api/game/save-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });
    } catch (error) {
      console.error('Failed to save game results:', error);
    }
  };

  const goToHome = () => {
    router.push('/profile');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Math Game
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Test your math skills with 10 random questions
            </p>
          </div>
          
          <div className="mt-8">
            <button
              onClick={startGame}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Game Results</h2>
            
            <div className="text-center mb-8">
              <p className="text-3xl font-bold text-indigo-600">{score}/10</p>
              <p className="text-gray-600 mt-2">Your Score</p>
            </div>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Question Details</h3>
              
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className={`p-4 rounded-lg ${
                    question.isCorrect ? 'bg-green-50' : 
                    question.timedOut ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <p className="font-medium">
                      Question {index + 1}: {question.num1} {question.operator} {question.num2}
                    </p>
                    <p className="mt-2">
                      <span className="text-gray-600">Correct Answer:</span> {question.correctAnswer}
                    </p>
                    <p className="mt-1">
                      <span className="text-gray-600">Your Answer:</span> {
                        question.timedOut ? 'Time Out' : 
                        question.userAnswer !== null ? question.userAnswer : 'No answer'
                      }
                    </p>
                    <p className="mt-1">
                      <span className="text-gray-600">Result:</span> {
                        question.timedOut ? 'Time Out' : 
                        question.isCorrect ? 'Correct' : 'Incorrect'
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8">
              <button
                onClick={goToHome}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Question {currentQuestionIndex + 1}/10</h2>
            <div className="text-xl font-medium text-indigo-600">
              Time: {timeLeft}s
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="flex justify-center items-center space-x-4 text-3xl font-bold">
              <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg shadow">
                {questions[currentQuestionIndex]?.num1}
              </div>
              <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg shadow">
                {questions[currentQuestionIndex]?.operator}
              </div>
              <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg shadow">
                {questions[currentQuestionIndex]?.num2}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {questions[currentQuestionIndex]?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className="py-4 px-6 bg-white border border-gray-300 rounded-lg shadow-sm text-lg font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {option}
              </button>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Score: {score}/{currentQuestionIndex}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}