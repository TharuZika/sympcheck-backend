import { Request, Response } from 'express';
const { User } = require('../models');
import { generateToken } from '../utils/jwt';
import { verifyUserPassword, hashPassword } from '../middlewares/auth';

export class AuthController {
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, age, birthday, weight, height } = req.body;

      if (!email || !password) {
        res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
        return;
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(409).json({
          status: 'error',
          message: 'User with this email already exists'
        });
        return;
      }

      let bmi = null;
      if (weight && height) {
        const weightKg = parseFloat(weight);
        const heightM = parseFloat(height) / 100; // cm to m
        bmi = weightKg / (heightM * heightM);
      }

      let calculatedAge = age ? parseInt(age) : undefined;
      if (birthday && !age) {
        const birthDate = new Date(birthday);
        const today = new Date();
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
      }

      const hashedPassword = await hashPassword(password);

      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        age: calculatedAge,
        birthday: birthday || null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        bmi: bmi ? parseFloat(bmi.toFixed(2)) : null
      });

      const token = generateToken({
        userId: user.id,
        email: user.email
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            age: user.age,
            birthday: user.birthday,
            weight: user.weight,
            height: user.height,
            bmi: user.bmi
          },
          token
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
        return;
      }

      const isPasswordValid = await verifyUserPassword(user, password);
      if (!isPasswordValid) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email
      });

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            age: user.age,
            birthday: user.birthday,
            weight: user.weight,
            height: user.height,
            bmi: user.bmi
          },
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      });
    }
  };

  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            age: user.age,
            birthday: user.birthday,
            weight: user.weight,
            height: user.height,
            bmi: user.bmi,
            createdAt: user.createdAt
          }
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      });
    }
  };

  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      const { name, age, birthday, weight, height } = req.body;
      
      const user = await User.findByPk(req.user.id);
      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      let bmi = user.bmi;
      const newWeight = weight !== undefined ? parseFloat(weight) : user.weight;
      const newHeight = height !== undefined ? parseFloat(height) : user.height;
      
      if (newWeight && newHeight) {
        const weightKg = newWeight;
        const heightM = newHeight / 100; // cm to m
        bmi = weightKg / (heightM * heightM);
      }

      let calculatedAge = age !== undefined ? parseInt(age) : user.age;
      if (birthday && !age) {
        const birthDate = new Date(birthday);
        const today = new Date();
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
      }

      await user.update({
        name: name !== undefined ? name : user.name,
        age: calculatedAge,
        birthday: birthday !== undefined ? birthday : user.birthday,
        weight: newWeight,
        height: newHeight,
        bmi: bmi ? parseFloat(bmi.toFixed(2)) : null
      });

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            age: user.age,
            birthday: user.birthday,
            weight: user.weight,
            height: user.height,
            bmi: user.bmi
          }
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      });
    }
  };
}
