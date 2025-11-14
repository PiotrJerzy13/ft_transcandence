export interface CosmeticItem {
  id: string;
  name: string;
  type: 'paddle' | 'ball' | 'arena' | 'particle';
  category: string;
  price: number;
  currency: 'credits' | 'gems';
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview?: string;
  owned: boolean;
  equipped: boolean;
}

export interface CosmeticProfile {
  paddleStyle: CosmeticItem;
  ballStyle: CosmeticItem;
  arenaTheme: CosmeticItem;
  particleEffect?: CosmeticItem;
}

export interface PlayerInventory {
  userId: number;
  cosmetics: CosmeticItem[];
  totalCredits: number;
  totalGems: number;
  lastUpdated: string;
}

