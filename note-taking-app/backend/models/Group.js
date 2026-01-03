/**
 * Group Model
 * 
 * This is a WEAK ENTITY (as per ER diagram).
 * Groups are formed by Lead Editors and can have:
 * - Multiple members (users)
 * - Access to notebooks
 * - Attachments
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define the Group model
const Group = sequelize.define('Group', {
  // Primary key
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Partial key: group_id (weak entity identifier)
  group_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // Group name
  group_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  // Lead Editor who formed this group (identifying relationship)
  lead_editor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'groups',
  timestamps: true,
  underscored: false,
  indexes: [
    // Compound unique index to ensure uniqueness of group_id per lead_editor
    {
      unique: true,
      fields: ['group_id', 'lead_editor_id']
    }
  ]
});

module.exports = Group;
