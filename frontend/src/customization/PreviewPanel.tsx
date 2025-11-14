import React from 'react';
import { ArenaSettingsData, BallSettingsData, PaddleSettingsData } from './customizationTypes';

interface PreviewPanelProps {
  arena: ArenaSettingsData;
  ball: BallSettingsData;
  paddle: PaddleSettingsData;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ arena, ball, paddle }) => {
  return (
    <div className="preview-container">
      <div
        className="preview-arena"
        style={{
          backgroundColor: arena.backgroundColor,
          borderStyle: arena.borderStyle,
          borderWidth: '4px',
          borderColor: '#fff',
          width: '300px',
          height: '200px',
          position: 'relative'
        }}
      >
      </div>
    </div>
  );
};
      <div
        className="preview-ball"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${ball.size}px`,
          height: `${ball.size}px`,
          backgroundColor: ball.color,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
