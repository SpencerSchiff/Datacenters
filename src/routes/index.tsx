import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";

export const Route = createFileRoute("/")({
  component: LightsaberDuelGame,
});

interface Vector2D {
  x: number;
  y: number;
}

interface Lightsaber {
  base: Vector2D;
  tip: Vector2D;
  velocity: Vector2D;
  angle: number;
  angularVelocity: number;
  color: string;
  glowColor: string;
  isBlocking?: boolean;
  blockForce?: number;
}

interface Enemy {
  position: Vector2D;
  lightsaber: Lightsaber;
  health: number;
  state: 'approaching' | 'attacking' | 'recovering' | 'stunned';
  attackTimer: number;
  stunTimer: number;
  speed: number;
  attackPattern: 'swing' | 'thrust' | 'spin';
}

interface Player {
  position: Vector2D;
  lightsaber: Lightsaber;
  health: number;
  score: number;
  combo: number;
}

interface Particle {
  position: Vector2D;
  velocity: Vector2D;
  life: number;
  color: string;
  size: number;
}

function LightsaberDuelGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [mousePos, setMousePos] = useState<Vector2D>({ x: 400, y: 300 });
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const [player, setPlayer] = useState<Player>({
    position: { x: 400, y: 450 },
    lightsaber: {
      base: { x: 400, y: 450 },
      tip: { x: 400, y: 350 },
      velocity: { x: 0, y: 0 },
      angle: -Math.PI / 2,
      angularVelocity: 0,
      color: '#00ff00',
      glowColor: '#00ff00',
    },
    health: 10,
    score: 0,
    combo: 0,
  });

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Physics constants
  const LIGHTSABER_LENGTH = 100;
  const COLLISION_FORCE = 15;
  const ANGULAR_DAMPING = 0.85;
  const BLOCK_WINDOW = 0.3; // seconds
  const PARRY_BONUS = 2.0;

  // Calculate line segment intersection
  const lineIntersection = (p1: Vector2D, p2: Vector2D, p3: Vector2D, p4: Vector2D): Vector2D | null => {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(denom) < 0.001) return null;
    
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y),
      };
    }
    return null;
  };

  // Calculate normal vector at collision point
  const calculateCollisionNormal = (saber1: Lightsaber, saber2: Lightsaber): Vector2D => {
    const dx = saber2.base.x - saber1.base.x;
    const dy = saber2.base.y - saber1.base.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    return { x: dx / length, y: dy / length };
  };

  // Apply collision physics
  const applyCollisionPhysics = (saber1: Lightsaber, saber2: Lightsaber, collisionPoint: Vector2D) => {
    const normal = calculateCollisionNormal(saber1, saber2);
    
    // Calculate relative velocity at collision point
    const relativeVelocity = {
      x: saber2.velocity.x - saber1.velocity.x,
      y: saber2.velocity.y - saber1.velocity.y,
    };
    
    // Velocity along collision normal
    const velocityAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;
    
    // Don't resolve if velocities are separating
    if (velocityAlongNormal > 0) return;
    
    // Calculate restitution (bounciness)
    const restitution = 0.8;
    const impulse = 2 * velocityAlongNormal / 2;
    
    // Apply impulse to velocities
    saber1.velocity.x -= impulse * normal.x * restitution;
    saber1.velocity.y -= impulse * normal.y * restitution;
    saber2.velocity.x += impulse * normal.x * restitution;
    saber2.velocity.y += impulse * normal.y * restitution;
    
    // Add angular velocity based on collision position
    const arm1 = {
      x: collisionPoint.x - saber1.base.x,
      y: collisionPoint.y - saber1.base.y,
    };
    const arm2 = {
      x: collisionPoint.x - saber2.base.x,
      y: collisionPoint.y - saber2.base.y,
    };
    
    const torque1 = (arm1.x * normal.y - arm1.y * normal.x) * impulse * 0.01;
    const torque2 = -(arm2.x * normal.y - arm2.y * normal.x) * impulse * 0.01;
    
    saber1.angularVelocity += torque1;
    saber2.angularVelocity += torque2;
    
    // Mark blocking state
    saber1.isBlocking = true;
    saber2.isBlocking = true;
    saber1.blockForce = Math.abs(impulse);
    saber2.blockForce = Math.abs(impulse);
  };

  // Create spark particles at collision
  const createSparks = (position: Vector2D, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        life: 1,
        color: Math.random() > 0.5 ? '#ffffff' : '#ffff00',
        size: 2 + Math.random() * 3,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Update lightsaber physics
  const updateLightsaberPhysics = (saber: Lightsaber, deltaTime: number) => {
    // Update angle from angular velocity
    saber.angle += saber.angularVelocity * deltaTime;
    
    // Apply angular damping
    saber.angularVelocity *= Math.pow(ANGULAR_DAMPING, deltaTime);
    
    // Update tip position based on angle
    saber.tip.x = saber.base.x + Math.cos(saber.angle) * LIGHTSABER_LENGTH;
    saber.tip.y = saber.base.y + Math.sin(saber.angle) * LIGHTSABER_LENGTH;
    
    // Apply velocity damping
    saber.velocity.x *= Math.pow(0.9, deltaTime);
    saber.velocity.y *= Math.pow(0.9, deltaTime);
    
    // Clear blocking state after a short time
    if (saber.isBlocking) {
      saber.blockForce = (saber.blockForce || 0) * 0.9;
      if (saber.blockForce < 0.1) {
        saber.isBlocking = false;
      }
    }
  };

  const startGame = () => {
    setGameState('playing');
    setPlayer({
      position: { x: 400, y: 450 },
      lightsaber: {
        base: { x: 400, y: 450 },
        tip: { x: 400, y: 350 },
        velocity: { x: 0, y: 0 },
        angle: -Math.PI / 2,
        angularVelocity: 0,
        color: '#00ff00',
        glowColor: '#00ff00',
      },
      health: 10,
      score: 0,
      combo: 0,
    });
    setEnemies([createNewEnemy()]);
    setParticles([]);
    lastTimeRef.current = performance.now();
  };

  const createNewEnemy = (): Enemy => {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (side) {
      case 0: // top
        x = 100 + Math.random() * 600;
        y = 50;
        break;
      case 1: // right
        x = 750;
        y = 100 + Math.random() * 400;
        break;
      case 2: // bottom
        x = 100 + Math.random() * 600;
        y = 550;
        break;
      default: // left
        x = 50;
        y = 100 + Math.random() * 400;
    }
    
    const patterns: Enemy['attackPattern'][] = ['swing', 'thrust', 'spin'];
    
    return {
      position: { x, y },
      lightsaber: {
        base: { x, y },
        tip: { x, y: y - LIGHTSABER_LENGTH },
        velocity: { x: 0, y: 0 },
        angle: Math.PI / 2,
        angularVelocity: 0,
        color: '#ff0000',
        glowColor: '#ff0000',
      },
      health: 3,
      state: 'approaching',
      attackTimer: 0,
      stunTimer: 0,
      speed: 1 + Math.random() * 0.5,
      attackPattern: patterns[Math.floor(Math.random() * patterns.length)],
    };
  };

  const updateEnemyAI = (enemy: Enemy, deltaTime: number) => {
    const dx = player.position.x - enemy.position.x;
    const dy = player.position.y - enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const direction = Math.atan2(dy, dx);
    
    // Update timers
    if (enemy.state === 'stunned') {
      enemy.stunTimer -= deltaTime;
      if (enemy.stunTimer <= 0) {
        enemy.state = 'recovering';
        enemy.lightsaber.color = '#ff0000';
      } else {
        enemy.lightsaber.color = '#ff8800';
        return;
      }
    }
    
    switch (enemy.state) {
      case 'approaching':
        if (distance > 150) {
          enemy.position.x += Math.cos(direction) * enemy.speed;
          enemy.position.y += Math.sin(direction) * enemy.speed;
          enemy.lightsaber.base = { ...enemy.position };
          
          // Point lightsaber toward player
          const targetAngle = direction - Math.PI / 2;
          const angleDiff = targetAngle - enemy.lightsaber.angle;
          enemy.lightsaber.angularVelocity = angleDiff * 5;
        } else {
          enemy.state = 'attacking';
          enemy.attackTimer = 0;
        }
        break;
        
      case 'attacking':
        enemy.attackTimer += deltaTime;
        
        switch (enemy.attackPattern) {
          case 'swing':
            // Wide horizontal swing
            const swingAngle = Math.sin(enemy.attackTimer * 8) * Math.PI / 3;
            enemy.lightsaber.angle = direction - Math.PI / 2 + swingAngle;
            enemy.lightsaber.angularVelocity = Math.cos(enemy.attackTimer * 8) * 15;
            break;
            
          case 'thrust':
            // Quick thrust attack
            if (enemy.attackTimer < 0.3) {
              enemy.lightsaber.angle = direction;
              const thrustForce = 10;
              enemy.position.x += Math.cos(direction) * thrustForce * deltaTime;
              enemy.position.y += Math.sin(direction) * thrustForce * deltaTime;
              enemy.lightsaber.base = { ...enemy.position };
            } else {
              enemy.position.x -= Math.cos(direction) * 5 * deltaTime;
              enemy.position.y -= Math.sin(direction) * 5 * deltaTime;
              enemy.lightsaber.base = { ...enemy.position };
            }
            break;
            
          case 'spin':
            // Spinning attack
            enemy.lightsaber.angle += 15 * deltaTime;
            enemy.lightsaber.angularVelocity = 15;
            break;
        }
        
        if (enemy.attackTimer > 1.5) {
          enemy.state = 'recovering';
          enemy.attackTimer = 0;
        }
        break;
        
      case 'recovering':
        enemy.attackTimer += deltaTime;
        if (enemy.attackTimer > 0.5) {
          enemy.state = 'approaching';
          enemy.attackTimer = 0;
        }
        break;
    }
    
    updateLightsaberPhysics(enemy.lightsaber, deltaTime);
  };

  const gameLoop = useCallback((currentTime: number) => {
    if (gameState !== 'playing') return;
    
    const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = currentTime;
    
    // Update player lightsaber to follow mouse
    setPlayer(prev => {
      const newPlayer = { ...prev };
      
      // Calculate desired angle to mouse
      const dx = mousePos.x - newPlayer.position.x;
      const dy = mousePos.y - newPlayer.position.y;
      const targetAngle = Math.atan2(dy, dx);
      
      // Smooth rotation toward target
      let angleDiff = targetAngle - newPlayer.lightsaber.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      newPlayer.lightsaber.angularVelocity = angleDiff * 15;
      updateLightsaberPhysics(newPlayer.lightsaber, deltaTime);
      
      return newPlayer;
    });
    
    // Update enemies
    setEnemies(prev => {
      const updatedEnemies = prev.map(enemy => {
        const newEnemy = { ...enemy };
        updateEnemyAI(newEnemy, deltaTime);
        
        // Check collision with player lightsaber
        const collision = lineIntersection(
          player.lightsaber.base,
          player.lightsaber.tip,
          newEnemy.lightsaber.base,
          newEnemy.lightsaber.tip
        );
        
        if (collision) {
          applyCollisionPhysics(player.lightsaber, newEnemy.lightsaber, collision);
          createSparks(collision, 15);
          
          // Successful block/parry
          if (newEnemy.state === 'attacking') {
            setPlayer(p => ({
              ...p,
              score: p.score + 100 * (p.combo + 1),
              combo: Math.min(p.combo + 1, 10),
            }));
            
            // Stun enemy on strong block
            if (player.lightsaber.blockForce && player.lightsaber.blockForce > 10) {
              newEnemy.state = 'stunned';
              newEnemy.stunTimer = 1.0;
              newEnemy.lightsaber.angularVelocity *= -2;
            }
          }
        } else if (newEnemy.state === 'attacking' && enemy.attackTimer > 0.5) {
          // Check if enemy hit player (no block)
          const playerHitDistance = 30;
          const tipDx = newEnemy.lightsaber.tip.x - player.position.x;
          const tipDy = newEnemy.lightsaber.tip.y - player.position.y;
          const tipDistance = Math.sqrt(tipDx * tipDx + tipDy * tipDy);
          
          if (tipDistance < playerHitDistance) {
            setPlayer(p => {
              const newHealth = p.health - 1;
              if (newHealth <= 0) {
                setGameState('gameOver');
              }
              return { ...p, health: newHealth, combo: 0 };
            });
            
            // Push enemy back after hit
            newEnemy.state = 'recovering';
            newEnemy.attackTimer = 0;
            createSparks(player.position, 5);
          }
        }
        
        return newEnemy;
      });
      
      // Remove defeated enemies and spawn new ones
      const aliveEnemies = updatedEnemies.filter(e => e.health > 0);
      if (aliveEnemies.length < 2 && Math.random() < 0.02) {
        aliveEnemies.push(createNewEnemy());
      }
      
      return aliveEnemies;
    });
    
    // Update particles
    setParticles(prev => 
      prev
        .map(p => ({
          ...p,
          position: {
            x: p.position.x + p.velocity.x,
            y: p.position.y + p.velocity.y,
          },
          velocity: {
            x: p.velocity.x * 0.98,
            y: p.velocity.y * 0.98 + 0.1,
          },
          life: p.life - deltaTime * 2,
          size: p.size * 0.95,
        }))
        .filter(p => p.life > 0)
    );
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, player, mousePos]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Clear with space background
    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 500);
    gradient.addColorStop(0, '#000814');
    gradient.addColorStop(1, '#001233');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Draw stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % 800;
      const y = (i * 239) % 600;
      const size = (i % 3) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (gameState === 'playing') {
      // Draw particles
      particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw lightsabers
      const drawLightsaber = (saber: Lightsaber) => {
        ctx.save();
        
        // Draw glow
        ctx.strokeStyle = saber.glowColor;
        ctx.shadowColor = saber.glowColor;
        ctx.shadowBlur = saber.isBlocking ? 40 : 25;
        ctx.lineWidth = saber.isBlocking ? 20 : 15;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(saber.base.x, saber.base.y);
        ctx.lineTo(saber.tip.x, saber.tip.y);
        ctx.stroke();
        
        // Draw core
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(saber.base.x, saber.base.y);
        ctx.lineTo(saber.tip.x, saber.tip.y);
        ctx.stroke();
        
        // Draw hilt
        ctx.fillStyle = '#333333';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(saber.base.x, saber.base.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      };

      // Draw enemies
      enemies.forEach(enemy => {
        // Draw body
        ctx.save();
        ctx.fillStyle = enemy.state === 'stunned' ? '#ff8800' : '#cc0000';
        ctx.shadowColor = enemy.lightsaber.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        drawLightsaber(enemy.lightsaber);
      });

      // Draw player
      ctx.save();
      ctx.fillStyle = player.lightsaber.isBlocking ? '#00ff88' : '#0088ff';
      ctx.shadowColor = player.lightsaber.glowColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      drawLightsaber(player.lightsaber);

      // Draw combo indicator
      if (player.combo > 0) {
        ctx.save();
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(`x${player.combo}`, player.position.x, player.position.y - 40);
        ctx.restore();
      }
    }
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-4">
        <h1 className="text-5xl font-bold mb-2 text-yellow-400 tracking-wider">
          LIGHTSABER DUEL
        </h1>
        <p className="text-lg text-blue-300">Master the art of lightsaber combat!</p>
        
        {gameState === 'playing' && (
          <div className="flex gap-8 justify-center text-lg mb-2 mt-4">
            <span className="text-yellow-400">Score: {player.score}</span>
            <span className="text-green-400">Health: {player.health}</span>
            {player.combo > 0 && (
              <span className="text-orange-400 animate-pulse">Combo x{player.combo}</span>
            )}
            {player.lightsaber.isBlocking && (
              <span className="text-cyan-400 font-bold">BLOCKING!</span>
            )}
          </div>
        )}
      </div>

      <div className="relative border-2 border-blue-800 rounded-lg overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          className="cursor-none"
        />

        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
            <div className="text-center max-w-md px-6">
              <h2 className="text-3xl mb-6 text-yellow-400 font-bold">Prepare for Battle</h2>
              <div className="mb-6 text-left space-y-3 text-sm bg-blue-900 bg-opacity-30 p-4 rounded-lg">
                <p className="flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Move your mouse to control your lightsaber
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-2xl">⚔️</span>
                  Cross blades with enemies to block their attacks
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-2xl">💥</span>
                  Watch for realistic physics and blade deflection
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  Build combos by blocking multiple attacks
                </p>
              </div>
              <button
                onClick={startGame}
                className="btn btn-primary btn-lg animate-pulse"
              >
                Begin Duel
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
            <div className="text-center max-w-md px-6">
              <h2 className="text-4xl mb-4 text-red-400 font-bold">Defeated</h2>
              <p className="text-2xl text-yellow-400 mb-6">Final Score: {player.score}</p>
              <button
                onClick={startGame}
                className="btn btn-primary btn-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-sm opacity-70 max-w-2xl">
        <p>Control your lightsaber with the mouse. When blades collide, they deflect realistically!</p>
        <p>Time your blocks perfectly to stun enemies and build combos for higher scores.</p>
      </div>
    </div>
  );
}