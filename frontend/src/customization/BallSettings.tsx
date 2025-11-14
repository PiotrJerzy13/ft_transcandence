import React, { useState } from 'react';

interface BallOptions {
  speed: number;
  size: number;
  color: string;
}

interface BallSettingsProps {
	onChange: (ball: BallOptions) => void;
	initial?: BallOptions;
  }
  
  
const BallSettings: React.FC<BallSettingsProps> = ({ onChange, initial }) => {
	const [speed, setSpeed] = useState(initial?.speed || 5);
	const [size, setSize] = useState(initial?.size || 20);
	const [color, setColor] = useState(initial?.color || '#ff0000');
  
	const handleChange = () => {
	  onChange({ speed, size, color });
	};
  
	return (
	  <div className="ball-settings">
		<label>
		  Speed:
		  <input
			type="number"
			min={1}
			value={speed}
			onChange={(e) => { setSpeed(Number(e.target.value)); handleChange(); }}
		  />
		</label>
  
		<label>
		  Size:
		  <input
			type="number"
			min={1}
			value={size}
			onChange={(e) => { setSize(Number(e.target.value)); handleChange(); }}
		  />
		</label>
  
		<label>
		  Color:
		  <input
			type="color"
			value={color}
			onChange={(e) => { setColor(e.target.value); handleChange(); }}
		  />
		</label>
	  </div>
	);
  };
  
  export default BallSettings;
