import type { FangYuanTeaching, QuizQuestion } from '../../data/fangyuan';

export interface MindsetTabProps {
  teachings: FangYuanTeaching[];
  dailyTeaching: FangYuanTeaching | null;
  selectedTeaching: FangYuanTeaching | null;
  setSelectedTeaching: (t: FangYuanTeaching | null) => void;
  quizQuestion: QuizQuestion | null;
  quizAnswered: number | null;
  showQuizResult: boolean;
  onStartQuiz: () => void;
  onAnswerQuiz: (index: number) => void;
}
