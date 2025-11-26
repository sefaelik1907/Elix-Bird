
import React, { useRef, useEffect, useState } from 'react';
import { playJumpSound, playScoreSound, playCrashSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface GameScreenProps {
  onGameOver: (score: number, won: boolean) => void;
  topScores: number[]; // [rank1, rank2, rank3]
}

type GameStatus = 'IDLE' | 'PLAYING' | 'CRASHED';
type SkinType = 'MINT' | 'BRONZE' | 'GOLD' | 'ORANGE';

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
  label?: string; // e.g. "%5", "%10"
}

const GameScreen: React.FC<GameScreenProps> = ({ onGameOver, topScores }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [rankNotification, setRankNotification] = useState<string | null>(null);
  
  // React state purely for UI overlay visibility, logic uses refs
  const [isGameActiveUI, setIsGameActiveUI] = useState(false);

  // Game Constants (Base Values for 60FPS)
  const GRAVITY = 0.6;
  const JUMP = -9.6; 
  const BASE_PIPE_SPEED = 3.0;
  const BASE_PIPE_SPAWN_RATE = 90;
  const PIPE_GAP = 180;

  // Game State Refs
  const gameState = useRef({
    status: 'IDLE' as GameStatus,
    birdY: 300,
    birdVelocity: 0,
    birdRotation: 0,
    pipes: [] as Pipe[],
    distanceSinceLastPipe: 0, 
    frameCount: 0,
    score: 0,
    lastJumpTime: 0,
    pipesSpawned: 0,
    currentSkin: 'MINT' as SkinType
  });

  const lastTimeRef = useRef<number>(0);

  // --- Drawing Helpers ---

  const drawBoxerBird = (ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, skin: SkinType) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Reduced scale
    const scale = 0.65;
    ctx.scale(scale, scale);

    // Flapping animation offset
    const flap = Math.sin(gameState.current.frameCount * 0.3) * 8;

    // --- Colors based on Skin ---
    let mainColorStops = ['#D1FAE5', '#6EE7B7', '#34D399']; // Mint
    let strokeColor = '#047857';
    let detailColor = '#064E3B';
    let wingStops = ['#FCD34D', '#F59E0B']; // Default Gold/Orange Wing
    
    if (skin === 'BRONZE') {
        mainColorStops = ['#E2B08B', '#C27C4E', '#8B4513'];
        strokeColor = '#5D2E0C';
        detailColor = '#3E1D05';
    } else if (skin === 'GOLD') {
        mainColorStops = ['#FEF08A', '#FACC15', '#EAB308'];
        strokeColor = '#854D0E';
        detailColor = '#713F12';
    } else if (skin === 'ORANGE') {
        mainColorStops = ['#FDBA74', '#F97316', '#EA580C'];
        strokeColor = '#9A3412';
        detailColor = '#7C2D12';
        wingStops = ['#EF4444', '#B91C1C']; // Red wings for max level
    }

    // --- Wings ---
    const wingGrad = ctx.createLinearGradient(0, -20, 0, 20);
    wingGrad.addColorStop(0, wingStops[0]);
    wingGrad.addColorStop(1, wingStops[1]);

    ctx.fillStyle = wingGrad;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    const drawWing = (dir: 1 | -1) => {
        ctx.beginPath();
        ctx.moveTo(dir * 25, -10);
        ctx.lineTo(dir * 55, -35 + flap);
        ctx.lineTo(dir * 45, -15 + flap);
        ctx.lineTo(dir * 50, -5 + flap);
        ctx.lineTo(dir * 40, 5 + flap);
        ctx.lineTo(dir * 42, 15 + flap);
        ctx.lineTo(dir * 25, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    drawWing(-1); // Back Wing

    // --- Boxer Shorts ---
    const shortsGrad = ctx.createLinearGradient(-30, -30, 30, 40);
    shortsGrad.addColorStop(0, mainColorStops[0]);
    shortsGrad.addColorStop(0.5, mainColorStops[1]);
    shortsGrad.addColorStop(1, mainColorStops[2]);

    ctx.fillStyle = shortsGrad;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;

    // Body
    ctx.beginPath();
    ctx.roundRect(-28, -25, 56, 50, 8);
    ctx.fill();
    ctx.stroke();

    // Seam
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 25);
    ctx.strokeStyle = `rgba(0,0,0,0.2)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Leg Holes
    ctx.fillStyle = detailColor;
    ctx.beginPath();
    ctx.ellipse(-14, 25, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(14, 25, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Waistband
    ctx.fillStyle = '#F8FAFC'; // White-ish
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(-29, -26, 58, 16, [8, 8, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = strokeColor;
    ctx.font = '900 10px Nunito, sans-serif'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ELIXUNDER', 0, -17);

    drawWing(1); // Front Wing

    ctx.restore();
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, isTop: boolean, label?: string) => {
    const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.5, '#F0F9FF');
    gradient.addColorStop(1, '#DBEAFE');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#BFDBFE';
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (isTop) {
        ctx.roundRect(x, y, width, height, [0, 0, 20, 20]);
    } else {
        ctx.roundRect(x, y, width, height, [20, 20, 0, 0]);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(x + 10, y + (isTop ? 0 : 20), 10, height - 20);
  };

  const drawDiscountText = (ctx: CanvasRenderingContext2D, x: number, centerY: number, label: string) => {
      ctx.save();
      ctx.fillStyle = 'rgba(236, 72, 153, 0.3)'; // Brand Pink, very faint
      ctx.font = '900 60px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + 30, centerY); 
      ctx.restore();
  };

  // --- Main Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize
    const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth > 450 ? 450 : window.innerWidth;
        const height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial State
    const logicHeight = window.innerHeight;
    const logicWidth = window.innerWidth > 450 ? 450 : window.innerWidth;

    gameState.current = {
        status: 'IDLE',
        birdY: logicHeight / 2,
        birdVelocity: 0,
        birdRotation: 0,
        pipes: [],
        distanceSinceLastPipe: 0,
        frameCount: 0,
        score: 0,
        lastJumpTime: 0,
        pipesSpawned: 0,
        currentSkin: 'MINT'
    };
    
    setIsGameActiveUI(false);
    setScore(0);
    setRankNotification(null);

    let animationFrameId: number;

    const loop = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const deltaTime = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        const safeDeltaTime = Math.min(deltaTime, 50); 
        const timeScale = safeDeltaTime / (1000 / 60);

        const currentLogicWidth = window.innerWidth > 450 ? 450 : window.innerWidth;
        const currentLogicHeight = window.innerHeight;
        const birdX = currentLogicWidth * 0.35;

        // --- Game Logic ---
        if (gameState.current.status === 'PLAYING') {
            gameState.current.birdVelocity += GRAVITY * timeScale;
            gameState.current.birdY += gameState.current.birdVelocity * timeScale;
            
            gameState.current.birdRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (gameState.current.birdVelocity * 0.1)));
            
            gameState.current.frameCount += 1 * timeScale; 

            // Difficulty Logic: Dynamic Speed and Spacing
            // Slower acceleration (0.045 per point instead of 0.07)
            const speedIncrease = gameState.current.score * 0.045;
            // Cap speed at 6.5 to prevent it from becoming physically impossible
            const currentSpeed = Math.min(BASE_PIPE_SPEED + speedIncrease, 6.5);
            
            // Move Pipes
            gameState.current.pipes.forEach(pipe => {
                pipe.x -= currentSpeed * timeScale;
            });
            
            if (gameState.current.pipes.length > 0 && gameState.current.pipes[0].x < -60) {
                gameState.current.pipes.shift();
            }

            // Spawn Logic
            gameState.current.distanceSinceLastPipe += currentSpeed * timeScale;
            
            // Dynamic Spacing: Increase horizontal distance as speed increases
            // Base distance (270px) + extra buffer based on score
            // This ensures the TIME interval between pipes remains manageable even at high speeds
            const baseSpawnDistance = BASE_PIPE_SPAWN_RATE * BASE_PIPE_SPEED;
            const variableSpacing = Math.min(gameState.current.score * 2.5, 160); // Cap extra spacing
            const spawnDistance = baseSpawnDistance + variableSpacing;
            
            if (gameState.current.distanceSinceLastPipe >= spawnDistance) {
                gameState.current.distanceSinceLastPipe = 0;
                
                gameState.current.pipesSpawned += 1;
                const spawnCount = gameState.current.pipesSpawned;

                const minPipeHeight = 100;
                const maxPipeHeight = currentLogicHeight - PIPE_GAP - minPipeHeight;
                const randomHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1) + minPipeHeight);
                
                let label = undefined;
                if (spawnCount === 5) label = "%5";
                else if (spawnCount === 10) label = "%10";
                else if (spawnCount === 26) label = "%13";

                gameState.current.pipes.push({
                    x: currentLogicWidth,
                    topHeight: randomHeight,
                    passed: false,
                    label: label
                });
            }

            // --- Skin & Rank Logic ---
            let targetSkin: SkinType = 'MINT';
            let rankTitle = '';

            // topScores = [rank1, rank2, rank3]
            // We assume topScores are descending
            if (gameState.current.score > topScores[0]) {
                targetSkin = 'ORANGE';
                rankTitle = '1.';
            } else if (gameState.current.score > topScores[1]) {
                targetSkin = 'GOLD';
                rankTitle = '2.';
            } else if (gameState.current.score > topScores[2]) {
                targetSkin = 'BRONZE';
                rankTitle = '3.';
            }

            if (targetSkin !== gameState.current.currentSkin) {
                gameState.current.currentSkin = targetSkin;
                setRankNotification(`Tebrikler! Artık ${rankTitle} Sin!`);
                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.5 },
                    zIndex: 100
                });
                // Clear notification after 2.5s
                setTimeout(() => setRankNotification(null), 2500);
            }

            // --- Collision Detection ---
            // Reduced hitbox (18px radius)
            const birdLeft = birdX - 18; 
            const birdRight = birdX + 18;
            const birdTop = gameState.current.birdY - 14;
            const birdBottom = gameState.current.birdY + 18;

            if (gameState.current.birdY > currentLogicHeight || gameState.current.birdY < 0) {
                playCrashSound();
                endGame(false);
            }

            for (const pipe of gameState.current.pipes) {
                const pipeLeft = pipe.x;
                const pipeRight = pipe.x + 60;

                if (birdRight > pipeLeft && birdLeft < pipeRight) {
                    if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
                        playCrashSound();
                        endGame(false);
                        break; 
                    }
                }

                if (!pipe.passed && birdLeft > pipeRight) {
                    pipe.passed = true;
                    gameState.current.score += 1;
                    const newScore = gameState.current.score;
                    setScore(newScore);
                    playScoreSound();

                    if (newScore === 5 || newScore === 10 || newScore === 26) {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 },
                            zIndex: 60
                        });
                    }
                }
            }
        } else if (gameState.current.status === 'IDLE') {
             gameState.current.frameCount += 1 * timeScale;
             gameState.current.birdY = currentLogicHeight / 2 + Math.sin(Date.now() / 300) * 10;
        } 

        // --- Draw ---
        ctx.clearRect(0, 0, currentLogicWidth, currentLogicHeight);

        // Pipes
        gameState.current.pipes.forEach(pipe => {
            drawPipe(ctx, pipe.x, 0, 60, pipe.topHeight, true);
            drawPipe(ctx, pipe.x, pipe.topHeight + PIPE_GAP, 60, currentLogicHeight - (pipe.topHeight + PIPE_GAP), false);
            
            if (pipe.label) {
                const gapCenterY = pipe.topHeight + (PIPE_GAP / 2);
                drawDiscountText(ctx, pipe.x, gapCenterY, pipe.label);
            }
        });

        // Bird (With dynamic skin)
        drawBoxerBird(ctx, birdX, gameState.current.birdY, gameState.current.birdRotation, gameState.current.currentSkin);

        // Floor
        const isMoving = gameState.current.status !== 'CRASHED';
        if (isMoving) {
            // Recalculate speed for floor animation to match pipe speed
            const speedIncrease = gameState.current.score * 0.045;
            const currentSpeed = Math.min(BASE_PIPE_SPEED + speedIncrease, 6.5);
            const floorOffset = (gameState.current.frameCount * currentSpeed) % 40;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(0, currentLogicHeight - 20, currentLogicWidth, 20);
            for(let i=0; i < currentLogicWidth + 40; i+=40) {
                ctx.beginPath();
                ctx.arc(i - floorOffset, currentLogicHeight - 10, 25, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
             ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
             ctx.fillRect(0, currentLogicHeight - 20, currentLogicWidth, 20);
             for(let i=0; i < currentLogicWidth + 40; i+=40) {
                 ctx.beginPath();
                 ctx.arc(i, currentLogicHeight - 10, 25, 0, Math.PI * 2);
                 ctx.fill();
             }
        }

        animationFrameId = requestAnimationFrame(loop);
    };

    const endGame = (won: boolean) => {
        gameState.current.status = 'CRASHED';
        setTimeout(() => {
            cancelAnimationFrame(animationFrameId);
            onGameOver(gameState.current.score, won);
        }, 500);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        cancelAnimationFrame(animationFrameId);
    };
  }, [onGameOver, topScores]);

  const handleTap = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    if (now - gameState.current.lastJumpTime < 150) {
        return;
    }
    gameState.current.lastJumpTime = now;

    playJumpSound(); 

    if (gameState.current.status === 'IDLE') {
        gameState.current.status = 'PLAYING';
        setIsGameActiveUI(true);
        gameState.current.birdVelocity = JUMP;
        lastTimeRef.current = performance.now();
    } else if (gameState.current.status === 'PLAYING') {
        gameState.current.birdVelocity = JUMP;
    }
  };

  return (
    <div 
      className="h-full w-full relative overflow-hidden select-none touch-none"
      onPointerDown={handleTap}
    >
        <canvas 
            ref={canvasRef} 
            className="block w-full h-full"
            style={{ imageRendering: 'pixelated' }} 
        />

        {/* UI Overlay */}
        <div className="absolute top-8 left-0 w-full flex justify-center pointer-events-none">
            <div className="bg-white/30 backdrop-blur-md rounded-full px-8 py-3 border border-white/50 shadow-lg flex items-center gap-4">
                 <div className="flex flex-col items-center">
                    <span className="text-blue-900/80 text-xs font-bold uppercase tracking-wider">Skor</span>
                    <span className="text-yellow-400 font-black text-4xl drop-shadow-sm display-font">{score}</span>
                 </div>
            </div>
        </div>

        {/* Rank Notification */}
        {rankNotification && (
             <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none w-max z-50">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-2xl shadow-xl animate-bounce border-2 border-white/40">
                    <span className="font-black text-xl drop-shadow-md display-font tracking-wide">
                        {rankNotification}
                    </span>
                </div>
            </div>
        )}

        {!isGameActiveUI && gameState.current.status === 'IDLE' && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-20 pointer-events-none text-center">
                <div className="bg-black/10 backdrop-blur-sm p-4 rounded-2xl animate-pulse">
                    <p className="text-white font-bold text-lg drop-shadow-md">Başlamak için dokun!</p>
                </div>
                <div className="mt-4 text-4xl animate-bounce">👆</div>
             </div>
        )}
    </div>
  );
};

export default GameScreen;
