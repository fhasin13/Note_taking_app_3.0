/**
 * Note Model
 * 
 * This model represents a note in the system.
 * Notes are created by users and can be:
 * - Tagged with multiple tags
 * - Organized in notebooks
 * - Connected to other notes (self-referencing relationship)
 * - Have comments and attachments
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define the Note model
const Note = sequelize.define('Note', {
  // Primary key
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Note ID: unique identifier (string format)
  note_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  
  // UID: User ID of the creator (references User)
  UID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Note title
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  // Note content (can be rich text or markdown)
  content: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  
  // Type of note (e.g., 'text', 'markdown', 'todo', etc.)
  type: {
    type: DataTypes.ENUM('text', 'markdown', 'todo', 'code'),
    defaultValue: 'text'
  },
  
  // Creation time (automatically set)
  creation_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  // View type and posted time (from USER - posts - NOTE relationship)
  view_type: {
    type: DataTypes.ENUM('public', 'private', 'shared'),
    defaultValue: 'private'
  },
  
  posted_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notes',
  timestamps: true,
  underscored: false
});

module.exports = Note;
