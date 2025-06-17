
import { CertificationId } from './data/sampleQuestions';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  domain?: string; // Optional: To categorize questions by blueprint domain
}

export interface Certification {
  id: CertificationId; // Changed from string to CertificationId
  name: string; // e.g., "AWS Certified Solutions Architect - Associate"
  questions: Question[];
  description?: string; // Short description of the certification
}

export type QuizState = 'SELECT_CERT' | 'QUIZ_IN_PROGRESS' | 'QUIZ_COMPLETED' | 'LOADING_QUESTIONS';

export interface UserAnswer {
  questionId: string;
  selectedOptionIndex: number | null; // null if skipped or unanswered
  isCorrect: boolean | null; // null if skipped
}

export interface HistoricalScore {
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: number;
  certificationName: string; // To display in a potential future history view
}