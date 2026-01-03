/**
 * Attachment Model
 * 
 * This is a WEAK ENTITY (as per ER diagram).
 * Attachments can belong to:
 * - Notes (identifying relationship)
 * - Comments (identifying relationship)
 * - Groups (identifying relationship)
 * 
 * The attachment_ID is a partial key, unique within its parent entity.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define the Attachment model
const Attachment = sequelize.define('Attachment', {
  // Primary key
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Partial key: attachment_ID (weak entity identifier)
  attachment_ID: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // File name
  file_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  // File type (e.g., 'image/png', 'application/pdf', etc.)
  file_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // URL where the file is stored (could be local path or cloud storage URL)
  URL: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // Parent entity: Can be a Note, Comment, or Group
  // We use a polymorphic reference pattern
  parent_type: {
    type: DataTypes.ENUM('Note', 'Comment', 'Group'),
    allowNull: false
  },
  
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  // File size in bytes (optional but useful)
  file_size: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'attachments',
  timestamps: true,
  underscored: false,
  indexes: [
    // Compound unique index to ensure uniqueness of attachment_ID per parent
    {
      unique: true,
      fields: ['attachment_ID', 'parent_type', 'parent_id']
    }
  ]
});

module.exports = Attachment;
