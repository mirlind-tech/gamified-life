import { useGame } from '../store/useGame';
import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense } from 'react';

const TreeView = lazy(() => import('../views/TreeView').then(m => ({ default: m.TreeView })));
const CardsView = lazy(() => import('../views/CardsView').then(m => ({ default: m.CardsView })));
const AchievementsView = lazy(() => import('../views/AchievementsView').then(m => ({ default: m.AchievementsView })));
const FocusView = lazy(() => import('../views/FocusView').then(m => ({ default: m.FocusView })));
const JournalView = lazy(() => import('../views/JournalView').then(m => ({ default: m.JournalView })));
const HabitsView = lazy(() => import('../views/HabitsView').then(m => ({ default: m.HabitsView })));
const CoachView = lazy(() => import('../views/CoachView').then(m => ({ default: m.CoachView })));
const MeditationView = lazy(() => import('../views/MeditationView').then(m => ({ default: m.MeditationView })));
const ChallengesView = lazy(() => import('../views/ChallengesView').then(m => ({ default: m.ChallengesView })));
const CharacterProfileView = lazy(() => import('../views/CharacterProfileView').then(m => ({ default: m.CharacterProfileView })));
const AuthView = lazy(() => import('../views/AuthView').then(m => ({ default: m.AuthView })));
const ProtocolView = lazy(() => import('../views/ProtocolView').then(m => ({ default: m.ProtocolView })));
const SkillsRoadmapView = lazy(() => import('../views/SkillsRoadmapView').then(m => ({ default: m.SkillsRoadmapView })));
const FangYuanView = lazy(() => import('../views/cards/FangYuanView').then(m => ({ default: m.FangYuanView })));
const ChartsView = lazy(() => import('../views/ChartsView'));
const PhotoProgress = lazy(() => import('../components/PhotoProgress').then(m => ({ default: m.PhotoProgress })));
const MindHQView = lazy(() => import('../views/MindHQView').then(m => ({ default: m.MindHQView })));
const BodyHQView = lazy(() => import('../views/BodyHQView').then(m => ({ default: m.BodyHQView })));
const CareerHQView = lazy(() => import('../views/CareerHQView').then(m => ({ default: m.CareerHQView })));
const FinanceHQView = lazy(() => import('../views/FinanceHQView').then(m => ({ default: m.FinanceHQView })));
const GermanHQView = lazy(() => import('../views/GermanHQView').then(m => ({ default: m.GermanHQView })));
const WeeklyPlanView = lazy(() => import('../views/WeeklyPlanView').then(m => ({ default: m.WeeklyPlanView })));
const WeeklyReviewView = lazy(() => import('../views/WeeklyReviewView').then(m => ({ default: m.WeeklyReviewView })));
const AssessmentView = lazy(() => import('../views/AssessmentView').then(m => ({ default: m.AssessmentView })));
const InsightsView = lazy(() => import('../views/InsightsView').then(m => ({ default: m.InsightsView })));

function ViewLoadingFallback() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse">
      <div className="h-6 w-40 bg-white/10 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-white/8 rounded" />
        <div className="h-4 w-4/5 bg-white/8 rounded" />
        <div className="h-4 w-3/5 bg-white/8 rounded" />
      </div>
    </div>
  );
}

export function MainContent() {
  const { state, setView } = useGame();
  const { currentView } = state;

  const renderView = () => {
    switch (currentView) {
      case 'command':
        return (
          <ProtocolView
            initialTab="daily"
            headerTitle="🧭 Command Center"
            headerHint="Weekly planner and execution board across all domains."
          />
        );
      case 'body':
        return <BodyHQView />;
      case 'mind':
        return <MindHQView />;
      case 'career':
        return <CareerHQView />;
      case 'finance':
        return <FinanceHQView />;
      case 'german':
        return <GermanHQView />;
      case 'tree':
        return <TreeView />;
      case 'cards':
        return <CardsView />;
      case 'analytics':
        return <CharacterProfileView />;
      case 'achievements':
        return <AchievementsView />;
      case 'focus':
        return <FocusView />;
      case 'journal':
        return <JournalView />;
      case 'habits':
        return <HabitsView />;
      case 'coach':
        return <CoachView />;
      case 'meditate':
        return <MeditationView />;
      case 'education':
        return <CardsView />;
      case 'challenges':
        return <ChallengesView />;
      case 'protocol':
        return <ProtocolView initialTab="daily" />;
      case 'auth':
        return <AuthView />;
      case 'skills-roadmap':
      case 'tech-stack':
        return <SkillsRoadmapView />;
      case 'character-profile':
        return <CharacterProfileView />;
      case 'fangyuan':
        return <FangYuanView />;
      case 'photo-progress':
        return <PhotoProgress />;
      case 'charts':
        return <ChartsView setView={setView} />;
      case 'weekly-plan':
        return <WeeklyPlanView />;
      case 'weekly-review':
        return <WeeklyReviewView />;
      case 'assessment':
        return <AssessmentView />;
      case 'insights':
        return <InsightsView />;
      default:
        return <ProtocolView initialTab="daily" />;
    }
  };

  return (
    <main className="relative z-10 flex-1 overflow-auto p-4 lg:p-6 pt-16 lg:pt-6" tabIndex={0} role="main" aria-label="Main content">
      {/* Confetti container - accessibility: decorative content inside landmark */}
      <div id="confetti-container" role="presentation" aria-hidden="true" className="fixed inset-0 pointer-events-none z-9999" />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Suspense fallback={<ViewLoadingFallback />}>
            {renderView()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
