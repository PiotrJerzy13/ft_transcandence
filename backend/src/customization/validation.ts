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

export function validatePaddleOptions(paddle: any): boolean {
	return (
	  typeof paddle.height === 'number' &&
	  paddle.height > 0 &&
	  typeof paddle.width === 'number' &&
	  paddle.width > 0 &&
	  typeof paddle.color === 'string' &&
	  paddle.color.length > 0
	);
  }

  export function validateArenaOptions(arena: any): boolean {
	return (
	  typeof arena.theme === 'string' &&
	  arena.theme.length > 0 &&
	  typeof arena.backgroundColor === 'string' &&
	  arena.backgroundColor.length > 0 &&
	  typeof arena.borderStyle === 'string' &&
	  arena.borderStyle.length > 0
	);
  }