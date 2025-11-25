import React, { useState, useEffect } from 'react';
import { ChevronLeft, Lock, Copy, Users, Play, Download } from 'lucide-react';
import Button from '../components/Button';
import { getAllUsersForAdmin } from '../utils/storage';
import { User } from '../types';

interface AdminScreenProps {
  onBack: () => void;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setError('Hatalı şifre');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const data = await getAllUsersForAdmin();
    setUsers(data);
    setIsLoading(false);
  };

  const copyEmails = () => {
    const emails = users.map(u => u.email).join('\n');
    navigator.clipboard.writeText(emails);
    alert(`${users.length} mail adresi kopyalandı!`);
  };

  const totalGames = users.reduce((acc, curr) => acc + curr.gamesPlayed, 0);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full p-6 justify-center">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
               <Lock className="text-red-500 w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center text-slate-800 mb-6">Yönetici Girişi</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Şifre"
              className="w-full p-4 rounded-xl border-2 border-slate-200 text-center text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-center font-bold">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="neutral" onClick={onBack} fullWidth>İptal</Button>
              <Button type="submit" fullWidth>Giriş</Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center gap-4 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
          <ChevronLeft size={24} className="text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Admin Paneli</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-500 text-white p-4 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <Users size={16} />
              <span className="text-xs font-bold uppercase">Kullanıcılar</span>
            </div>
            <span className="text-3xl font-black">{users.length}</span>
          </div>
          <div className="bg-purple-500 text-white p-4 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <Play size={16} />
              <span className="text-xs font-bold uppercase">Oynanış</span>
            </div>
            <span className="text-3xl font-black">{totalGames}</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <span className="text-slate-500 font-bold text-sm">Veri İşlemleri</span>
          <button 
            onClick={copyEmails}
            className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-200 transition-colors"
          >
            <Copy size={16} />
            Mailleri Kopyala
          </button>
        </div>

        {/* User List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-700">Kullanıcı Listesi</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
            ) : (
              users.map((user, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-slate-800 truncate">{user.email}</span>
                    <span className="text-xs text-slate-400 font-mono">{user.username}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-4">
                    <span className="text-sm font-black text-brand-primary">{user.highScore} Puan</span>
                    <span className="text-xs text-slate-400">{user.gamesPlayed} Oyun</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;