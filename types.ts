export interface Move {
  name: string;
  type: PokemonType;
  power: number;
  accuracy: number;
  maxPp: number;
}

export enum PokemonType {
  Normal = '一般',
  Fire = '火',
  Water = '水',
  Grass = '草',
  Electric = '电',
  Ice = '冰',
  Fighting = '格斗',
  Poison = '毒',
  Ground = '地面',
  Flying = '飞行',
  Psychic = '超能',
  Bug = '虫',
  Rock = '岩石',
  Ghost = '幽灵',
  Dragon = '龙',
  Steel = '钢',
  Fairy = '妖精',
  Dark = '恶',
}

export interface Pokemon {
  id: number;
  name: string;
  type: PokemonType;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  moves: Move[];
  spriteFront: string;
  spriteBack: string;
}

export interface BattleState {
  playerPokemon: Pokemon;
  opponentPokemon: Pokemon;
  turn: 'player' | 'opponent';
  isGameOver: boolean;
  winner: 'player' | 'opponent' | null;
  logs: string[];
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  effectiveness: number; // 0.5, 1, 2
  survived: boolean;
}