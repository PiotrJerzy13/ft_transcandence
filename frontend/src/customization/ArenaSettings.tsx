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
  