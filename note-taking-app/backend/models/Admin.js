/**
 * Admin Model
 * 
 * This model represents an admin user.
 * Based on the ER diagram, Admin is a separate entity with its own attributes.
 * However, in our implementation, we'll use the User model with Admin role.
 * This file is kept for reference but Admin functionality is handled through User roles.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// If you want a separate Admin model, you can use this:
const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  admin_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  admin_name_first: {
    type: DataTypes.STRING,
    allowNull: true
  },
  admin_name_last: {
    type: DataTypes.STRING,
    allowNull: true
  },
  admin_phone: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  admin_email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  // Reference to User
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'admins',
  timestamps: true,
  underscored: false
});

module.exports = Admin;
