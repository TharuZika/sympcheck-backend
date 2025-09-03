import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import bcrypt from 'bcryptjs';
const { User } = require('../models');

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name?: string;
        age?: number;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required'
      });
    }

    const decoded: JwtPayload = verifyToken(token);
    
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    req.user = {
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
      age: (user as any).age
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded: JwtPayload = verifyToken(token);
      const user = await User.findByPk(decoded.userId);
      
      if (user) {
        req.user = {
          id: (user as any).id,
          email: (user as any).email,
          name: (user as any).name,
          age: (user as any).age
        };
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const checkPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const verifyUserPassword = async (user: any, password: string): Promise<boolean> => {
  return bcrypt.compare(password, user.password);
};
