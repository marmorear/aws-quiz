import React, { useState, useEffect, useCallback } from 'react';
import { Question, UserAnswer } from '../types';
import QuestionCard from './QuestionCard';
import Timer from './Timer';
import ConfirmModal from './ConfirmModal'; // Import the new modal
import { ChevronLeftIcon, ChevronRightIcon } from './icons/NavigationIcons';
import { HomeIcon, PauseIcon, PlayIcon } from './icons/ActionIcons';

interface QuizViewProps {
  questions: Question[];
  certificationName: string;
  certificationId: string;
  onQuizComplete: (userAnswers: UserAnswer[], score: number) => void;
  onGoToMenu: () => void;
}

const TOTAL_QUIZ_TIME_SECONDS = 60 * 60; // 60 minutes

const QuizView: React.FC<QuizViewProps> = ({ questions, certificationName, certificationId, onQuizComplete, onGoToMenu }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>(
    questions.map(q => ({ questionId: q.id, selectedOptionIndex: null, isCorrect: null }))
  );
  const [quizOverByTime, setQuizOverByTime] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for modal

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers.find(ua => ua.questionId === currentQuestion?.id) ||
                       { questionId: currentQuestion?.id || '', selectedOptionIndex: null, isCorrect: null };


  const handleAnswerSelect = useCallback((questionId: string, selectedOptionIndex: number) => {
    if (isPaused || isConfirmModalOpen) return; 
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = question.correctAnswerIndex === selectedOptionIndex;
    setUserAnswers(prevAnswers =>
      prevAnswers.map(ans =>
        ans.questionId === questionId
          ? { ...ans, selectedOptionIndex, isCorrect }
          : ans
      )
    );
  }, [questions, isPaused, isConfirmModalOpen]);

  const goToNextQuestion = useCallback(() => {
    if (isPaused || isConfirmModalOpen) return;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      const score = userAnswers.filter(ans => ans.isCorrect).length;
      onQuizComplete(userAnswers, score);
    }
  }, [currentQuestionIndex, questions.length, userAnswers, onQuizComplete, isPaused, isConfirmModalOpen]);

  const goToPreviousQuestion = useCallback(() => {
    if (isPaused || isConfirmModalOpen) return;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  }, [currentQuestionIndex, isPaused, isConfirmModalOpen]);

  const handleTimeUp = useCallback(() => {
    setQuizOverByTime(true);
    setUserAnswers(currentAnswers => {
        const score = currentAnswers.filter(ans => ans.isCorrect).length;
        onQuizComplete(currentAnswers, score);
        return currentAnswers;
    });
  }, [onQuizComplete]);

  useEffect(() => {
    setUserAnswers(questions.map(q => ({ questionId: q.id, selectedOptionIndex: null, isCorrect: null })));
    setCurrentQuestionIndex(0);
    setQuizOverByTime(false);
    setIsPaused(false); 
    setIsConfirmModalOpen(false); // Reset modal state
  }, [questions, certificationId]);


  if (quizOverByTime) {
    return (
      <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-red-600 mb-4">Tempo Esgotado!</h2>
        <p className="text-gray-700 mb-6">O tempo do quiz expirou. Seus resultados estão sendo calculados.</p>
      </div>
    );
  }

  if (!currentQuestion && !isPaused) {
     return <div className="text-center p-8 text-gray-700">Carregando questão... Se nenhuma questão aparecer, pode não haver questões suficientes disponíveis para este ciclo de tentativa.</div>;
  }

  const isCurrentQuestionAnswered = currentAnswer?.selectedOptionIndex !== null;

  const handleGoToMenuClick = () => {
    setIsConfirmModalOpen(true); // Open the custom modal
  };

  const handleConfirmExit = () => {
    onGoToMenu();
    setIsConfirmModalOpen(false);
  };

  const handleCancelExit = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Confirmar Saída"
        message="Tem certeza que deseja voltar ao menu? Seu progresso no quiz atual será perdido."
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
      <div className={`bg-gray-50 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200 w-full ${isConfirmModalOpen ? 'filter blur-sm' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleGoToMenuClick}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            aria-label="Voltar ao Menu"
            title="Voltar ao Menu"
            disabled={isConfirmModalOpen}
          >
            <HomeIcon className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold text-blue-600 hidden sm:block">
            Questão {currentQuestionIndex + 1} de {questions.length}
          </h2>
           <div className="flex items-center space-x-3">
            <Timer initialTime={TOTAL_QUIZ_TIME_SECONDS} onTimeUp={handleTimeUp} key={`${questions.length}-${certificationId}`} isPaused={isPaused} />
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-200"
              aria-label={isPaused ? "Continuar Quiz" : "Pausar Quiz"}
              title={isPaused ? "Continuar Quiz" : "Pausar Quiz"}
              disabled={isConfirmModalOpen}
            >
              {isPaused ? <PlayIcon className="h-6 w-6" /> : <PauseIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
         <div className="sm:hidden text-center mb-4 text-md font-semibold text-blue-600">
             Questão {currentQuestionIndex + 1} de {questions.length}
         </div>

        {isPaused ? (
          <div className="text-center py-16 my-8 bg-white rounded-lg shadow-inner">
            <h3 className="text-3xl font-bold text-gray-700 mb-3">Quiz Pausado</h3>
            <p className="text-gray-600">Clique no botão <PlayIcon className="inline h-5 w-5" /> para continuar.</p>
          </div>
        ) : currentQuestion ? (
          <>
            <QuestionCard
              question={currentQuestion}
              onAnswerSelect={handleAnswerSelect}
              userAnswer={currentAnswer?.selectedOptionIndex ?? null}
              showFeedback={isCurrentQuestionAnswered}
            />
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0 || isPaused || isConfirmModalOpen}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Questão Anterior"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-2" />
                Anterior
              </button>
              <button
                onClick={goToNextQuestion}
                disabled={(!isCurrentQuestionAnswered && currentQuestionIndex < questions.length - 1) || isPaused || isConfirmModalOpen}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={currentQuestionIndex === questions.length - 1 ? 'Finalizar Quiz' : 'Próxima Questão'}
              >
                {currentQuestionIndex === questions.length - 1 ? 'Finalizar Quiz' : 'Próxima Questão'}
                {currentQuestionIndex < questions.length - 1 && <ChevronRightIcon className="h-5 w-5 ml-2" />}
              </button>
            </div>
            {currentQuestion.domain && (
              <p className="text-xs text-gray-500 mt-4 text-center">Domínio: {currentQuestion.domain}</p>
            )}
          </>
        ) : (
           <div className="text-center p-8 text-gray-700">Carregando questão...</div>
        )
      }
      </div>
    </>
  );
};

export default QuizView;