import { useEffect, useRef, useState } from "react";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameOver'
  const [winner, setWinner] = useState('');
  const [winningScore, setWinningScore] = useState(5);
  const [gameMode, setGameMode] = useState('two-player'); // 'one-player', 'two-player'
  
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
  
  // AI variables
  let aiSpeed = 3.5; // Base AI speed
  let aiReactionDelay = 0; // Frames to wait before AI reacts
  let aiTarget = 250; // Where AI wants to position its paddle
  
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

  const resetGame = () => {
    leftScore = 0;
    rightScore = 0;
    setScore({ left: 0, right: 0 });
    setWinner('');
    resetBall();
    resetPaddles();
  };

  const resetBall = () => {
    ballX = 400;
    ballY = 250;
    ballSpeedX = ballSpeedX > 0 ? -4 : 4;
    ballSpeedY = (Math.random() - 0.5) * 4;
  };

  const resetPaddles = () => {
    leftPaddleY = 200;
    rightPaddleY = 200;
  };

  const updateAI = () => {
    if (gameMode !== 'one-player' || gameState !== 'playing') return;
    
    // AI controls the right paddle
    const paddleCenter = rightPaddleY + paddleHeight / 2;
    const ballCenter = ballY + ballSize / 2;
    
    // Only react when ball is moving towards AI paddle
    if (ballSpeedX > 0) {
      // Predict where ball will be when it reaches paddle
      const timeToReachPaddle = (760 - ballX) / ballSpeedX;
      const predictedBallY = ballY + (ballSpeedY * timeToReachPaddle);
      
      // Add some imperfection to make AI beatable
      const imperfection = (Math.random() - 0.5) * 40; // Random offset
      aiTarget = predictedBallY + imperfection;
    } else {
      // When ball is moving away, move towards center
      aiTarget = 250;
    }
    
    // Move AI paddle towards target with some smoothing
    const difference = aiTarget - paddleCenter;
    
    if (Math.abs(difference) > 5) {
      if (difference > 0) {
        rightPaddleY = Math.min(500 - paddleHeight, rightPaddleY + aiSpeed);
      } else {
        rightPaddleY = Math.max(0, rightPaddleY - aiSpeed);
      }
    }
    
    // Adjust AI difficulty based on score difference
    const scoreDiff = rightScore - leftScore;
    if (scoreDiff > 2) {
      aiSpeed = Math.max(2, aiSpeed - 0.1); // Make AI slower if it's winning by a lot
    } else if (scoreDiff < -2) {
      aiSpeed = Math.min(5, aiSpeed + 0.1); // Make AI faster if it's losing
    }
  };

  const checkWinCondition = () => {
    if (leftScore >= winningScore) {
      const winnerText = gameMode === 'one-player' ? 'You Win!' : 'Player 1';
      setWinner(winnerText);
      setGameState('gameOver');
      createParticles(200, 250, "#06b6d4");
      createParticles(300, 150, "#06b6d4");
      createParticles(400, 350, "#06b6d4");
    } else if (rightScore >= winningScore) {
      const winnerText = gameMode === 'one-player' ? 'AI Wins!' : 'Player 2';
      setWinner(winnerText);
      setGameState('gameOver');
      createParticles(600, 250, "#f59e0b");
      createParticles(500, 150, "#f59e0b");
      createParticles(700, 350, "#f59e0b");
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
        particle.vx *= 0.98; // Slow down over time
        particle.vy *= 0.98;
        
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

      // Game state overlays
      if (gameState === 'menu') {
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = "bold 32px 'Courier New', monospace";
        context.textAlign = "center";
        context.fillStyle = "#ffffff";
        context.shadowColor = "#4338ca";
        context.shadowBlur = 10;
        context.fillText("CYBER PONG", canvas.width / 2, canvas.height / 2 - 80);
        
        context.font = "24px 'Courier New', monospace";
        context.fillText(`First to ${winningScore} wins!`, canvas.width / 2, canvas.height / 2 - 40);
        
        // Game mode selection
        context.font = "20px 'Courier New', monospace";
        context.fillStyle = gameMode === 'one-player' ? "#06b6d4" : "#ffffff";
        context.fillText("1: Single Player", canvas.width / 2, canvas.height / 2 - 10);
        
        context.fillStyle = gameMode === 'two-player' ? "#06b6d4" : "#ffffff";
        context.fillText("2: Two Player", canvas.width / 2, canvas.height / 2 + 15);
        
        context.font = "18px 'Courier New', monospace";
        context.fillStyle = "#ffffff";
        context.fillText("PRESS SPACE TO START", canvas.width / 2, canvas.height / 2 + 50);
        
        context.font = "16px 'Courier New', monospace";
        const controlText = gameMode === 'one-player' ? "W/S - Your Paddle" : "W/S - Left Paddle | ↑/↓ - Right Paddle";
        context.fillText(controlText, canvas.width / 2, canvas.height / 2 + 80);
        context.fillText("1-9: Set winning score | R: Restart", canvas.width / 2, canvas.height / 2 + 100);
        context.restore();
      }

      if (gameState === 'gameOver') {
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = "bold 36px 'Courier New', monospace";
        context.textAlign = "center";
        
        // Winner announcement with appropriate color
        const winnerColor = winner.includes('You') || winner.includes('Player 1') ? '#06b6d4' : '#f59e0b';
        context.fillStyle = winnerColor;
        context.shadowColor = winnerColor;
        context.shadowBlur = 15;
        context.fillText(winner, canvas.width / 2, canvas.height / 2 - 40);
        
        context.font = "20px 'Courier New', monospace";
        context.fillStyle = "#ffffff";
        context.shadowColor = "#4338ca";
        context.shadowBlur = 10;
        context.fillText(`Final Score: ${leftScore} - ${rightScore}`, canvas.width / 2, canvas.height / 2);
        
        context.font = "18px 'Courier New', monospace";
        context.fillText("PRESS R TO PLAY AGAIN", canvas.width / 2, canvas.height / 2 + 40);
        context.fillText("PRESS SPACE FOR MENU", canvas.width / 2, canvas.height / 2 + 70);
        context.restore();
      }
    };

    const update = () => {
      if (gameState !== 'playing') return;
      
      updateAI(); // Update AI paddle
      
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
        setTimeout(checkWinCondition, 100);
      }
      
      if (ballX > canvas.width) {
        leftScore++;
        setScore(prev => ({ ...prev, left: leftScore }));
        resetBall();
        createParticles(100, canvas.height / 2, "#06b6d4");
        setTimeout(checkWinCondition, 100);
      }

      // Limit ball speed
      ballSpeedY = Math.max(-8, Math.min(8, ballSpeedY));
      ballSpeedX = Math.max(-10, Math.min(10, ballSpeedX));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas) return;
      
      const step = 25;
      
      if (["ArrowUp", "ArrowDown", "w", "s", " ", "r", "1", "2"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      
      // Menu controls
      if (gameState === 'menu') {
        if (e.key === " ") {
          setGameState('playing');
          resetGame();
          return;
        }
        
        // Game mode selection
        if (e.key === '1') {
          setGameMode('one-player');
          return;
        }
        if (e.key === '2') {
          setGameMode('two-player');
          return;
        }
        
        // Set winning score (3-9, avoiding 1 and 2 which are used for mode selection)
        const num = parseInt(e.key);
        if (num >= 3 && num <= 9) {
          setWinningScore(num);
          return;
        }
      }
      
      // Game over controls
      if (gameState === 'gameOver') {
        if (e.key.toLowerCase() === 'r') {
          setGameState('playing');
          resetGame();
          return;
        }
        if (e.key === ' ') {
          setGameState('menu');
          resetGame();
          return;
        }
      }
      
      // Gameplay controls
      if (gameState === 'playing') {
        if (e.key.toLowerCase() === 'r') {
          setGameState('menu');
          resetGame();
          return;
        }

        // Left paddle (always player controlled)
        if (e.key.toLowerCase() === "w") {
          leftPaddleY = Math.max(0, leftPaddleY - step);
        }
        if (e.key.toLowerCase() === "s") {
          leftPaddleY = Math.min(canvas.height - paddleHeight, leftPaddleY + step);
        }
        
        // Right paddle (only in two-player mode)
        if (gameMode === 'two-player') {
          if (e.key === "ArrowUp") {
            rightPaddleY = Math.max(0, rightPaddleY - step);
          }
          if (e.key === "ArrowDown") {
            rightPaddleY = Math.min(canvas.height - paddleHeight, rightPaddleY + step);
          }
        }
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
  }, [gameState, winningScore, gameMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white text-center mb-2 font-mono tracking-wider">
          CYBER PONG
        </h1>
        <div className="text-center text-sm text-gray-300 font-mono mb-2">
          {gameMode === 'one-player' ? 'Single Player' : 'Two Player'} Mode
        </div>
        <div className="flex justify-center space-x-8 text-lg font-mono mb-2">
          <div className="text-cyan-400">
            {gameMode === 'one-player' ? 'You' : 'Player 1'}: <span className="text-2xl font-bold">{score.left}</span>
          </div>
          <div className="text-amber-400">
            {gameMode === 'one-player' ? 'AI' : 'Player 2'}: <span className="text-2xl font-bold">{score.right}</span>
          </div>
        </div>
        <div className="text-center text-sm text-gray-300 font-mono">
          First to {winningScore} wins
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
        {gameMode === 'two-player' ? (
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-cyan-400 font-bold mb-1">Player 1:</p>
              <p>W/S keys</p>
            </div>
            <div>
              <p className="text-amber-400 font-bold mb-1">Player 2:</p>
              <p>Arrow keys</p>
            </div>
          </div>
        ) : (
          <div className="text-sm">
            <p className="text-cyan-400 font-bold mb-1">Your Controls:</p>
            <p>W/S keys to move paddle</p>
          </div>
        )}
        <div className="mt-4 text-xs text-gray-400">
          <p>R: Restart/Menu | 1/2: Game Mode | 3-9: Set winning score | Space: Start/Menu</p>
        </div>
      </div>
    </div>
  );
}