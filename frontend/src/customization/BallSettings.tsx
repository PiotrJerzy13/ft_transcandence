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
  
  