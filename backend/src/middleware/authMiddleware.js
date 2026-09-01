import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { memoryUsers } from '../controllers/authController.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'thinkquiz_super_secret_jwt_key_2026');
      
      if (mongoose.connection.readyState === 1) {
        req.user = await User.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        req.user = memoryUsers.get(String(decoded.id)) || { _id: decoded.id };
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};
