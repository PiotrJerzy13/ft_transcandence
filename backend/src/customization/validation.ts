import { GameCustomizationProfile } from './customizationTypes';

export function validateBallOptions(ball: any): boolean {
  return (
    typeof ball.speed === 'number' &&
    ball.speed > 0 &&
    typeof ball.size === 'number' &&
    ball.size > 0 &&
    typeof ball.color === 'string' &&
    ball.color.length > 0
  );
}