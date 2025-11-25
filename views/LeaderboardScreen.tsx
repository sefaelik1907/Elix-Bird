import React, { useEffect, useState } from 'react';
import { ChevronLeft, Trophy, Medal, Gift, Loader2 } from 'lucide-react';
import { getLeaderboard } from '../utils/storage';
import { LeaderboardEntry } from '../types';

interface LeaderboardScreenProps {
  onBack: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
        setIsLoading(true);
        const leaderboardData = await getLeaderboard();
        setData(leaderboardData);
        setIsLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: // 1. Orange
        return "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 shadow-orange-500/40 shadow-xl";
      case 1: // 2. Gold
        return "bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-950 border-yellow-200 shadow-yellow-500/40 shadow-lg";
      case 2: // 3. Bronze
        return "bg-gradient-to-r from-amber-700 to-orange-900 text-orange-50 border-orange-800 shadow-orange-900/40 shadow-lg";
      default: // Rest (Grey)
        return "bg-slate-100/90 backdrop-blur-sm text-slate-600 border-slate-200 shadow-sm";
    }
  };

  return (
    <div className="flex flex-col h-full p-4 animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 pt-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl text-white font-black drop-shadow-md display-font flex items-center gap-2">
          <Trophy className="text-yellow-300" />
          Liderler
        </h2>
      </div>

      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 mb-4 shadow-lg border border-white/20 flex items-center gap-4 relative overflow-hidden group shrink-0">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl -translate-y-10 translate-x-10"></div>
        
        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-inner">
            <Gift className="text-white w-8 h-8 animate-bounce" />
        </div>
        
        <div className="flex-1 z-10">
            <p className="text-white text-sm font-medium leading-tight opacity-90">
                Bu ay sıralamadaki <span className="font-bold text-yellow-300 underline decoration-yellow-300/50">ilk 10 kullanıcı</span>
            </p>
            <p className="text-white font-black text-lg tracking-wide drop-shadow-sm">
                BOXER HEDİYE KAZANACAK!
            </p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-8">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-white/80">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span>Sıralama yükleniyor...</span>
            </div>
        ) : data.length === 0 ? (
          <div className="text-center text-white/70 mt-10 font-bold">Henüz kayıt yok.</div>
        ) : (
            data.map((entry, index) => (
            <div 
                key={index} 
                className={`
                relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300
                ${getRankStyle(index)}
                ${index < 3 ? 'transform hover:scale-[1.02]' : ''}
                `}
            >
                {/* Rank Badge */}
                <div className="flex items-center gap-4">
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-inner
                    ${index < 3 ? 'bg-black/10 text-white/90' : 'bg-slate-200 text-slate-500'}
                `}>
                    {index + 1}
                </div>
                
                {/* Username */}
                <div className="flex flex-col">
                    <span className="font-bold tracking-wide font-mono text-sm opacity-100">
                        {entry.username}
                    </span>
                    {index < 10 && (
                    <span className="text-[10px] uppercase font-black tracking-widest opacity-80 flex items-center gap-1">
                        {index === 0 ? '👑 LİDER' : '🎁 HEDİYE ADAYI'}
                    </span>
                    )}
                </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-2">
                <span className="text-2xl font-black display-font">{entry.score}</span>
                {index < 3 && <Medal size={16} className="opacity-80" />}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;