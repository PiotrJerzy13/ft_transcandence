import { Request, Response } from 'express';
import { GameCustomizationProfile } from './customizationTypes';


const defaultProfile: GameCustomizationProfile = {
name: 'Default Profile',
ball: { speed: 5, size: 20, color: 'red' },
paddle: { height: 100, width: 20, color: 'blue' },
arena: { theme: 'Classic', backgroundColor: 'black', borderStyle: 'solid' },
};

export const getCustomizationOptions = (req: Request, res: Response) => {
res.json(defaultProfile);
};

let savedProfiles: GameCustomizationProfile[] = [];

export const saveCustomizationProfile = (req: Request, res: Response) => {
const profile: GameCustomizationProfile = req.body;
if (!profile.name) {
return res.status(400).json({ message: 'Profile must have a name' });
}
savedProfiles.push(profile);
res.json({ message: 'Profile saved', profile });
};
