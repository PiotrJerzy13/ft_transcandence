import React, { useState } from 'react';
import ArenaSettings, { ArenaOptions, BallOptions } from './ArenaSettings';
import BallSettings from './BallSettings';

export interface CustomizationProfile {
	name: string;
	arena: ArenaOptions;
	ball: BallOptions;
  }
  
  interface CustomizationPanelProps {
	onChange: (profile: CustomizationProfile) => void;
	initial?: CustomizationProfile;
  }
  