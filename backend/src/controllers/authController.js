import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Submission } from '../models/Submission.js';
import { SpacedRepetition } from '../models/SpacedRepetition.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'thinkquiz_super_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  const { firstName, lastName, username, email, password, mobile } = req.body;
  
  if (!firstName || !lastName || !username || !email || !password) {
    return res.status(400).json({ message: 'First name, last name, username, email, and password are required' });
  }

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
    xp: firstName && lastName && mobile ? 10 : 0, // Initial completion bonus if mobile supplied
  });

  res.status(201).json({
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
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
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
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Calculate dynamic stats from MongoDB
  const submissions = await Submission.find({ userId: user._id });
  const quizzesSolved = submissions.length;
  
  let totalScore = 0;
  submissions.forEach((s) => {
    totalScore += s.score || 0;
  });

  const avgAccuracy = quizzesSolved > 0 ? Math.round(totalScore / quizzesSolved) : 0;
  
  // Calculate user rank (1-indexed based on XP)
  const higherXpUsers = await User.countDocuments({ xp: { $gt: user.xp } });
  const rank = higherXpUsers + 1;

  // Calculate pending Spaced Repetition items
  const dueSrsCount = await SpacedRepetition.countDocuments({
    userId: user._id,
    nextReviewDate: { $lte: new Date() },
  });

  res.json({
    user,
    stats: {
      quizzesSolved,
      avgAccuracy,
      rank: `#${rank}`,
      dueSrsCount,
    },
  });
};

export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.username = req.body.username || user.username;
    user.mobile = req.body.mobile || user.mobile;
    user.socialUrl = req.body.socialUrl !== undefined ? req.body.socialUrl : user.socialUrl;
    user.leetcodeUrl = req.body.leetcodeUrl !== undefined ? req.body.leetcodeUrl : user.leetcodeUrl;

    // Gamification incentive: +10 XP bonus on profile completion
    if (!user.isProfileComplete && user.firstName && user.lastName && user.mobile) {
      user.isProfileComplete = true;
      user.xp += 10;
      user.level = Math.floor(user.xp / 100) + 1;
    }

    const updatedUser = await user.save();
    
    // Recalculate stats
    const submissions = await Submission.find({ userId: updatedUser._id });
    const quizzesSolved = submissions.length;
    let totalScore = 0;
    submissions.forEach((s) => {
      totalScore += s.score || 0;
    });
    const avgAccuracy = quizzesSolved > 0 ? Math.round(totalScore / quizzesSolved) : 0;
    const higherXpUsers = await User.countDocuments({ xp: { $gt: updatedUser.xp } });
    const rank = higherXpUsers + 1;
    const dueSrsCount = await SpacedRepetition.countDocuments({
      userId: updatedUser._id,
      nextReviewDate: { $lte: new Date() },
    });

    res.json({
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        socialUrl: updatedUser.socialUrl,
        leetcodeUrl: updatedUser.leetcodeUrl,
        xp: updatedUser.xp,
        level: updatedUser.level,
        streak: updatedUser.streak,
        isProfileComplete: updatedUser.isProfileComplete,
      },
      stats: {
        quizzesSolved,
        avgAccuracy,
        rank: `#${rank}`,
        dueSrsCount,
      },
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
