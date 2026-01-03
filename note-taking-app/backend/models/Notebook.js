/**
 * Notebook Model
 * 
 * This model represents a notebook (container for notes).
 * Notebooks can be nested (parent-child relationship).
 * A notebook can contain multiple notes.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define the Notebook model
const Notebook = sequelize.define('Notebook', {
  // Primary key
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Notebook ID: unique identifier (string format)
  notebook_ID: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  
  // Notebook name
  notebook_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  // Self-referencing: Parent notebook (for nested notebooks)
  // If null, this is a top-level notebook
  parent_notebook_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'notebooks',
      key: 'id'
    }
  },
  
  // Owner: User who created this notebook
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'notebooks',
  timestamps: true,
  underscored: false
});

// Self-referencing relationship (parent notebook)
Notebook.belongsTo(Notebook, {
  as: 'parent_notebook',
  foreignKey: 'parent_notebook_id'
});

Notebook.hasMany(Notebook, {
  as: 'child_notebooks',
  foreignKey: 'parent_notebook_id'
});

module.exports = Notebook;
