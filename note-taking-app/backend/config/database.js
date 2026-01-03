/**
 * Database Configuration
 * 
 * This file sets up the Sequelize connection to MySQL database.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'note_taking_app',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database successfully');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };


