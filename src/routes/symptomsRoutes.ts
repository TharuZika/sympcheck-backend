import { Router } from 'express';
import { SymptomsController } from '../controllers/symptomsController';

const router = Router();
const symptomsController = new SymptomsController();

// make analyze
router.post('/analyze', symptomsController.analyzeSymptoms);

export default router; 