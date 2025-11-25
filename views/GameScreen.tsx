
import React, { useRef, useEffect, useState } from 'react';
import { playJumpSound, playScoreSound, playCrashSound } from '../utils/audio';

interface GameScreenProps {
  onGameOver: (score: number, won: boolean) => void;
}

type GameStatus = 'IDLE' | 'PLAYING' | 'CRASHED';

const GameScreen: React.FC<GameScreenProps> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  
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
    pipes: [] as { x: number; topHeight: number; passed: boolean }[],
    distanceSinceLastPipe: 0, 
    frameCount: 0,
    score: 0,
    lastJumpTime: 0
  });

  const lastTimeRef = useRef<number>(0);

  // --- Drawing Helpers ---

  const drawBoxerBird = (ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const scale = 0.8;
    ctx.scale(scale, scale);

    // Wings (Back)
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 0;
    
    // Flapping animation based on frame count (visual only)
    const wingOffset = Math.sin(gameState.current.frameCount * 0.2) * 5;
    
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.quadraticCurveTo(-45, -30 + wingOffset, -50, -10 + wingOffset);
    ctx.quadraticCurveTo(-45, 10 + wingOffset, -20, 5);
    ctx.fill();

    // Boxer Body (Shorts) - Green
    const gradient = ctx.createLinearGradient(-25, -20, 25, 30);
    gradient.addColorStop(0, '#4ADE80'); // Green 400
    gradient.addColorStop(1, '#15803D'); // Green 700
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    // [tl, tr, br, bl]
    ctx.roundRect(-25, -20, 50, 45, 10);
    ctx.fill();
    
    // Leg holes
    ctx.fillStyle = '#14532D';
    ctx.beginPath();
    ctx.arc(-12, 25, 10, Math.PI, 0);
    ctx.arc(12, 25, 10, Math.PI, 0);
    ctx.fill();

    // Waistband
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(-25, -20, 50, 15, [10, 10, 0, 0]);
    ctx.fill();

    // Brand Logo
    ctx.fillStyle = '#15803D';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ELIXUNDER', 0, -12);

    // Front Wing
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.quadraticCurveTo(35, -30 + wingOffset, 40, -10 + wingOffset);
    ctx.quadraticCurveTo(35, 10 + wingOffset, 10, 5);
    ctx.fill();

    ctx.restore();
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, isTop: boolean) => {
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

  // --- Main Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize Handling
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

    // Reset Game State
    gameState.current = {
        status: 'IDLE',
        birdY: logicHeight / 2,
        birdVelocity: 0,
        birdRotation: 0,
        pipes: [],
        distanceSinceLastPipe: 0,
        frameCount: 0,
        score: 0,
        lastJumpTime: 0
    };
    
    setIsGameActiveUI(false);
    setScore(0);

    let animationFrameId: number;

    const loop = (timestamp: number) => {
        // Delta Time Calculation
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const deltaTime = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        // Cap deltaTime to prevent huge jumps if tab was inactive
        const safeDeltaTime = Math.min(deltaTime, 50); 
        const timeScale = safeDeltaTime / (1000 / 60);

        const currentLogicWidth = window.innerWidth > 450 ? 450 : window.innerWidth;
        const currentLogicHeight = window.innerHeight;
        const birdX = currentLogicWidth * 0.35;

        // --- Game Logic ---
        if (gameState.current.status === 'PLAYING') {
            // Apply Gravity
            gameState.current.birdVelocity += GRAVITY * timeScale;
            gameState.current.birdY += gameState.current.birdVelocity * timeScale;
            
            // Rotation logic
            gameState.current.birdRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (gameState.current.birdVelocity * 0.1)));
            
            gameState.current.frameCount += 1 * timeScale; 

            // Difficulty Logic
            const speedIncrease = gameState.current.score * 0.07;
            const currentSpeed = BASE_PIPE_SPEED + speedIncrease;
            
            // Move Pipes
            gameState.current.pipes.forEach(pipe => {
                pipe.x -= currentSpeed * timeScale;
            });
            
            // Remove off-screen pipes
            if (gameState.current.pipes.length > 0 && gameState.current.pipes[0].x < -60) {
                gameState.current.pipes.shift();
            }

            // Spawn Logic
            gameState.current.distanceSinceLastPipe += currentSpeed * timeScale;
            const spawnDistance = BASE_PIPE_SPAWN_RATE * BASE_PIPE_SPEED; 
            
            if (gameState.current.distanceSinceLastPipe >= spawnDistance) {
                gameState.current.distanceSinceLastPipe = 0;
                
                const minPipeHeight = 100;
                const maxPipeHeight = currentLogicHeight - PIPE_GAP - minPipeHeight;
                const randomHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1) + minPipeHeight);
                
                gameState.current.pipes.push({
                    x: currentLogicWidth,
                    topHeight: randomHeight,
                    passed: false
                });
            }

            // --- Collision Detection ---
            const birdLeft = birdX - 20;
            const birdRight = birdX + 20;
            const birdTop = gameState.current.birdY - 20;
            const birdBottom = gameState.current.birdY + 20;

            // Floor/Ceiling
            if (gameState.current.birdY > currentLogicHeight || gameState.current.birdY < 0) {
                playCrashSound();
                endGame(false);
            }

            // Pipes
            for (const pipe of gameState.current.pipes) {
                const pipeLeft = pipe.x;
                const pipeRight = pipe.x + 60;

                if (birdRight > pipeLeft && birdLeft < pipeRight) {
                    if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
                        playCrashSound();
                        endGame(false);
                        break; // Stop checking after first collision
                    }
                }

                // Score
                if (!pipe.passed && birdLeft > pipeRight) {
                    pipe.passed = true;
                    gameState.current.score += 1;
                    setScore(gameState.current.score);
                    playScoreSound();
                }
            }
        } else if (gameState.current.status === 'IDLE') {
             // Idle Animation (Hovering)
             gameState.current.frameCount += 1 * timeScale;
             gameState.current.birdY = currentLogicHeight / 2 + Math.sin(Date.now() / 300) * 10;
        } 
        // If CRASHED, we do NOTHING to positions (Freeze effect)

        // --- Draw ---
        ctx.clearRect(0, 0, currentLogicWidth, currentLogicHeight);

        // Pipes
        gameState.current.pipes.forEach(pipe => {
            drawPipe(ctx, pipe.x, 0, 60, pipe.topHeight, true);
            drawPipe(ctx, pipe.x, pipe.topHeight + PIPE_GAP, 60, currentLogicHeight - (pipe.topHeight + PIPE_GAP), false);
        });

        // Bird
        drawBoxerBird(ctx, birdX, gameState.current.birdY, gameState.current.birdRotation);

        // Floor
        // Only scroll floor if playing or idle
        const isMoving = gameState.current.status !== 'CRASHED';
        if (isMoving) {
            const speedIncrease = gameState.current.score * 0.07;
            const currentSpeed = BASE_PIPE_SPEED + speedIncrease;
            const floorOffset = (gameState.current.frameCount * currentSpeed) % 40;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(0, currentLogicHeight - 20, currentLogicWidth, 20);
            for(let i=0; i < currentLogicWidth + 40; i+=40) {
                ctx.beginPath();
                ctx.arc(i - floorOffset, currentLogicHeight - 10, 25, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
             // Draw Static Floor if crashed
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
        // Wait a moment before showing result to let player realize they died
        setTimeout(() => {
            cancelAnimationFrame(animationFrameId);
            onGameOver(gameState.current.score, won);
        }, 500);
    };

    // Start loop
    animationFrameId = requestAnimationFrame(loop);

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        cancelAnimationFrame(animationFrameId);
    };
  }, [onGameOver]);

  const handleTap = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    // Cooldown check (prevent double jumps from bouncing contacts)
    if (now - gameState.current.lastJumpTime < 150) {
        return;
    }
    gameState.current.lastJumpTime = now;

    // Resume audio context on first interaction if suspended
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
