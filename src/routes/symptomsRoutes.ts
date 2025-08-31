import { Router } from 'express';
import { SymptomsController } from '../controllers/symptomsController';
import { optionalAuth } from '../middlewares/auth';

const router = Router();
const symptomsController = new SymptomsController();

router.post('/analyze', optionalAuth, symptomsController.analyzeSymptoms);
router.post('/parse', symptomsController.parseSymptoms);

export default router; 