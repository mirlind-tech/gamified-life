import { useGame } from '../store/useGame';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  TreeView, 
  CardsView, 
  QuestsView, 
  GatesView, 
  AchievementsView, 
  FocusView, 
  JournalView, 
  HabitsView, 
  CoachView,
  MeditationView,
  NotificationsView,
  ChallengesView,
  CharacterProfileView,
  AuthView,
  ProtocolView,
} from '../views';

export function MainContent() {
  const { state } = useGame();
  const { currentView } = state;

  const renderView = () => {
    switch (currentView) {
      case 'tree':
        return <TreeView />;
      case 'cards':
        return <CardsView />;
      case 'quests':
        return <QuestsView />;
      case 'gates':
        return <GatesView />;
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
      case 'notifications':
        return <NotificationsView />;
      case 'education':
        return <CardsView />;
      case 'challenges':
        return <ChallengesView />;
      case 'protocol':
        return <ProtocolView />;
      case 'auth':
        return <AuthView />;
      default:
        return <ProtocolView />;
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6 pt-16 lg:pt-6" tabIndex={0} role="main" aria-label="Main content">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
