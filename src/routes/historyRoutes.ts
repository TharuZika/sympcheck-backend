import { Router } from 'express';
import { HistoryController } from '../controllers/historyController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();
const historyController = new HistoryController();

router.use(authenticateToken);

router.get('/', historyController.getHistory);
router.get('/analytics', historyController.getAnalytics);
router.get('/:id', historyController.getHistoryById);
router.delete('/:id', historyController.deleteHistory);

export default router;
