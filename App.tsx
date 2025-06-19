
import React, { useState, useEffect, useCallback } from 'react';
import { Certification, Question, QuizState, UserAnswer } from './types';
import { CERTIFICATIONS_DATA, CertificationId } from './data/sampleQuestions';
import CertificationSelector from './components/CertificationSelector';
import QuizView from './components/QuizView';
import ScoreScreen from './components/ScoreScreen';

const QUIZ_QUESTIONS_COUNT = 60; 
const LOCAL_STORAGE_CYCLE_KEY = 'quizCycleState';

interface QuizCycleState {
  cycleAttemptNumber: number; 
  questionIdsUsedInCycle: string[];
}

const App: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>('SELECT_CERT');
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [score, setScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const handleSelectCertification = useCallback(async (certificationId: CertificationId) => {
    setIsLoading(true);
    setError(null);
    try {
      const certData = CERTIFICATIONS_DATA[certificationId];
      if (!certData) {
        throw new Error("Dados da certificação não encontrados.");
      }
      setSelectedCertification(certData);

      let allQuizCycleStates: Record<string, QuizCycleState> = {};
      try {
        const storedState = localStorage.getItem(LOCAL_STORAGE_CYCLE_KEY);
        if (storedState) {
          allQuizCycleStates = JSON.parse(storedState);
        }
      } catch (e) {
        console.error("Falha ao carregar estado do ciclo do quiz do localStorage:", e);
      }
      
      let certCycleState = allQuizCycleStates[certificationId] || { cycleAttemptNumber: 1, questionIdsUsedInCycle: [] };

      if (certCycleState.cycleAttemptNumber > 3) { 
        certCycleState = { cycleAttemptNumber: 1, questionIdsUsedInCycle: [] };
      }
      
      let { cycleAttemptNumber, questionIdsUsedInCycle } = certCycleState;
      
      let eligibleQuestions = certData.questions.filter(q => !questionIdsUsedInCycle.includes(q.id));

      if (eligibleQuestions.length < QUIZ_QUESTIONS_COUNT && certData.questions.length >= QUIZ_QUESTIONS_COUNT) {
        if (cycleAttemptNumber > 1 || questionIdsUsedInCycle.length > 0) {
            cycleAttemptNumber = 1;
            questionIdsUsedInCycle = [];
            eligibleQuestions = [...certData.questions]; 
        }
      }

      const shuffledEligibleQuestions = shuffleArray(eligibleQuestions);
      const selectedQuestionsForQuiz = shuffledEligibleQuestions.slice(0, QUIZ_QUESTIONS_COUNT);
      
      const newQuestionIdsUsedInCycle = [...questionIdsUsedInCycle, ...selectedQuestionsForQuiz.map(q => q.id)];
      const nextCycleAttemptNumber = cycleAttemptNumber + 1;
      
      allQuizCycleStates[certificationId] = {
        cycleAttemptNumber: nextCycleAttemptNumber, 
        questionIdsUsedInCycle: newQuestionIdsUsedInCycle
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_CYCLE_KEY, JSON.stringify(allQuizCycleStates));
      } catch (e) {
        console.error("Falha ao salvar estado do ciclo do quiz no localStorage:", e);
      }

      setQuestions(selectedQuestionsForQuiz);
      setUserAnswers([]);
      setScore(0);
      setQuizState('QUIZ_IN_PROGRESS');

    } catch (err) {
      console.error("Falha ao carregar dados da certificação:", err);
      setError(err instanceof Error ? err.message : "Falha ao carregar as questões. Por favor, tente novamente.");
      setQuizState('SELECT_CERT');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQuizComplete = useCallback((finalAnswers: UserAnswer[], finalScore: number) => {
    setUserAnswers(finalAnswers);
    setScore(finalScore);
    setQuizState('QUIZ_COMPLETED');
  }, []);

  const resetQuizState = useCallback(() => {
    setSelectedCertification(null);
    setQuestions([]);
    setUserAnswers([]);
    setScore(0);
    setQuizState('SELECT_CERT');
  }, []);

  const handleRestartQuiz = useCallback(() => {
    if (selectedCertification) {
      handleSelectCertification(selectedCertification.id);
    }
  }, [selectedCertification, handleSelectCertification]);

  const handleChangeCertification = useCallback(() => {
    resetQuizState();
  }, [resetQuizState]);

  const handleGoToMenu = useCallback(() => {
    resetQuizState();
  }, [resetQuizState]);
  

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center p-4 selection:bg-blue-300 selection:text-black">
      <header className="w-full max-w-4xl py-6 mb-8 text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">
          Simulador de Quiz de Certificação AWS
        </h1>
        {selectedCertification && quizState !== 'SELECT_CERT' && (
          <p className="text-xl text-gray-700 mt-2">{selectedCertification.name}</p>
        )}
      </header>

      <main className={`w-full ${quizState === 'QUIZ_IN_PROGRESS' ? 'max-w-3xl' : 'max-w-4xl'} flex-grow`}>
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <p className="ml-4 text-xl text-gray-700">Carregando Questões...</p>
          </div>
        )}
        {error && (
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Erro:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {quizState === 'SELECT_CERT' && (
              <CertificationSelector
                certifications={Object.values(CERTIFICATIONS_DATA)}
                onSelectCertification={handleSelectCertification}
              />
            )}
            {quizState === 'QUIZ_IN_PROGRESS' && questions.length > 0 && selectedCertification && (
              <QuizView
                questions={questions}
                certificationName={selectedCertification.name}
                certificationId={selectedCertification.id}
                onQuizComplete={handleQuizComplete}
                onGoToMenu={handleGoToMenu} 
              />
            )}
            {quizState === 'QUIZ_COMPLETED' && selectedCertification && (
              <ScoreScreen
                score={score}
                totalQuestions={questions.length} 
                userAnswers={userAnswers}
                questions={questions}
                certificationName={selectedCertification.name}
                certificationId={selectedCertification.id} 
                onRestartQuiz={handleRestartQuiz}
                onChangeCertification={handleChangeCertification}
              />
            )}
            {quizState === 'QUIZ_IN_PROGRESS' && questions.length === 0 && selectedCertification && !isLoading && (
              <div className="text-center p-8 bg-gray-50 rounded-lg shadow-xl border border-gray-200">
                <h2 className="text-2xl font-bold text-blue-600 mb-4">Sem Questões Disponíveis</h2>
                <p className="text-gray-700 mb-6">
                  Não há questões suficientes para este quiz no momento, de acordo com as regras de repetição.
                  Isso pode acontecer se todas as questões disponíveis já foram usadas recentemente ou se o banco de questões é menor que o necessário.
                  Tente outra certificação ou volte mais tarde.
                </p>
                <button
                  onClick={handleChangeCertification}
                  className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Escolher Outra Certificação
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="w-full max-w-4xl text-center py-6 text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Simulador de Quiz AWS. Apenas para fins educacionais.</p>
        <p>Este não é um produto oficial da AWS. As questões são exemplos baseados em blueprints públicos.</p>
        <p>🌈 Feito por @marmorear 🌈 </p>
      </footer>
    </div>
  );
};

export default App;
