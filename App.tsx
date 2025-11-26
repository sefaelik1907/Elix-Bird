
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import MenuScreen from './views/MenuScreen';
import GameScreen from './views/GameScreen';
import LoginScreen from './views/LoginScreen';
import LeaderboardScreen from './views/LeaderboardScreen';
import { WinModal, FailModal } from './views/ResultModals';
import { AppScreen, PlayerStats, GameResult, User } from './types';
import { loginUser, autoLogin, saveScore, getCurrentUserRank, claimDiscount, getTopScores } from './utils/storage';
import { setAudioMuted } from './utils/audio';
import { Loader2 } from 'lucide-react';

// Coupon Data
const CODES_5_PERCENT = [
  'elixablq', 'elixaexj', 'elixanjb', 'elixbesg', 'elixbyov', 
  'elixbzfg', 'elixcapk', 'elixdafh', 'elixdcfi', 'elixdtzw'
];

const CODES_10_PERCENT = [
  'elixedje', 'elixgjkf', 'elixgsry', 'elixgycj', 'elixgzwm', 
  'elixibgd', 'elixmpmu', 'elixnyni', 'elixooit', 'elixpuie'
];

const CODES_13_PERCENT = [
  'elixpykv', 'elixrlme', 'elixtomk', 'elixtzak', 'elixucwa', 
  'elixudpx', 'elixumue', 'elixusfo', 'elixuugi', 'elixveug'
];

