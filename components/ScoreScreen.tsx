
import React, { useState, useEffect, useMemo } from 'react';
import { Question, UserAnswer, HistoricalScore } from '../types';
import { CertificationId } from '../data/sampleQuestions';
import { CheckIcon, XIcon } from './icons/FeedbackIcons';
import { RotateCwIcon } from './icons/ActionIcons';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/NavigationIcons';

interface ScoreScreenProps {
  score: number;
  totalQuestions: number;
  userAnswers: UserAnswer[];
  questions: Question[];
  certificationName: string;
  certificationId: CertificationId;
  onRestartQuiz: () => void;
  onChangeCertification: () => void;
}

interface DomainPerformance {
  domainName: string;
  correct: number;
  total: number;
  percentage: number;
}

interface TopicToStudy {
  topic: string;
  count: number;
}

const AWS_SERVICE_KEYWORDS: string[] = [
  'EC2', 'Amazon EC2', 'Elastic Compute Cloud',
  'S3', 'Amazon S3', 'Simple Storage Service',
  'Lambda', 'AWS Lambda',
  'DynamoDB', 'Amazon DynamoDB',
  'SQS', 'Amazon SQS', 'Simple Queue Service',
  'SNS', 'Amazon SNS', 'Simple Notification Service',
  'RDS', 'Amazon RDS', 'Relational Database Service',
  'VPC', 'Amazon VPC', 'Virtual Private Cloud',
  'IAM', 'AWS IAM', 'Identity and Access Management',
  'CloudFormation', 'AWS CloudFormation',
  'Elastic Beanstalk', 'AWS Elastic Beanstalk',
  'CloudFront', 'Amazon CloudFront',
  'Route 53', 'Amazon Route 53',
  'API Gateway', 'Amazon API Gateway',
  'Cognito', 'Amazon Cognito',
  'KMS', 'AWS KMS', 'Key Management Service',
  'WAF', 'AWS WAF', 'Web Application Firewall',
  'Shield', 'AWS Shield',
  'CloudWatch', 'Amazon CloudWatch',
  'CloudTrail', 'AWS CloudTrail',
  'X-Ray', 'AWS X-Ray',
  'Step Functions', 'AWS Step Functions',
  'EventBridge', 'Amazon EventBridge', 'CloudWatch Events',
  'ElastiCache', 'Amazon ElastiCache',
  'EFS', 'Amazon EFS', 'Elastic File System',
  'Direct Connect', 'AWS Direct Connect',
  'Global Accelerator', 'AWS Global Accelerator',
  'Auto Scaling', 'AWS Auto Scaling',
  'SageMaker', 'Amazon SageMaker',
  'Rekognition', 'Amazon Rekognition',
  'Polly', 'Amazon Polly',
  'Lex', 'Amazon Lex',
  'Comprehend', 'Amazon Comprehend',
  'Translate', 'Amazon Translate',
  'Textract', 'Amazon Textract',
  'Kendra', 'Amazon Kendra',
  'Personalize', 'Amazon Personalize',
  'Forecast', 'Amazon Forecast',
  'Fraud Detector', 'Amazon Fraud Detector',
  'Bedrock', 'Amazon Bedrock',
  'Systems Manager', 'AWS Systems Manager',
  'Secrets Manager', 'AWS Secrets Manager',
  'CodeDeploy', 'AWS CodeDeploy',
  'CodePipeline', 'AWS CodePipeline',
  'CodeBuild', 'AWS CodeBuild',
  'CodeCommit', 'AWS CodeCommit',
  'Security Group', 'Security Groups',
  'NACL', 'Network ACL', 'Network ACLs',
  'IAM Role', 'IAM Roles', 'IAM User', 'IAM Policy',
  'Subnet', 'Subnets',
  'Availability Zone', 'Availability Zones',
  'Region', 'Regions'
];


