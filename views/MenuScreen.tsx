import React from 'react';
import { Trophy, Volume2, Gamepad2, Star, Sparkles, User } from 'lucide-react';
import Button from '../components/Button';
import { PlayerStats } from '../types';

interface MenuScreenProps {
  onStart: () => void;
  onLeaderboard?: () => void;
  stats: PlayerStats;
  username?: string;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ onStart, onLeaderboard, stats, username }) => {
  return (
    <div className="flex flex-col h-full p-6 animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mt-2 mb-8">
        <button className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
          <Volume2 size={24} />
        </button>
        
        {username && (
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
             <User size={14} className="text-white/80" />
             <span className="text-white text-xs font-mono font-bold">{username}</span>
          </div>
        )}
      </div>

      {/* Logo Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative mb-10">
        <div className="animate-float">
            <div className="bg-red-600 text-white font-black px-4 py-1 rounded-full text-xs tracking-widest uppercase shadow-glow mb-4 mx-auto w-max">
            ELIXUNDER
            </div>
            <h1 className="text-5xl text-center text-white font-black drop-shadow-md leading-tight display-font relative">
            Gökyüzü<br/>Macerası
            <Sparkles className="absolute -top-4 -right-4 text-yellow-300 w-8 h-8 animate-pulse" />
            <Star className="absolute bottom-2 -left-6 text-pink-300 w-6 h-6 animate-pulse" />
            </h1>
        </div>
        
        <p className="mt-4 text-white/90 font-semibold text-lg flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full border border-white/20">
           🪽 Dokunarak uç ve kazan! ✨
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-lg border-2 border-white/50 flex flex-col items-center transform hover:-translate-y-1 transition-transform">
          <span className="text-brand-secondary text-sm font-bold uppercase tracking-wider mb-1">Rekorun</span>
          <span className="text-3xl font-black text-brand-primary display-font">{stats.highScore}</span>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-lg border-2 border-white/50 flex flex-col items-center transform hover:-translate-y-1 transition-transform">
          <span className="text-brand-secondary text-sm font-bold uppercase tracking-wider mb-1">Sıralaman</span>
          <span className="text-3xl font-black text-brand-accent display-font">
            {stats.rank > 0 ? `#${stats.rank}` : '-'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 mb-8">
        <Button variant="primary" size="lg" fullWidth onClick={onStart} icon={<Gamepad2 className="w-6 h-6"/>}>
          OYUNA BAŞLA
        </Button>
        
        <Button variant="secondary" size="md" fullWidth onClick={onLeaderboard} icon={<Trophy className="w-5 h-5"/>}>
          LİDERLİK TABLOSU
        </Button>
      </div>
    </div>
  );
};

export default MenuScreen;
