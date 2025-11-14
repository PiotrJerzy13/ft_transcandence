// Arena state
import { useState } from 'react';
import { CustomizationProfile } from './CustomizationPanel';
import { ArenaOptions } from './ArenaSettings';

export const useCustomization = (initial?: CustomizationProfile) => {
  const [arena, setArena] = useState<ArenaOptions>(
    initial?.arena || { theme: 'Classic', backgroundColor: '#000000', borderStyle: 'solid' }
  );

  // Ball state
  import { BallOptions } from './ArenaSettings';
  const [ball, setBall] = useState<BallOptions>(
    initial?.ball || { speed: 5, size: 20, color: '#ff0000' }
  );

  // Paddle state
  import { PaddleOptions } from './PaddleSettings';
  const [paddle, setPaddle] = useState<PaddleOptions>(
    initial?.paddle || { height: 100, width: 20, color: '#0000ff' }
  );

  // getProfile function
  const getProfile = (): CustomizationProfile => ({
    name: initial?.name || 'Default Profile',
    arena,
    ball,
    paddle
  });

  return {
    arena,
    setArena,
    ball,
    setBall,
    paddle,
    setPaddle,
    getProfile
  };
};
