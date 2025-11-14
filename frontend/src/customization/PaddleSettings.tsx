import React, { useState } from 'react';
import { PaddleSettingsData } from './customizationTypes';

interface PaddleSettingsProps {
  initial?: PaddleSettingsData;
  onChange: (data: PaddleSettingsData) => void;
}

export interface PaddleOptions {
  height: number;
  width: number;
  color: string;
}

interface PaddleSettingsProps {
	onChange: (paddle: PaddleOptions) => void;
	initial?: PaddleOptions;
  }
  
  const PaddleSettings: React.FC<PaddleSettingsProps> = ({ onChange, initial }) => {
	const [height, setHeight] = useState(initial?.height || 100);
	const [width, setWidth] = useState(initial?.width || 20);
	const [color, setColor] = useState(initial?.color || '#0000ff');
  
	const handleChange = () => {
	  onChange({ height, width, color });
	};
  
	return (
	  <div className="paddle-settings">
		<label>
		  Height:
		  <input
			type="number"
			min={1}
			value={height}
			onChange={(e) => { setHeight(Number(e.target.value)); handleChange(); }}
		  />
		</label>
  
		<label>
		  Width:
		  <input
			type="number"
			min={1}
			value={width}
			onChange={(e) => { setWidth(Number(e.target.value)); handleChange(); }}
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
  
  export default PaddleSettings;
  