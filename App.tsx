import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import MenuScreen from './views/MenuScreen';
import GameScreen from './views/GameScreen';
import LoginScreen from './views/LoginScreen';
import LeaderboardScreen from './views/LeaderboardScreen';
import { WinModal, FailModal } from './views/ResultModals';
import { AppScreen, PlayerStats, GameResult, User } from './types';
import { loginUser, autoLogin, saveScore, getCurrentUserRank } from './utils/storage';
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

  const handleStartGame = () => {
    setCurrentScreen(AppScreen.GAME);
  };

  const handleOpenLeaderboard = () => {
    setCurrentScreen(AppScreen.LEADERBOARD);
  };

  const handleGameOver = async (score: number, _gameWon: boolean) => {
    let result: GameResult = { score };
    let nextScreen = AppScreen.FAIL;

    // Save Score to DB Async
    if (user) {
        const saveResult = await saveScore(user.email, score);
        if (saveResult.success && typeof saveResult.currentHighScore === 'number') {
            // Update local state to reflect new DB state
            // We do this optimistically or wait? Let's wait to be sure.
            await updateStats(user.email, saveResult.currentHighScore, user.gamesPlayed + 1);
            setUser(prev => prev ? { ...prev, highScore: saveResult.currentHighScore!, gamesPlayed: prev.gamesPlayed + 1 } : null);
        }
    }

    // Logic for rewards based on score
    if (score >= 5) {
      nextScreen = AppScreen.WIN;
      
      if (score <= 9) {
        result.discountAmount = "%5";
        result.discountCode = getRandomCode(CODES_5_PERCENT);
      } else if (score <= 25) {
        result.discountAmount = "%10";
        result.discountCode = getRandomCode(CODES_10_PERCENT);
      } else {
        result.discountAmount = "%13";
        result.discountCode = getRandomCode(CODES_13_PERCENT);
      }
    }

    setLastGameResult(result);
    setCurrentScreen(nextScreen);
  };

  const handleGoHome = async () => {
    // Refresh stats when returning home to ensure rank is correct
    if (user) {
        await updateStats(user.email, user.highScore, user.gamesPlayed);
    }
    setCurrentScreen(AppScreen.MENU);
  };

  const handleRetry = () => {
    setCurrentScreen(AppScreen.GAME);
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
          stats={playerStats} 
          username={user?.username}
        />
      )}

      {currentScreen === AppScreen.LEADERBOARD && (
        <LeaderboardScreen onBack={handleGoHome} />
      )}

      {currentScreen === AppScreen.GAME && (
        <GameScreen onGameOver={handleGameOver} />
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
          />
        </>
      )}
    </Layout>
  );
};

export default App;