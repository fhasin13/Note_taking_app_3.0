/**
 * Notebook Controller
 * 
 * Handles all operations related to notebooks.
 */

const { Notebook, Note, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a new notebook
 * POST /api/notebooks
 */
const createNotebook = async (req, res) => {
  try {
    const { notebook_name, parent_notebook_id } = req.body;
    const userId = req.userId;
    
    if (!notebook_name) {
      return res.status(400).json({ 
        message: 'Notebook name is required' 
      });
    }
    
    // Generate unique notebook_ID
    const notebook_ID = `NOTEBOOK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create notebook
    const notebook = await Notebook.create({
      notebook_ID,
      notebook_name,
      owner_id: userId,
      parent_notebook_id: parent_notebook_id || null
    });
    
    await notebook.reload({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: Notebook, as: 'parent_notebook', attributes: ['id', 'notebook_name', 'notebook_ID'] }
      ]
    });
    
    res.status(201).json({
      message: 'Notebook created successfully',
      notebook
    });
    
  } catch (error) {
    console.error('Create notebook error:', error);
    res.status(500).json({ 
      message: 'Error creating notebook',
      error: error.message 
    });
  }
};

/**
 * Get all notebooks
 * GET /api/notebooks
 */
const getNotebooks = async (req, res) => {
  try {
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    let whereClause = {};
    
    // If not admin, only show user's notebooks or accessible notebooks
    if (!userRoles.includes('Admin')) {
      whereClause[Op.or] = [
        { owner_id: userId }
        // Accessible notebooks through groups will be filtered in the query
      ];
    }
    
    const notebooks = await Notebook.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: Notebook, as: 'parent_notebook', attributes: ['id', 'notebook_name', 'notebook_ID'] },
        { model: Note, as: 'notes', attributes: ['id', 'title', 'note_id'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      message: 'Notebooks retrieved successfully',
      count: notebooks.length,
      notebooks
    });
    
  } catch (error) {
    console.error('Get notebooks error:', error);
    res.status(500).json({ 
      message: 'Error fetching notebooks',
      error: error.message 
    });
  }
};

/**
 * Get single notebook by ID
 * GET /api/notebooks/:id
 */
const getNotebookById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notebook = await Notebook.findByPk(id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: Notebook, as: 'parent_notebook', attributes: ['id', 'notebook_name', 'notebook_ID'] },
        {
          model: Note,
          as: 'notes',
          include: [
            { model: User, as: 'creator', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
            { model: Tag, as: 'tags', attributes: ['id', 'tag_name'] }
          ]
        }
      ]
    });
    
    if (!notebook) {
      return res.status(404).json({ 
        message: 'Notebook not found' 
      });
    }
    
    res.json({
      message: 'Notebook retrieved successfully',
      notebook
    });
    
  } catch (error) {
    console.error('Get notebook error:', error);
    res.status(500).json({ 
      message: 'Error fetching notebook',
      error: error.message 
    });
  }
};

/**
 * Update notebook
 * PUT /api/notebooks/:id
 */
const updateNotebook = async (req, res) => {
  try {
    const { id } = req.params;
    const { notebook_name, parent_notebook_id } = req.body;
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    const notebook = await Notebook.findByPk(id);
    
    if (!notebook) {
      return res.status(404).json({ 
        message: 'Notebook not found' 
      });
    }
    
    // Check permission
    const canEdit = userRoles.includes('Admin') || 
                    userRoles.includes('Lead Editor') ||
                    notebook.owner_id === userId;
    
    if (!canEdit) {
      return res.status(403).json({ 
        message: 'You do not have permission to edit this notebook' 
      });
    }
    
    if (notebook_name !== undefined) notebook.notebook_name = notebook_name;
    if (parent_notebook_id !== undefined) notebook.parent_notebook_id = parent_notebook_id;
    
    await notebook.save();
    
    await notebook.reload({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: Notebook, as: 'parent_notebook', attributes: ['id', 'notebook_name', 'notebook_ID'] }
      ]
    });
    
    res.json({
      message: 'Notebook updated successfully',
      notebook
    });
    
  } catch (error) {
    console.error('Update notebook error:', error);
    res.status(500).json({ 
      message: 'Error updating notebook',
      error: error.message 
    });
  }
};

/**
 * Delete notebook
 * DELETE /api/notebooks/:id
 */
const deleteNotebook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    const notebook = await Notebook.findByPk(id);
    
    if (!notebook) {
      return res.status(404).json({ 
        message: 'Notebook not found' 
      });
    }
    
    // Check permission
    const canDelete = userRoles.includes('Admin') || 
                     userRoles.includes('Lead Editor') ||
                     notebook.owner_id === userId;
    
    if (!canDelete) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this notebook' 
      });
    }
    
    // Remove notebook reference from notes (many-to-many relationship)
    const notes = await notebook.getNotes();
    if (notes.length > 0) {
      await notebook.removeNotes(notes);
    }
    
    await notebook.destroy();
    
    res.json({
      message: 'Notebook deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete notebook error:', error);
    res.status(500).json({ 
      message: 'Error deleting notebook',
      error: error.message 
    });
  }
};

/**
 * Add note to notebook
 * POST /api/notebooks/:id/notes
 */
const addNoteToNotebook = async (req, res) => {
  try {
    const { id } = req.params; // notebook id
    const { note_id } = req.body;
    
    if (!note_id) {
      return res.status(400).json({ 
        message: 'note_id is required' 
      });
    }
    
    const notebook = await Notebook.findByPk(id);
    const note = await Note.findByPk(note_id);
    
    if (!notebook || !note) {
      return res.status(404).json({ 
        message: 'Notebook or note not found' 
      });
    }
    
    // Add note to notebook (many-to-many relationship)
    await notebook.addNote(note);
    
    await notebook.reload({
      include: [{ model: Note, as: 'notes' }]
    });
    
    res.json({
      message: 'Note added to notebook successfully',
      notebook
    });
    
  } catch (error) {
    console.error('Add note to notebook error:', error);
    res.status(500).json({ 
      message: 'Error adding note to notebook',
      error: error.message 
    });
  }
};

module.exports = {
  createNotebook,
  getNotebooks,
  getNotebookById,
  updateNotebook,
  deleteNotebook,
  addNoteToNotebook
};