const getRandomCode = (codes: string[]) => {
  return codes[Math.floor(Math.random() * codes.length)];
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.LOGIN);
  const [lastGameResult, setLastGameResult] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [failMessage, setFailMessage] = useState<string>("Maalesef meydan okumayı kazanamadın bence tekrar dene");
  const [failTitle, setFailTitle] = useState<string>("Maalesef!");
  const [topScores, setTopScores] = useState<number[]>([0,0,0]);
  
  // User State
  const [user, setUser] = useState<User | null>(null);
  
  // Stats State
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    highScore: 0,
    rank: 0,
    gamesPlayed: 0
  });

  // --- 1. Login Persistence Check ---
  useEffect(() => {
    const checkSession = async () => {
        setIsLoading(true);
        const session = await autoLogin();
        if (session && session.user) {
          setUser(session.user);
          await updateStats(session.user.email, session.user.highScore, session.user.gamesPlayed);
          setCurrentScreen(AppScreen.MENU);
        }
        setIsLoading(false);
    };
    checkSession();
  }, []);

  const updateStats = async (email: string, highScore: number, gamesPlayed: number) => {
    const rank = await getCurrentUserRank(email);
    setPlayerStats({
      highScore,
      gamesPlayed,
      rank
    });
  };

  const handleLogin = async (email: string) => {
    setIsLoading(true);
    const result = await loginUser(email);
    if (result.success && result.user) {
      setUser(result.user);
      await updateStats(email, result.user.highScore, result.user.gamesPlayed);
      setCurrentScreen(AppScreen.MENU);
    }
    setIsLoading(false);
  };

  const handleStartGame = async () => {
    // Fetch top scores for in-game rank updates
    setIsLoading(true);
    const scores = await getTopScores();
    setTopScores(scores);
    setIsLoading(false);
    setCurrentScreen(AppScreen.GAME);
  };

  const handleOpenLeaderboard = () => {
    setCurrentScreen(AppScreen.LEADERBOARD);
  };

  const handleToggleSound = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    setAudioMuted(newMutedState);
  };

  const handleGameOver = async (score: number, _gameWon: boolean) => {
    let result: GameResult = { score };
    
    // Save Score to DB Async
    if (user) {
        const saveResult = await saveScore(user.email, score);
        if (saveResult.success && typeof saveResult.currentHighScore === 'number') {
            await updateStats(user.email, saveResult.currentHighScore, user.gamesPlayed + 1);
            setUser(prev => prev ? { ...prev, highScore: saveResult.currentHighScore!, gamesPlayed: prev.gamesPlayed + 1 } : null);
        }
    }

    // Logic for rewards based on score
    if (score >= 5) {
      // Determine potential reward
      let potentialDiscount = "";
      let potentialCode = "";

      if (score <= 9) {
        potentialDiscount = "%5";
        potentialCode = getRandomCode(CODES_5_PERCENT);
      } else if (score <= 25) {
        potentialDiscount = "%10";
        potentialCode = getRandomCode(CODES_10_PERCENT);
      } else {
        potentialDiscount = "%13";
        potentialCode = getRandomCode(CODES_13_PERCENT);
      }

      // CHECK IF ALREADY CLAIMED
      const alreadyClaimed = user?.claimedDiscounts?.includes(potentialDiscount);

      if (alreadyClaimed) {
          // Show Fail/Info Screen
          setFailTitle("Tebrikler ama...");
          setFailMessage(`Bu ay ${potentialDiscount} indirimini daha önce kazandın! Bence daha yüksek bir indirim kazanabilirsin, meydan okumaya devam!`);
          setCurrentScreen(AppScreen.FAIL);
          return;
      } else {
          // New Reward!
          result.discountAmount = potentialDiscount;
          result.discountCode = potentialCode;
          
          if (user) {
             // Save claim to DB
             await claimDiscount(user.email, potentialDiscount);
             // Update local user state
             setUser(prev => prev ? { 
                 ...prev, 
                 claimedDiscounts: [...(prev.claimedDiscounts || []), potentialDiscount] 
             } : null);
          }

          setLastGameResult(result);
          setCurrentScreen(AppScreen.WIN);
          return;
      }
    }

    // Default Fail (Score < 5)
    setFailTitle("Maalesef!");
    setFailMessage("Maalesef meydan okumayı kazanamadın bence tekrar dene");
    setCurrentScreen(AppScreen.FAIL);
  };

  const handleGoHome = async () => {
    // Refresh stats when returning home to ensure rank is correct
    if (user) {
        await updateStats(user.email, user.highScore, user.gamesPlayed);
    }
    setCurrentScreen(AppScreen.MENU);
  };

  const handleRetry = () => {
    handleStartGame();
  };

  if (isLoading && currentScreen === AppScreen.LOGIN) {
      return (
          <Layout>
              <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                  <p className="text-white font-bold">Yükleniyor...</p>
              </div>
          </Layout>
      )
  }

  return (
    <Layout>
      {/* Initial Login Screen */}
      {currentScreen === AppScreen.LOGIN && (
        <LoginScreen onLogin={handleLogin} />
      )}
      
      {currentScreen === AppScreen.MENU && (
        <MenuScreen 
          onStart={handleStartGame} 
          onLeaderboard={handleOpenLeaderboard}
          onToggleSound={handleToggleSound}
          isMuted={isMuted}
          stats={playerStats} 
          username={user?.username}
        />
      )}

      {currentScreen === AppScreen.LEADERBOARD && (
        <LeaderboardScreen onBack={handleGoHome} />
      )}

      {currentScreen === AppScreen.GAME && (
        <GameScreen onGameOver={handleGameOver} topScores={topScores} />
      )}

      {currentScreen === AppScreen.WIN && lastGameResult && (
        <>
          <MenuScreen onStart={() => {}} onLeaderboard={() => {}} stats={playerStats} username={user?.username} />
          <WinModal 
            onHome={handleGoHome} 
            code={lastGameResult.discountCode || 'ERROR'} 
            discount={lastGameResult.discountAmount || '%0'} 
          />
        </>
      )}

      {currentScreen === AppScreen.FAIL && (
        <>
           <MenuScreen onStart={() => {}} onLeaderboard={() => {}} stats={playerStats} username={user?.username} />
          <FailModal 
            onHome={handleGoHome} 
            onRetry={handleRetry}
            title={failTitle}
            message={failMessage} 
          />
        </>
      )}
    </Layout>
  );
};

export default App;
