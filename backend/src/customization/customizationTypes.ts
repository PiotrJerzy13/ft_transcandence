
export interface BallOptions {
	speed: number;       // prędkość piłki
	size: number;        // rozmiar piłki
	color: string;       // kolor piłki
  }
  
  export interface PaddleOptions {
	height: number;      // wysokość paletki
	width: number;       // szerokość paletki
	color: string;       // kolor paletki
  }
  
  export interface ArenaOptions {
	theme: string;       // motyw / styl planszy
	backgroundColor: string; // kolor tła
	borderStyle: string; // styl krawędzi
  }
  
  export interface GameCustomizationProfile {
	name: string;            // nazwa profilu
	ball: BallOptions;
	paddle: PaddleOptions;
	arena: ArenaOptions;
  }
  