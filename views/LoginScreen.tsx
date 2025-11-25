import React, { useState } from 'react';
import { Mail, Sparkles, Star } from 'lucide-react';
import Button from '../components/Button';

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Lütfen geçerli bir mail adresi girin.');
      return;
    }
    onLogin(email);
  };

  return (
    <div className="flex flex-col h-full p-6 animate-in fade-in duration-500 justify-center">
      
      {/* Logo Area */}
      <div className="flex flex-col items-center justify-center relative mb-10">
        <div className="animate-float">
            <div className="bg-red-600 text-white font-black px-4 py-1 rounded-full text-xs tracking-widest uppercase shadow-glow mb-4 mx-auto w-max">
            ELIXUNDER
            </div>
            <h1 className="text-4xl text-center text-white font-black drop-shadow-md leading-tight display-font relative">
            Hoş Geldin!
            <Sparkles className="absolute -top-4 -right-4 text-yellow-300 w-8 h-8 animate-pulse" />
            <Star className="absolute bottom-2 -left-6 text-pink-300 w-6 h-6 animate-pulse" />
            </h1>
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl border-2 border-white/50">
        <p className="text-brand-dark/80 text-center mb-6 font-medium leading-relaxed">
          İndirim kodunu ve ödülleri kazanmak için mail adresini girerek maceraya başla.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-secondary/60 group-focus-within:text-brand-secondary transition-colors">
              <Mail size={20} />
            </div>
            <input
              type="email"
              placeholder="E-posta adresin"
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 border-white/50 focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20 outline-none transition-all font-bold text-brand-dark placeholder-brand-dark/30 shadow-inner"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm font-bold text-center bg-red-100 py-2 rounded-lg animate-pulse">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            fullWidth 
            className="mt-2"
          >
            BAŞLA
          </Button>
        </form>
      </div>
      
      <p className="text-white/60 text-xs text-center mt-6 font-medium">
        Kişisel verilerin gizlilik politikamız kapsamındadır.
      </p>
    </div>
  );
};

export default LoginScreen;