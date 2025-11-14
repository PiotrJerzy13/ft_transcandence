import React, { useState } from 'react';

export interface PaddleOptions {
  height: number;
  width: number;
  color: string;
}

interface PaddleSettingsProps {
	onChange: (paddle: PaddleOptions) => void;
	initial?: PaddleOptions;
  }
  