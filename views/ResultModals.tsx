import React, { useEffect } from 'react';
import { Home, Copy, Repeat, PartyPopper, Frown } from 'lucide-react';
import Button from '../components/Button';
import confetti from 'canvas-confetti';

// --- Types ---
interface ResultModalProps {
  onHome: () => void;
  onRetry?: () => void; // Optional for win screen
}

interface WinModalProps extends ResultModalProps {
  code: string;
  discount: string;
}

// --- Fail Modal ---
export const FailModal: React.FC<ResultModalProps> = ({ onHome, onRetry }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-gradient-to-br from-purple-600 to-pink-700 rounded-[2rem] p-1 shadow-2xl relative overflow-hidden">
        
        {/* Inner Card Background */}
        <div className="bg-white/10 backdrop-blur-md rounded-[1.8rem] p-6 flex flex-col items-center text-center border border-white/20 shadow-inner">
            
            {/* Emoji/Icon */}
            <div className="mb-4 relative">
                <div className="text-6xl filter drop-shadow-lg transform -rotate-12">🥺</div>
                <div className="absolute -top-4 right-0 text-3xl opacity-80">💔</div>
            </div>

            {/* Text Content */}
            <h2 className="text-3xl font-black text-white mb-2 display-font drop-shadow-md">
                Maalesef!
            </h2>
            <p className="text-white/90 text-base mb-8 leading-relaxed font-medium">
                Maalesef meydan okumayı kazanamadın bence tekrar dene
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3 w-full">
                {onRetry && (
                    <Button variant="secondary" fullWidth onClick={onRetry} icon={<Repeat size={18}/>}>
                        Tekrar Oyna
                    </Button>
                )}
                <Button variant="outline" fullWidth onClick={onHome} icon={<Home size={18}/>}>
                    Ana Sayfa
                </Button>
            </div>

            {/* Decorations */}
            <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-300 rounded-full opacity-60"></div>
            <div className="absolute bottom-10 right-4 w-3 h-3 bg-pink-300 rounded-full opacity-40"></div>
        </div>
      </div>
    </div>
  );
};

// --- Win Modal ---
export const WinModal: React.FC<WinModalProps> = ({ onHome, code, discount }) => {
  
  // Trigger confetti on mount
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#F472B6', '#FBBF24', '#ffffff']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#F472B6', '#FBBF24', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleCopy = () => {
      navigator.clipboard.writeText(code);
      // In a real app, show a toast here
      alert("Kod kopyalandı!");
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-1 shadow-2xl relative">
        
        {/* Glow behind card */}
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-[2rem] -z-10"></div>

        <div className="bg-white/10 backdrop-blur-md rounded-[1.8rem] p-6 flex flex-col items-center text-center border border-white/30 shadow-inner">
            
             {/* Header Icon */}
             <div className="mb-2 relative">
                <div className="w-20 h-20 bg-gradient-to-tr from-yellow-300 to-orange-400 rounded-full flex items-center justify-center shadow-3d-yellow mb-2">
                     <PartyPopper className="text-white w-10 h-10" />
                </div>
            </div>

            <h2 className="text-4xl font-black text-white mb-1 display-font drop-shadow-md">
                Tebrikler!
            </h2>
            <p className="text-pink-100 font-bold text-lg mb-6">
                {discount} indirim kazandın!
            </p>

            {/* Discount Code Box */}
            <div className="w-full bg-indigo-900/40 rounded-xl p-4 border-2 border-dashed border-indigo-300/50 mb-6 relative group cursor-pointer" onClick={handleCopy}>
                <span className="text-xs text-indigo-200 uppercase tracking-widest font-bold absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 px-2 py-0.5 rounded">Kupon Kodu</span>
                <p className="text-3xl font-mono font-bold text-yellow-300 tracking-wider shadow-glow select-all">
                    {code}
                </p>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                    <Copy size={16} />
                </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 w-full">
                <Button variant="primary" fullWidth onClick={handleCopy} className="!bg-white !text-indigo-600 !border-gray-200 !shadow-3d-white">
                    Kodu Kopyala
                </Button>
                <Button variant="outline" fullWidth onClick={onHome}>
                    Anasayfaya Dön
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};