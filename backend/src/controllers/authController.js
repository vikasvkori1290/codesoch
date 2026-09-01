import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Submission } from '../models/Submission.js';
import { SpacedRepetition } from '../models/SpacedRepetition.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'thinkquiz_super_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

// In-memory fallback database when MongoDB service is offline
export const memoryUsers = new Map();
export const memorySubmissions = [];

const isDbConnected = () => mongoose.connection.readyState === 1;

export const registerUser = async (req, res) => {
  const { firstName, lastName, username, email, password, mobile } = req.body;
  
  if (!firstName || !lastName || !username || !email || !password) {
    return res.status(400).json({ message: 'First name, last name, username, email, and password are required' });
  }

  try {
    if (isDbConnected()) {
      const userExists = await User.findOne({ $or: [{ email }, { username }] });
      if (userExists) {
        return res.status(400).json({ message: 'User with this email or username already exists' });
      }

      const user = await User.create({
        firstName,
        lastName,
        username,
        email,
        password,
        mobile: mobile || '',
        isProfileComplete: Boolean(firstName && lastName && mobile),
        xp: firstName && lastName && mobile ? 10 : 0,
      });

      return res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        socialUrl: user.socialUrl,
        leetcodeUrl: user.leetcodeUrl,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        token: generateToken(user._id),
      });
    }

    // In-Memory Fallback
    const existing = Array.from(memoryUsers.values()).find(
      (u) => u.email === email || u.username === username
    );
    if (existing) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const fakeId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const userObj = {
      _id: fakeId,
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      mobile: mobile || '',
      socialUrl: '',
      leetcodeUrl: '',
      xp: firstName && lastName && mobile ? 10 : 0,
      level: 1,
      streak: 1,
      isProfileComplete: Boolean(firstName && lastName && mobile),
    };

    memoryUsers.set(fakeId, userObj);

    return res.status(201).json({
      _id: userObj._id,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      username: userObj.username,
      email: userObj.email,
      mobile: userObj.mobile,
      socialUrl: userObj.socialUrl,
      leetcodeUrl: userObj.leetcodeUrl,
      xp: userObj.xp,
      level: userObj.level,
      streak: userObj.streak,
      token: generateToken(userObj._id),
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    return res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    if (isDbConnected()) {
      const user = await User.findOne({ email });
      if (user && (await user.matchPassword(password))) {
        return res.json({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          socialUrl: user.socialUrl,
          leetcodeUrl: user.leetcodeUrl,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          token: generateToken(user._id),
        });
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // In-Memory Fallback
    const userObj = Array.from(memoryUsers.values()).find((u) => u.email === email);
    if (userObj && (await bcrypt.compare(password, userObj.password))) {
      return res.json({
        _id: userObj._id,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        username: userObj.username,
        email: userObj.email,
        mobile: userObj.mobile,
        socialUrl: userObj.socialUrl,
        leetcodeUrl: userObj.leetcodeUrl,
        xp: userObj.xp,
        level: userObj.level,
        streak: userObj.streak,
        token: generateToken(userObj._id),
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({ message: error.message || 'Login failed' });
  }
};

export const getProfile = async (req, res) => {
  try {
    if (isDbConnected()) {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });

      const submissions = await Submission.find({ userId: user._id });
      const quizzesSolved = submissions.length;
      let totalScore = 0;
      submissions.forEach((s) => { totalScore += s.score || 0; });
      const avgAccuracy = quizzesSolved > 0 ? Math.round(totalScore / quizzesSolved) : 0;
      const higherXpUsers = await User.countDocuments({ xp: { $gt: user.xp } });
      const rank = higherXpUsers + 1;
      const dueSrsCount = await SpacedRepetition.countDocuments({
        userId: user._id,
        nextReviewDate: { $lte: new Date() },
      });

      return res.json({
        user,
        stats: { quizzesSolved, avgAccuracy, rank: `#${rank}`, dueSrsCount },
      });
    }

    // In-Memory Fallback
    const userObj = memoryUsers.get(String(req.user._id)) || Array.from(memoryUsers.values())[0];
    if (!userObj) return res.status(404).json({ message: 'User not found' });

    const userSubs = memorySubmissions.filter((s) => s.userId === String(userObj._id));
    const quizzesSolved = userSubs.length;
    let totalScore = 0;
    userSubs.forEach((s) => { totalScore += s.score || 0; });
    const avgAccuracy = quizzesSolved > 0 ? Math.round(totalScore / quizzesSolved) : 0;

    return res.json({
      user: {
        _id: userObj._id,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        username: userObj.username,
        email: userObj.email,
        mobile: userObj.mobile,
        socialUrl: userObj.socialUrl,
        leetcodeUrl: userObj.leetcodeUrl,
        xp: userObj.xp,
        level: userObj.level,
        streak: userObj.streak,
        isProfileComplete: userObj.isProfileComplete,
      },
      stats: { quizzesSolved, avgAccuracy, rank: '#1', dueSrsCount: 0 },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (isDbConnected()) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.username = req.body.username || user.username;
        user.mobile = req.body.mobile || user.mobile;
        user.socialUrl = req.body.socialUrl !== undefined ? req.body.socialUrl : user.socialUrl;
        user.leetcodeUrl = req.body.leetcodeUrl !== undefined ? req.body.leetcodeUrl : user.leetcodeUrl;

        if (!user.isProfileComplete && user.firstName && user.lastName && user.mobile) {
          user.isProfileComplete = true;
          user.xp += 10;
          user.level = Math.floor(user.xp / 100) + 1;
        }

        const updatedUser = await user.save();
        const submissions = await Submission.find({ userId: updatedUser._id });
        const quizzesSolved = submissions.length;
        let totalScore = 0;
        submissions.forEach((s) => { totalScore += s.score || 0; });
        const avgAccuracy = quizzesSolved > 0 ? Math.round(totalScore / quizzesSolved) : 0;
        const higherXpUsers = await User.countDocuments({ xp: { $gt: updatedUser.xp } });
        const rank = higherXpUsers + 1;
        const dueSrsCount = await SpacedRepetition.countDocuments({
          userId: updatedUser._id,
          nextReviewDate: { $lte: new Date() },
        });

        return res.json({
          user: updatedUser,
          stats: { quizzesSolved, avgAccuracy, rank: `#${rank}`, dueSrsCount },
        });
      }
    }

    // In-Memory Fallback
    const userObj = memoryUsers.get(String(req.user._id));
    if (userObj) {
      userObj.firstName = req.body.firstName || userObj.firstName;
      userObj.lastName = req.body.lastName || userObj.lastName;
      userObj.username = req.body.username || userObj.username;
      userObj.mobile = req.body.mobile || userObj.mobile;
      userObj.socialUrl = req.body.socialUrl !== undefined ? req.body.socialUrl : userObj.socialUrl;
      userObj.leetcodeUrl = req.body.leetcodeUrl !== undefined ? req.body.leetcodeUrl : userObj.leetcodeUrl;

      if (!userObj.isProfileComplete && userObj.firstName && userObj.lastName && userObj.mobile) {
        userObj.isProfileComplete = true;
        userObj.xp += 10;
        userObj.level = Math.floor(userObj.xp / 100) + 1;
      }

      return res.json({
        user: userObj,
        stats: { quizzesSolved: 0, avgAccuracy: 0, rank: '#1', dueSrsCount: 0 },
      });
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Profile update failed' });
  }
};
