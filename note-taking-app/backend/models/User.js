/**
 * User Model
 * 
 * This model represents a user in the system.
 * Based on the ER diagram, a user can have multiple roles:
 * - Admin: Full access to everything
 * - Lead Editor: Can manage groups and notebooks
 * - Editor: Can create and edit notes
 * - Contributor: Can only add notes and comments
 * 
 * A user can have multiple roles (overlapping specialization from ER diagram).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// Define the User model
const User = sequelize.define('User', {
  // Primary key: unique identifier for each user
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // User ID: unique identifier (string format)
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  
  // Username for login
  user_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 255]
    }
  },
  
  // Composite attribute: name (first_name + last_name)
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // Contact information (composite attribute from ER diagram)
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  
  // Phone can be multivalued (stored as JSON)
  phone: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  
  // Additional field for institution
  institution: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Password (hashed, never stored in plain text)
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  
  // Roles: User can have multiple roles (stored as JSON array)
  roles: {
    type: DataTypes.JSON,
    defaultValue: ['Contributor'],
    validate: {
      isValidRoles(value) {
        const validRoles = ['Admin', 'Lead Editor', 'Editor', 'Contributor'];
        if (!Array.isArray(value)) {
          throw new Error('Roles must be an array');
        }
        value.forEach(role => {
          if (!validRoles.includes(role)) {
            throw new Error(`Invalid role: ${role}`);
          }
        });
      }
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: false,
  hooks: {
    // Before saving user, hash the password
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance method to compare password during login
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user's full name
User.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

module.exports = User;
