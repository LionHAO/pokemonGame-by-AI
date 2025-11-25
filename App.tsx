import React, { useState, useEffect, useCallback, useRef } from 'react';
import { POKEMON_ROSTER } from './constants';
import { Pokemon, Move, DamageResult, PokemonType } from './types';
import HealthBar from './components/HealthBar';
import BattleLog from './components/BattleLog';
import { getBattleCommentary, getIntroCommentary } from './services/geminiService';

const App: React.FC = () => {
  // Game State
  const [hasStarted, setHasStarted] = useState(false);
  const [playerPokemon, setPlayerPokemon] = useState<Pokemon | null>(null);
  const [opponentPokemon, setOpponentPokemon] = useState<Pokemon | null>(null);
  const [turn, setTurn] = useState<'player' | 'opponent'>('player');
  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  
  // Animation State
  const [animating, setAnimating] = useState(false);
  const [playerAnim, setPlayerAnim] = useState('');
  const [opponentAnim, setOpponentAnim] = useState('');

  // Refs for audio/timers if needed
  const battleEndRef = useRef(false);

  // Initialize Game
  const startGame = useCallback((selectedId: number) => {
    const playerBase = POKEMON_ROSTER.find(p => p.id === selectedId);
    // Random opponent that isn't the player
    const availableOpponents = POKEMON_ROSTER.filter(p => p.id !== selectedId);
    const opponentBase = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];

    if (playerBase && opponentBase) {
      // Deep copy to reset HP if replaying
      setPlayerPokemon({ ...playerBase });
      setOpponentPokemon({ ...opponentBase });
      setTurn('player');
      setBattleLogs([]);
      setIsGameOver(false);
      setWinner(null);
      setHasStarted(true);
      battleEndRef.current = false;

      // AI Intro
      getIntroCommentary(playerBase.name, opponentBase.name).then(comment => {
          setBattleLogs(prev => [...prev, comment]);
      });
    }
  }, []);

  // Damage Calculation Logic
  const calculateDamage = (attacker: Pokemon, defender: Pokemon, move: Move): DamageResult => {
    // Basic Formula: Damage = ((((2 * Level / 5 + 2) * AttackStat * AttackPower / DefenseStat) / 50) + 2) * Modifier
    // Simplified: Damage = (Attacker.Atk / Defender.Def) * Move.Power * Random(0.85, 1.0)
    
    // Type effectiveness (Simplified for MVP)
    let effectiveness = 1;
    if (move.type === PokemonType.Fire && defender.type === PokemonType.Grass) effectiveness = 2;
    if (move.type === PokemonType.Water && defender.type === PokemonType.Fire) effectiveness = 2;
    if (move.type === PokemonType.Electric && defender.type === PokemonType.Water) effectiveness = 2;
    if (move.type === PokemonType.Grass && defender.type === PokemonType.Water) effectiveness = 2;
    // ... add more rules as needed or keep simple

    const random = (Math.random() * 0.15) + 0.85; // 0.85 to 1.0
    const rawDamage = ((attacker.attack / defender.defense) * move.power * 0.5) * effectiveness * random;
    
    const isCritical = Math.random() < 0.0625; // 1/16 chance
    const finalDamage = Math.floor(rawDamage * (isCritical ? 1.5 : 1));

    return {
      damage: Math.max(1, finalDamage),
      isCritical,
      effectiveness,
      survived: (defender.currentHp - finalDamage) > 0
    };
  };

  const handleTurn = async (move: Move, attacker: 'player' | 'opponent') => {
    if (battleEndRef.current || animating) return;

    setAnimating(true);

    const isPlayer = attacker === 'player';
    const attackingMon = isPlayer ? playerPokemon! : opponentPokemon!;
    const defendingMon = isPlayer ? opponentPokemon! : playerPokemon!;
    const setDefendingMon = isPlayer ? setOpponentPokemon : setPlayerPokemon;

    // 1. Animation: Attack
    if (isPlayer) setPlayerAnim('animate-attack'); 
    else setOpponentAnim('animate-attack-enemy');

    await new Promise(r => setTimeout(r, 300));

    // 2. Calculation
    const result = calculateDamage(attackingMon, defendingMon, move);
    
    // 3. Update HP & Animation: Damage
    if (isPlayer) setPlayerAnim(''); else setOpponentAnim('');
    
    if (isPlayer) setOpponentAnim('animate-damage animate-shake');
    else setPlayerAnim('animate-damage animate-shake');

    // Update State
    const newHp = Math.max(0, defendingMon.currentHp - result.damage);
    setDefendingMon(prev => prev ? ({ ...prev, currentHp: newHp }) : null);

    // AI Commentary
    getBattleCommentary(
      attackingMon.name, 
      move.name, 
      defendingMon.name, 
      result.damage, 
      result.isCritical, 
      newHp === 0
    ).then(comment => {
      setBattleLogs(prev => [...prev, comment]);
    });

    await new Promise(r => setTimeout(r, 600)); // Wait for shake
    if (isPlayer) setOpponentAnim(''); else setPlayerAnim('');

    // 4. Check Win/Loss
    if (newHp === 0) {
      battleEndRef.current = true;
      setIsGameOver(true);
      setWinner(isPlayer ? 'player' : 'opponent');
      setAnimating(false);
      return;
    }

    // 5. Switch Turn
    setTurn(isPlayer ? 'opponent' : 'player');
    setAnimating(false);
  };

  // Opponent AI Logic
  useEffect(() => {
    if (turn === 'opponent' && !isGameOver && !animating && opponentPokemon) {
      const timer = setTimeout(() => {
        const moves = opponentPokemon.moves;
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        handleTurn(randomMove, 'opponent');
      }, 1500); // Delay for realism
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, isGameOver, animating, opponentPokemon]);

  // Render Selection Screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl md:text-6xl text-yellow-400 font-bold mb-8 text-center drop-shadow-md" style={{ fontFamily: '"ZCOOL KuaiLe", sans-serif' }}>
          宝可梦 AI 对战
        </h1>
        <p className="text-gray-300 mb-8 text-lg">请选择你的出战伙伴</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {POKEMON_ROSTER.map(p => (
            <button
              key={p.id}
              onClick={() => startGame(p.id)}
              className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-yellow-400 rounded-xl p-4 flex flex-col items-center transition-all transform hover:scale-105"
            >
              <img src={p.spriteFront} alt={p.name} className="w-24 h-24 object-contain pixelated" />
              <span className="text-white font-bold mt-2">{p.name}</span>
              <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded mt-1">{p.type}系</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Render Battle Screen
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-2 md:p-4">
      
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4 px-4 py-2 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-yellow-400 font-bold text-xl">AI Battle Arena</h2>
        <button 
          onClick={() => setHasStarted(false)}
          className="text-gray-400 hover:text-white text-sm underline"
        >
          退出对战
        </button>
      </div>

      <div className="w-full max-w-4xl flex-grow flex flex-col bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 relative">
        
        {/* Background / Arena */}
        <div className="relative h-64 md:h-96 bg-gradient-to-b from-blue-900 to-green-900 flex flex-col justify-between p-6 overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>

          {/* Opponent Area (Top Right) */}
          <div className="flex justify-between items-start w-full">
            <div className="z-10 w-2/3 md:w-1/2 pt-2 md:pt-8 pl-2">
              <HealthBar 
                current={opponentPokemon!.currentHp} 
                max={opponentPokemon!.maxHp} 
                label={opponentPokemon!.name} 
              />
            </div>
            <div className="relative w-32 h-32 md:w-48 md:h-48 flex justify-center items-center">
              <div className="absolute bottom-0 w-24 h-6 bg-black opacity-30 rounded-[100%] blur-sm transform translate-y-2"></div>
              <img 
                src={opponentPokemon!.spriteFront} 
                alt="Opponent" 
                className={`w-full h-full object-contain pixelated ${opponentAnim}`} 
              />
            </div>
          </div>

          {/* Player Area (Bottom Left) */}
          <div className="flex justify-between items-end w-full mt-4">
            <div className="relative w-32 h-32 md:w-48 md:h-48 flex justify-center items-center">
              <div className="absolute bottom-0 w-24 h-6 bg-black opacity-30 rounded-[100%] blur-sm transform translate-y-2"></div>
              <img 
                src={playerPokemon!.spriteBack} 
                alt="Player" 
                className={`w-full h-full object-contain pixelated ${playerAnim}`} 
              />
            </div>
            <div className="z-10 w-2/3 md:w-1/2 pb-2 md:pb-8 pr-2 flex justify-end">
              <HealthBar 
                current={playerPokemon!.currentHp} 
                max={playerPokemon!.maxHp} 
                label={playerPokemon!.name} 
              />
            </div>
          </div>
        </div>

        {/* UI Panel */}
        <div className="bg-gray-800 p-4 border-t-4 border-gray-600">
          
          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center p-6">
              <h2 className="text-5xl font-bold text-white mb-4 animate-bounce">
                {winner === 'player' ? '胜利!' : '失败!'}
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                {winner === 'player' 
                  ? `${playerPokemon!.name} 赢得了战斗!` 
                  : `${opponentPokemon!.name} 击败了你!`}
              </p>
              <button 
                onClick={() => setHasStarted(false)}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-full text-xl shadow-lg transform hover:scale-110 transition-transform"
              >
                再来一局
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-48">
            {/* Battle Log */}
            <div className="h-full">
              <BattleLog logs={battleLogs} />
            </div>

            {/* Controls */}
            <div className="bg-gray-700 rounded-lg p-3 grid grid-cols-2 gap-3 h-full">
              <div className="col-span-2 text-white text-sm mb-1 flex justify-between">
                 <span>{turn === 'player' ? '你的回合' : '对手回合...'}</span>
                 <span className="text-gray-400 text-xs">AI Powered</span>
              </div>
              
              {playerPokemon!.moves.map((move, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTurn(move, 'player')}
                  disabled={turn !== 'player' || animating || isGameOver}
                  className={`
                    relative overflow-hidden rounded-lg p-2 text-left transition-all
                    ${turn !== 'player' || animating 
                      ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                      : 'bg-gray-200 hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] active:scale-95'
                    }
                  `}
                >
                  <span className="block font-bold text-gray-900">{move.name}</span>
                  <span className="block text-xs text-gray-600">
                    {move.type} | Power: {move.power}
                  </span>
                  {/* Type badge background hint */}
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-gray-400 opacity-20"></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;