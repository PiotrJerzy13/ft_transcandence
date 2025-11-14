// Arena state
import { useState } from 'react';
import { CustomizationProfile } from './CustomizationPanel';
import { ArenaOptions } from './ArenaSettings';

export const useCustomization = (initial?: CustomizationProfile) => {
  const [arena, setArena] = useState<ArenaOptions>(
    initial?.arena || { theme: 'Classic', backgroundColor: '#000000', borderStyle: 'solid' }
  );

