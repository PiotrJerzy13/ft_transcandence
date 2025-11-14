
export interface BallOptions {
	speed: number;       
	size: number;        
	color: string;      
  }
  
  export interface PaddleOptions {
	height: number;     
	width: number;
	color: string;
  }
  
  export interface ArenaOptions {
	theme: string;
	backgroundColor: string; 
	borderStyle: string; 
  }
  
  export interface GameCustomizationProfile {
	name: string;            
	ball: BallOptions;
	paddle: PaddleOptions;
	arena: ArenaOptions;
  }
  