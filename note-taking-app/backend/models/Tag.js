/**
 * Tag Model
 * 
 * This model represents a tag.
 * Tags have a many-to-many relationship with notes.
 * Multiple notes can have the same tag, and a note can have multiple tags.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define the Tag model
const Tag = sequelize.define('Tag', {
  // Primary key
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Tag ID: unique identifier (string format)
  tag_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  
  // Tag name (e.g., "Important", "Work", "Personal")
  tag_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    },
    set(value) {
      // Store in lowercase for consistency
      this.setDataValue('tag_name', value.toLowerCase().trim());
    }
  }
}, {
  tableName: 'tags',
  timestamps: true,
  underscored: false
});

module.exports = Tag;
