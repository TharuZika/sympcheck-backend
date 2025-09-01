import { Request, Response } from 'express';
const { SymptomHistory, User } = require('../models');
import { Op } from 'sequelize';

export class HistoryController {
  public getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      const { page = 1, limit = 10, startDate, endDate } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const whereClause: any = { userId: req.user.id };
      
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) {
          whereClause.timestamp[Op.gte] = new Date(startDate as string);
        }
        if (endDate) {
          whereClause.timestamp[Op.lte] = new Date(endDate as string);
        }
      }

      const { count, rows: history } = await SymptomHistory.findAndCountAll({
        where: whereClause,
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit as string),
        offset,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }]
      });

      const totalPages = Math.ceil(count / parseInt(limit as string));

      res.status(200).json({
        status: 'success',
        data: {
          history,
          pagination: {
            currentPage: parseInt(page as string),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit as string)
          }
        }
      });

    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      });
    }
  };

  public getHistoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;

      const historyItem = await SymptomHistory.findOne({
        where: { 
          id: parseInt(id),
          userId: req.user.id 
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }]
      });

      if (!historyItem) {
        res.status(404).json({
          status: 'error',
          message: 'History item not found'
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: historyItem
      });

    } catch (error) {
      console.error('Get history by ID error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      });
    }
  };

  public deleteHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;

      const deleted = await SymptomHistory.destroy({
        where: { 
          id: parseInt(id),
          userId: req.user.id 
        }
      });

      if (!deleted) {
        res.status(404).json({
          status: 'error',
          message: 'History item not found'
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        message: 'History item deleted successfully'
      });

    } catch (error) {
      console.error('Delete history error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      });
    }
  };

  public getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      const { months = 6 } = req.query;
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months as string));

      const history = await SymptomHistory.findAll({
        where: {
          userId: req.user.id,
          timestamp: {
            [Op.gte]: monthsAgo
          }
        },
        order: [['timestamp', 'ASC']]
      });

      const symptomFrequency: { [key: string]: number } = {};
      const diseaseFrequency: { [key: string]: number } = {};
      const monthlyData: { [key: string]: number } = {};

      history.forEach((item: any) => {
        item.processedSymptoms.forEach((symptom: string) => {
          symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
        });

        if (item.predictions && Array.isArray(item.predictions)) {
          item.predictions.forEach((prediction: any) => {
            if (prediction.disease) {
              diseaseFrequency[prediction.disease] = (diseaseFrequency[prediction.disease] || 0) + 1;
            }
          });
        }

        const monthKey = item.timestamp.toISOString().substring(0, 7); // YYYY-MM
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      });

      const topSymptoms = Object.entries(symptomFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([symptom, count]) => ({ symptom, count }));

      const topDiseases = Object.entries(diseaseFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([disease, count]) => ({ disease, count }));

      res.status(200).json({
        status: 'success',
        data: {
          totalChecks: history.length,
          topSymptoms,
          topDiseases,
          monthlyData,
          period: {
            from: monthsAgo.toISOString(),
            to: new Date().toISOString(),
            months: parseInt(months as string)
          }
        }
      });

    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      });
    }
  };
}
