import { Request, Response } from 'express';
import { SymptomsService } from '../services/symptomsService';

export class SymptomsController {
  private symptomsService: SymptomsService;

  constructor() {
    this.symptomsService = new SymptomsService();
  }

  public analyzeSymptoms = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symptomps, sympList, age } = req.body;

      if (!symptomps || !sympList || !age) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields: symptomps, sympList, and age are required'
        });
        return;
      }

      if (typeof symptomps !== 'string') {
        res.status(400).json({
          status: 'error',
          message: 'symptomps must be a string'
        });
        return;
      }

      if (!Array.isArray(sympList)) {
        res.status(400).json({
          status: 'error',
          message: 'sympList must be an array'
        });
        return;
      }

      if (isNaN(Number(age))) {
        res.status(400).json({
          status: 'error',
          message: 'age must be a valid number'
        });
        return;
      }

      const result = this.symptomsService.analyzeSymptoms({
        symptomps,
        sympList,
        age: age.toString()
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in analyzeSymptoms:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  };
} 