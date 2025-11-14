import { useState, useEffect } from 'react';

interface ScaleOptions {
  width: number;
  height: number;
}

const usePreviewScale = (options: ScaleOptions) => {
  const [scale, setScale] = useState(1);

    useEffect(() => {
    const resize = () => {
      const maxWidth = 320;
      const maxHeight = 220;

      const widthRatio = maxWidth / options.width;
      const heightRatio = maxHeight / options.height;

      setScale(Math.min(widthRatio, heightRatio));
    };

    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [options.width, options.height]);
  
  return scale;
};

export default usePreviewScale;
