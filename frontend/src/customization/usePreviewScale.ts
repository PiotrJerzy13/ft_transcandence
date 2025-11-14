import { useState, useEffect } from 'react';

interface ScaleOptions {
  width: number;
  height: number;
}

const usePreviewScale = (options: ScaleOptions) => {
  const [scale, setScale] = useState(1);
