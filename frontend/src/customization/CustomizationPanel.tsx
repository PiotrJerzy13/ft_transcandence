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
  
  const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ onChange, initial }) => {
	const [arena, setArena] = useState(initial?.arena || { theme: 'Classic', backgroundColor: '#000000', borderStyle: 'solid' });
	const [ball, setBall] = useState(initial?.ball || { speed: 5, size: 20, color: '#ff0000' });
  
	const handleChange = () => {
	  onChange({
		name: initial?.name || 'Default Profile',
		arena,
		ball
	  });
	};
  
	return (
	  <div className="customization-panel">
		<h2>Customize Your Game</h2>
		<ArenaSettings
		  initial={arena}
		  onChange={(updatedArena) => { setArena(updatedArena); handleChange(); }}
		/>
		<BallSettings
		  initial={ball}
		  onChange={(updatedBall) => { setBall(updatedBall); handleChange(); }}
		/>
	  </div>
	);
  };
  
  export default CustomizationPanel;
  