const ScoreScreen: React.FC<ScoreScreenProps> = ({
  score,
  totalQuestions,
  userAnswers,
  questions,
  certificationName,
  certificationId,
  onRestartQuiz,
  onChangeCertification,
}) => {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0);
  const [performanceTrendMessage, setPerformanceTrendMessage] = useState<string | null>(null);

  const domainPerformance: DomainPerformance[] = useMemo(() => {
    const domains: Record<string, { correct: number; total: number }> = {};
    questions.forEach(q => {
      const domain = q.domain || 'Não Categorizado';
      if (!domains[domain]) {
        domains[domain] = { correct: 0, total: 0 };
      }
      domains[domain].total++;
      const userAnswer = userAnswers.find(ua => ua.questionId === q.id);
      if (userAnswer?.isCorrect) {
        domains[domain].correct++;
      }
    });
    return Object.entries(domains).map(([domainName, data]) => ({
      domainName,
      ...data,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    })).sort((a,b) => b.percentage - a.percentage);
  }, [questions, userAnswers]);

  const topicsToStudy: TopicToStudy[] = useMemo(() => {
    const topicCounts: Record<string, number> = {};
    const incorrectQuestionIds = userAnswers
      .filter(ua => !ua.isCorrect && ua.selectedOptionIndex !== null)
      .map(ua => ua.questionId);

    incorrectQuestionIds.forEach(qId => {
      const question = questions.find(q => q.id === qId);
      if (question) {
        const questionText = `${question.text.toLowerCase()} ${question.explanation.toLowerCase()}`;
        const foundTopicsInQuestion = new Set<string>(); 

        AWS_SERVICE_KEYWORDS.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
          if (regex.test(questionText)) {
            const primaryKeyword = AWS_SERVICE_KEYWORDS.find(k => keyword.toLowerCase().includes(k.toLowerCase())) || keyword;
            foundTopicsInQuestion.add(primaryKeyword);
          }
        });
        
        foundTopicsInQuestion.forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });
    
    return Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count) 
      .slice(0, 5); 
  }, [userAnswers, questions]);

  useEffect(() => {
    if (!certificationId || totalQuestions === 0) return;
    const storageKey = `quizHistory_${certificationId}`;
    let history: HistoricalScore[] = [];
    try {
      const storedHistory = localStorage.getItem(storageKey);
      if (storedHistory) {
        history = JSON.parse(storedHistory);
      }
    } catch (e) {
      console.error("Falha ao carregar histórico do localStorage:", e);
      history = [];
    }
    const lastAttempt = history.length > 0 ? history[history.length - 1] : null;
    if (lastAttempt) {
      if (percentage > lastAttempt.percentage) {
        setPerformanceTrendMessage(`Parabéns! Você melhorou ${percentage - lastAttempt.percentage}% em relação à sua última tentativa (${lastAttempt.percentage}%).`);
      } else if (percentage < lastAttempt.percentage) {
        setPerformanceTrendMessage(`Desta vez (${percentage}%) foi um pouco abaixo da sua última tentativa (${lastAttempt.percentage}%). Continue praticando!`);
      } else {
        setPerformanceTrendMessage(`Você manteve o mesmo desempenho da sua última tentativa (${percentage}%).`);
      }
    } else {
      setPerformanceTrendMessage(`Esta é sua primeira tentativa registrada para ${certificationName}. Continue assim!`);
    }
    const currentAttempt: HistoricalScore = {
      score,
      totalQuestions,
      percentage,
      timestamp: Date.now(),
      certificationName,
    };
    history.push(currentAttempt);
    try {
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (e) {
      console.error("Falha ao salvar histórico no localStorage:", e);
    }
  }, [score, totalQuestions, certificationId, certificationName, percentage]);

  const currentReviewQuestion = questions[reviewQuestionIndex];
  const correspondingUserAnswer = userAnswers.find(ua => ua.questionId === currentReviewQuestion?.id);

  if (reviewMode && currentReviewQuestion && correspondingUserAnswer) {
    return (
      <div className="bg-gray-50 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200 w-full">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">Revisando Questão {reviewQuestionIndex + 1} de {questions.length}</h2>
        <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">{currentReviewQuestion.text}</h3>
          <div className="space-y-3">
            {currentReviewQuestion.options.map((option, index) => {
              const isSelected = correspondingUserAnswer.selectedOptionIndex === index;
              const isCorrect = currentReviewQuestion.correctAnswerIndex === index;
              let optionClass = "div block w-full text-left p-4 rounded-md border-2 border-gray-300 text-gray-700 bg-white cursor-default";
              if (isSelected) {
                optionClass += isCorrect ? ' selected correct' : ' selected incorrect';
              } else if (isCorrect) {
                optionClass += ' correct-reveal';
              }
              return (
                <div key={index} className={optionClass}>
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                  {isSelected && isCorrect && <CheckIcon className="h-6 w-6 text-white inline ml-2" />}
                  {isSelected && !isCorrect && <XIcon className="h-6 w-6 text-white inline ml-2" />}
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 bg-white rounded-md border border-blue-300 shadow-sm">
            <h4 className="text-md font-semibold mb-2 text-blue-600">Explicação:</h4>
            <p className="text-gray-700 text-sm leading-relaxed">{currentReviewQuestion.explanation}</p>
          </div>
           {currentReviewQuestion.domain && (
            <p className="text-xs text-gray-500 mt-4 text-center">Domínio: {currentReviewQuestion.domain}</p>
          )}
        </div>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setReviewQuestionIndex(prev => Math.max(prev - 1, 0))}
            disabled={reviewQuestionIndex === 0}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            aria-label="Revisar Questão Anterior"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" /> Anterior
          </button>
          <button
            onClick={() => setReviewQuestionIndex(prev => Math.min(prev + 1, questions.length - 1))}
            disabled={reviewQuestionIndex === questions.length - 1}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            aria-label="Revisar Próxima Questão"
          >
            Próxima <ChevronRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
        <button
          onClick={() => setReviewMode(false)}
          className="w-full mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Voltar para Pontuação
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-8 rounded-xl shadow-xl border-gray-200 text-center w-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Concluído!</h2>
      <p className="text-lg text-gray-700 mb-6">Resultados para {certificationName}</p>

      <div className="my-8">
        <div className={`text-6xl font-bold ${percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
          {percentage}%
        </div>
        <p className="text-2xl text-gray-800 mt-2">
          Você acertou {score} de {totalQuestions} questões.
        </p>
      </div>

      {performanceTrendMessage && (
        <p className="text-md text-gray-600 mb-6 italic">{performanceTrendMessage}</p>
      )}

      {percentage >= 70 ? (
        <p className="text-green-600 mb-8 text-lg">Parabéns! Você passou no exame simulado.</p>
      ) : (
        <p className="text-red-600 mb-8 text-lg">Continue praticando! Você pode melhorar sua pontuação.</p>
      )}

      <div className="my-6 pt-6 border-t border-gray-300">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Desempenho por Domínio:</h3>
        {domainPerformance.length > 0 ? (
          <div className="space-y-4 text-left max-w-md mx-auto">
            {domainPerformance.map(dp => (
              <div key={dp.domainName} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-blue-600">{dp.domainName}</span>
                  <span className={`font-bold ${dp.percentage >= 70 ? 'text-green-600' : dp.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {dp.percentage}%
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {dp.correct} de {dp.total} corretas
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className={`h-2.5 rounded-full ${dp.percentage >= 70 ? 'bg-green-500' : dp.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${dp.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={dp.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progresso em ${dp.domainName}: ${dp.percentage}%`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Nenhuma informação de domínio disponível para estas questões.</p>
        )}
      </div>

      {topicsToStudy.length > 0 && (
        <div className="my-6 pt-6 border-t border-gray-300">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Tópicos para Focar:</h3>
          <ul className="space-y-3 text-left max-w-md mx-auto">
            {topicsToStudy.map(item => (
              <li key={item.topic} className="bg-white p-3 rounded-lg shadow border border-gray-200">
                <span className="font-semibold text-blue-600">{item.topic}</span>
                <span className="text-sm text-gray-700 ml-2">
                  ({item.count} {item.count > 1 ? 'questões erradas' : 'questão errada'})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row justify-center">
        <button
          onClick={onRestartQuiz}
          className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          aria-label="Tentar Novamente o Quiz"
        >
          <RotateCwIcon className="h-5 w-5 mr-2" />
          Tentar Novamente
        </button>
        <button
          onClick={() => setReviewMode(true)}
          disabled={questions.length === 0}
          className="w-full md:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          aria-label="Revisar Respostas"
        >
          Revisar Respostas
        </button>
        <button
          onClick={onChangeCertification}
          className="w-full md:w-auto px-6 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
          aria-label="Escolher Outra Certificação"
        >
          Escolher Outra Certificação
        </button>
      </div>
    </div>
  );
};

export default ScoreScreen;