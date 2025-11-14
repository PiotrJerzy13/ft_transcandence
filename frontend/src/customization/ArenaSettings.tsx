import React, { useState } from 'react';

interface ArenaOptions {
  theme: string;
  backgroundColor: string;
  borderStyle: string;
}

interface ArenaSettingsProps {
	onChange: (arena: ArenaOptions) => void;
	initial?: ArenaOptions;
  }

const ArenaSettings: React.FC<ArenaSettingsProps> = ({ onChange, initial }) => {
	const [theme, setTheme] = useState(initial?.theme || 'Classic');
	const [backgroundColor, setBackgroundColor] = useState(initial?.backgroundColor || '#000000');
	const [borderStyle, setBorderStyle] = useState(initial?.borderStyle || 'solid');
  
	const handleChange = () => {
	  onChange({ theme, backgroundColor, borderStyle });
	};
  
	return (
	  <div className="arena-settings">
		<label>
		  Theme:
		  <input
			type="text"
			value={theme}
			onChange={(e) => { setTheme(e.target.value); handleChange(); }}
		  />
		</label>
  
		<label>
		  Background Color:
		  <input
			type="color"
			value={backgroundColor}
			onChange={(e) => { setBackgroundColor(e.target.value); handleChange(); }}
		  />
		</label>
  
		<label>
		  Border Style:
		  <select
			value={borderStyle}
			onChange={(e) => { setBorderStyle(e.target.value); handleChange(); }}
		  >
			<option value="solid">Solid</option>
			<option value="dashed">Dashed</option>
			<option value="dotted">Dotted</option>
		  </select>
		</label>
	  </div>
	);
  };
  
  export default ArenaSettings;