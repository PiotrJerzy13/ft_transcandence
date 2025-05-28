import { useEffect, useRef, useState } from "react";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  
  const paddleHeight = 100;
  const paddleWidth = 12;
  const ballSize = 12;
  
  let leftPaddleY = 160;
  let rightPaddleY = 160;
  let ballX = 300;
  let ballY = 200;
  let ballSpeedX = 4;
  let ballSpeedY = 3;
  let leftScore = 0;
  let rightScore = 0;
  
  // Particle system for effects
  let particles = [];
  
  const createParticles = (x, y, color = "#60a5fa") => {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 30,
        maxLife: 30,
        color: color
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const draw = () => {
      // Create gradient background
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#0f0f23");
      gradient.addColorStop(0.5, "#1a1a3e");
      gradient.addColorStop(1, "#0f0f23");
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line with glow effect
      context.save();
      context.strokeStyle = "#4338ca";
      context.lineWidth = 3;
      context.shadowColor = "#4338ca";
      context.shadowBlur = 10;
      context.setLineDash([15, 15]);
      context.beginPath();
      context.moveTo(canvas.width / 2, 0);
      context.lineTo(canvas.width / 2, canvas.height);
      context.stroke();
      context.restore();

      // Draw paddles with gradient and glow
      const drawPaddle = (x, y, color1, color2, shadowColor) => {
        context.save();
        
        // Glow effect
        context.shadowColor = shadowColor;
        context.shadowBlur = 15;
        
        // Gradient fill
        const paddleGradient = context.createLinearGradient(x, y, x + paddleWidth, y + paddleHeight);
        paddleGradient.addColorStop(0, color1);
        paddleGradient.addColorStop(1, color2);
        
        context.fillStyle = paddleGradient;
        context.fillRect(x, y, paddleWidth, paddleHeight);
        
        // Inner highlight
        context.shadowBlur = 0;
        context.fillStyle = "rgba(255, 255, 255, 0.3)";
        context.fillRect(x + 2, y + 2, 2, paddleHeight - 4);
        
        context.restore();
      };

      drawPaddle(20, leftPaddleY, "#06b6d4", "#0891b2", "#06b6d4");
      drawPaddle(canvas.width - 32, rightPaddleY, "#f59e0b", "#d97706", "#f59e0b");

      // Draw ball with glow and trail effect
      context.save();
      context.shadowColor = "#ef4444";
      context.shadowBlur = 20;
      
      // Ball gradient
      const ballGradient = context.createRadialGradient(
        ballX + ballSize/2, ballY + ballSize/2, 0,
        ballX + ballSize/2, ballY + ballSize/2, ballSize
      );
      ballGradient.addColorStop(0, "#fbbf24");
      ballGradient.addColorStop(0.7, "#f59e0b");
      ballGradient.addColorStop(1, "#dc2626");
      
      context.fillStyle = ballGradient;
      context.beginPath();
      context.arc(ballX + ballSize/2, ballY + ballSize/2, ballSize/2, 0, Math.PI * 2);
      context.fill();
      
      // Inner highlight
      context.shadowBlur = 0;
      context.fillStyle = "rgba(255, 255, 255, 0.6)";
      context.beginPath();
      context.arc(ballX + ballSize/3, ballY + ballSize/3, ballSize/6, 0, Math.PI * 2);
      context.fill();
      
      context.restore();

      // Draw and update particles
      particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        const alpha = particle.life / particle.maxLife;
        context.save();
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        context.fill();
        context.restore();
        
        return particle.life > 0;
      });

      // Draw scores with glow
      context.save();
      context.font = "bold 48px 'Courier New', monospace";
      context.textAlign = "center";
      
      // Left score
      context.shadowColor = "#06b6d4";
      context.shadowBlur = 15;
      context.fillStyle = "#06b6d4";
      context.fillText(leftScore.toString(), canvas.width / 4, 60);
      
      // Right score
      context.shadowColor = "#f59e0b";
      context.shadowBlur = 15;
      context.fillStyle = "#f59e0b";
      context.fillText(rightScore.toString(), (canvas.width * 3) / 4, 60);
      
      context.restore();

      // Game start prompt
      if (!gameStarted) {
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.7)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = "bold 32px 'Courier New', monospace";
        context.textAlign = "center";
        context.fillStyle = "#ffffff";
        context.shadowColor = "#4338ca";
        context.shadowBlur = 10;
        context.fillText("PRESS SPACE TO START", canvas.width / 2, canvas.height / 2);
        
        context.font = "18px 'Courier New', monospace";
        context.fillText("W/S - Left Paddle | ↑/↓ - Right Paddle", canvas.width / 2, canvas.height / 2 + 50);
        context.restore();
      }
    };

    const update = () => {
      if (!gameStarted) return;
      
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Bounce off top/bottom with particles
      if (ballY <= 0 || ballY + ballSize >= canvas.height) {
        ballSpeedY *= -1;
        createParticles(ballX + ballSize/2, ballY + ballSize/2, "#60a5fa");
      }

      // Bounce off left paddle
      if (
        ballX <= 32 &&
        ballY + ballSize >= leftPaddleY &&
        ballY <= leftPaddleY + paddleHeight &&
        ballSpeedX < 0
      ) {
        ballSpeedX *= -1;
        // Add some randomness to prevent boring rallies
        ballSpeedY += (Math.random() - 0.5) * 2;
        createParticles(ballX + ballSize/2, ballY + ballSize/2, "#06b6d4");
      }

      // Bounce off right paddle
      if (
        ballX + ballSize >= canvas.width - 32 &&
        ballY + ballSize >= rightPaddleY &&
        ballY <= rightPaddleY + paddleHeight &&
        ballSpeedX > 0
      ) {
        ballSpeedX *= -1;
        ballSpeedY += (Math.random() - 0.5) * 2;
        createParticles(ballX + ballSize/2, ballY + ballSize/2, "#f59e0b");
      }

      // Score and reset
      if (ballX < 0) {
        rightScore++;
        setScore(prev => ({ ...prev, right: rightScore }));
        resetBall();
        createParticles(canvas.width - 100, canvas.height / 2, "#f59e0b");
      }
      
      if (ballX > canvas.width) {
        leftScore++;
        setScore(prev => ({ ...prev, left: leftScore }));
        resetBall();
        createParticles(100, canvas.height / 2, "#06b6d4");
      }

      // Limit ball speed
      ballSpeedY = Math.max(-6, Math.min(6, ballSpeedY));
    };

    const resetBall = () => {
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
      ballSpeedX = ballSpeedX > 0 ? -4 : 4;
      ballSpeedY = (Math.random() - 0.5) * 4;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas) return;
      
      const step = 25;
      
      if (["ArrowUp", "ArrowDown", "w", "s", " "].includes(e.key)) {
        e.preventDefault();
      }
      
      if (e.key === " ") {
        setGameStarted(true);
        return;
      }
      
      if (!gameStarted) return;

      if (e.key === "w") {
        leftPaddleY = Math.max(0, leftPaddleY - step);
      }
      if (e.key === "s") {
        leftPaddleY = Math.min(canvas.height - paddleHeight, leftPaddleY + step);
      }
      if (e.key === "ArrowUp") {
        rightPaddleY = Math.max(0, rightPaddleY - step);
      }
      if (e.key === "ArrowDown") {
        rightPaddleY = Math.min(canvas.height - paddleHeight, rightPaddleY + step);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const gameLoop = () => {
      update();
      draw();
      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStarted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white text-center mb-2 font-mono tracking-wider">
          CYBER PONG
        </h1>
        <div className="flex justify-center space-x-8 text-lg font-mono">
          <div className="text-cyan-400">
            Player 1: <span className="text-2xl font-bold">{score.left}</span>
          </div>
          <div className="text-amber-400">
            Player 2: <span className="text-2xl font-bold">{score.right}</span>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500} 
          className="border-2 border-purple-500 rounded-lg shadow-2xl shadow-purple-500/50 bg-black"
        />
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 rounded-lg blur opacity-20"></div>
      </div>
      
      <div className="mt-6 text-center text-gray-300 font-mono">
        <p className="mb-2">Controls:</p>
        <div className="flex justify-center space-x-8 text-sm">
          <div>
            <span className="text-cyan-400">Player 1:</span> W/S keys
          </div>
          <div>
            <span className="text-amber-400">Player 2:</span> Arrow keys
          </div>
        </div>
      </div>
    </div>
  );
}