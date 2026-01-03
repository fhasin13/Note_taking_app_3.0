/**
 * Authentication Controller
 * 
 * Handles user registration (signup) and login.
 */

const { User } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * 
 * Creates a JSON Web Token for authenticated users.
 * This token is used to verify user identity in subsequent requests.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

/**
 * User Signup (Registration)
 * 
 * Creates a new user account.
 * POST /api/auth/signup
 */
const signup = async (req, res) => {
  try {
    const { 
      user_name, 
      first_name, 
      last_name, 
      email, 
      password, 
      phone, 
      institution,
      roles 
    } = req.body;
    
    // Validate required fields
    if (!user_name || !first_name || !last_name || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: user_name, first_name, last_name, email, password' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: {
        [Op.or]: [{ email: email.toLowerCase() }, { user_name }]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Generate unique user_id
    const user_id = `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new user
    const user = await User.create({
      user_id,
      user_name,
      first_name,
      last_name,
      email: email.toLowerCase(),
      password, // Will be hashed automatically by beforeCreate hook
      phone: phone ? (Array.isArray(phone) ? phone : [phone]) : [],
      institution: institution || '',
      roles: roles && Array.isArray(roles) ? roles : ['Contributor']
    });
    
    // Generate token for the new user
    const token = generateToken(user.id);
    
    // Return user info (without password) and token
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        institution: user.institution,
        roles: user.roles
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Error creating user account',
      error: error.message 
    });
  }
};

/**
 * User Login
 * 
 * Authenticates user and returns JWT token.
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide email and password' 
      });
    }
    
    // Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }
    
    // Compare provided password with stored hash
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Return user info and token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        institution: user.institution,
        roles: user.roles
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error during login',
      error: error.message 
    });
  }
};

/**
 * Get Current User
 * 
 * Returns information about the currently authenticated user.
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by authenticate middleware
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    res.json({ user });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      message: 'Error fetching user information',
      error: error.message 
    });
  }
};

module.exports = {
  signup,
  login,
  getCurrentUser
};
