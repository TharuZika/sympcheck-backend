import { Request, Response } from 'express';
import { SymptomsService } from '../services/symptomsService';
import { SymptomParserService } from '../services/symptomParserService';
const { SymptomHistory } = require('../models');

export class SymptomsController {
  private symptomsService: SymptomsService;
  private symptomParserService: SymptomParserService;

  constructor() {
    this.symptomsService = new SymptomsService();
    this.symptomParserService = new SymptomParserService();
  }

  public analyzeSymptoms = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symptomps, sympList, age } = req.body;
      
      if (!symptomps && !sympList) {
        res.status(400).json({
          status: 'error',
          message: 'Please provide symptoms either as text (symptomps) or array (sympList)'
        });
        return;
      }

      let processedSymptoms: string[] = [];
      let originalInput: string = '';
      let parseWarnings: string[] = [];

      if (sympList && Array.isArray(sympList) && sympList.length > 0) {
        processedSymptoms = sympList.map((symptom: string) => 
          symptom.trim().toLowerCase().replace(/\s+/g, '_')
        );
        originalInput = sympList.join(', ');
      } else if (symptomps && typeof symptomps === 'string') {
        console.log('Parsing symptoms with Gemini:', symptomps);
        const parseResult = await this.symptomParserService.parseSymptoms(symptomps);
        
        if (!parseResult.isValid || parseResult.symptoms.length === 0) {
          res.status(400).json({
            status: 'error',
            message: 'No valid symptoms found in your input',
            warnings: parseResult.warnings,
            originalInput: symptomps
          });
          return;
        }

        processedSymptoms = parseResult.symptoms.map(symptom => 
          symptom.trim().toLowerCase().replace(/\s+/g, '_')
        );
        originalInput = symptomps;
        parseWarnings = parseResult.warnings;
      }

      if (processedSymptoms.length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'No valid symptoms provided'
        });
        return;
      }

      console.log('Processing symptoms:', processedSymptoms);
      
      const result = await this.symptomsService.analyzeSymptoms({
        symptoms: processedSymptoms,
        originalInput,
        age: age ? age.toString() : undefined
      });
      
      if (req.user) {
        try {
          await SymptomHistory.create({
            userId: req.user.id,
            originalInput,
            processedSymptoms,
            predictions: result.predictions,
            age: age ? age.toString() : undefined,
            timestamp: new Date()
          });
          console.log('Symptom analysis saved to history for user:', req.user.id);
        } catch (historyError) {
          console.error('Failed to save to history:', historyError); 
        }
      }

      res.status(200).json({
        status: 'success',
        data: {
          ...result,
          parseWarnings: parseWarnings.length > 0 ? parseWarnings : undefined,
          savedToHistory: !!req.user
        },
        message: 'Symptoms analyzed successfully'
      });

    } catch (error) {
      console.error('Error in analyzeSymptoms:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      });
    }
  };

  
  public parseSymptoms = async (req: Request, res: Response): Promise<void> => {
    try {
      const { input } = req.body;

      if (!input || typeof input !== 'string') {
        res.status(400).json({
          status: 'error',
          message: 'Please provide symptom input text'
        });
        return;
      }

      const parseResult = await this.symptomParserService.parseSymptoms(input);
     
      if (req.user) {
        try {
          await SymptomHistory.create({
            userId: req.user.id,
            originalInput: input,
            processedSymptoms: parseResult.symptoms,
            predictions: null, 
            age: req.user.age ? req.user.age.toString() : undefined,
            timestamp: new Date()
          });
          console.log('Symptom parsing saved to history for user:', req.user.id);
        } catch (historyError) {
          console.error('Failed to save parsing to history:', historyError);
        }
      }

      res.status(200).json({
        status: 'success',
        data: parseResult,
        message: 'Symptoms parsed successfully',
        savedToHistory: !!req.user
      });

    } catch (error) {
      console.error('Error in parseSymptoms:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      });
    }
  };
} 