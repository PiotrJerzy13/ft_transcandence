// backend/src/customization/customizationRoutes.mts

import { Router } from 'express';
import {
  getCustomizationOptions,
  saveCustomizationProfile,
  getProfileByName
} from './customizationController';

const router = Router();

router.get('/options', getCustomizationOptions);
router.post('/save', saveCustomizationProfile);
router.get('/:name', getProfileByName);

export default router;
