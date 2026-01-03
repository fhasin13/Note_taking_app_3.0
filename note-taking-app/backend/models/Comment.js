/**
 * Comment Model
 * 
 * This is a WEAK ENTITY (as per ER diagram).
 * A comment depends on both a User (who wrote it) and a Note (where it's posted).
 * Comments can also have attachments.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define the Comment model
const Comment = sequelize.define('Comment', {
  // Primary key
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Partial key: comment_id (weak entity identifier)
  comment_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // User who wrote the comment (identifying relationship)
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Note this comment belongs to (identifying relationship)
  note_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'notes',
      key: 'id'
    }
  },
  
  // Comment text content
  comment_text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  // Time when comment was posted
  comment_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'comments',
  timestamps: true,
  underscored: false,
  indexes: [
    // Compound unique index to ensure uniqueness of comment_id per note
    {
      unique: true,
      fields: ['comment_id', 'note_id']
    }
  ]
});

module.exports = Comment;
