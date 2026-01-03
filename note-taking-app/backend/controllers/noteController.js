/**
 * Note Controller
 * 
 * Handles all operations related to notes:
 * - Create, read, update, delete notes
 * - Add tags, attachments, comments
 * - Connect notes to notebooks
 */

const { Note, Tag, Notebook, Comment, Attachment, User } = require('../models');
const { Op } = require('sequelize');
const { authorize } = require('../middleware/auth');

/**
 * Create a new note
 * POST /api/notes
 * 
 * Access: Editor, Contributor, Lead Editor, Admin
 */
const createNote = async (req, res) => {
  try {
    const { title, content, type, tags, notebook_ids, connected_note_ids } = req.body;
    const userId = req.userId;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ 
        message: 'Note title is required' 
      });
    }
    
    // Generate unique note_id
    const note_id = `NOTE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new note
    const note = await Note.create({
      note_id,
      UID: userId,
      title,
      content: content || '',
      type: type || 'text'
    });
    
    // Add tags if provided
    if (tags && tags.length > 0) {
      await note.setTags(tags);
    }
    
    // Add notebooks if provided
    if (notebook_ids && notebook_ids.length > 0) {
      await note.setNotebooks(notebook_ids);
    }
    
    // Add connected notes if provided
    if (connected_note_ids && connected_note_ids.length > 0) {
      const connectedNotes = await Note.findAll({ where: { id: { [Op.in]: connected_note_ids } } });
      await note.setConnected_notes(connectedNotes);
    }
    
    // Reload with associations
    await note.reload({
      include: [
        { model: Tag, as: 'tags' },
        { model: Notebook, as: 'notebooks' },
        { model: User, as: 'creator', attributes: ['id', 'user_name', 'first_name', 'last_name'] }
      ]
    });
    
    res.status(201).json({
      message: 'Note created successfully',
      note
    });
    
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ 
      message: 'Error creating note',
      error: error.message 
    });
  }
};

/**
 * Get all notes (with filters)
 * GET /api/notes
 * 
 * Query parameters:
 * - notebook_id: Filter by notebook
 * - tag_id: Filter by tag
 * - user_id: Filter by creator
 */
const getNotes = async (req, res) => {
  try {
    const { notebook_id, tag_id, user_id } = req.query;
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    // Build query
    let whereClause = {};
    
    // If not admin, only show user's own notes or shared notes
    if (!userRoles.includes('Admin')) {
      whereClause[Op.or] = [
        { UID: userId },
        { view_type: 'public' },
        { view_type: 'shared' }
      ];
    }
    
    // Apply filters
    if (user_id && userRoles.includes('Admin')) {
      whereClause.UID = user_id;
    }
    
    // Build include conditions
    const includeConditions = [
      { model: User, as: 'creator', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
      { model: Tag, as: 'tags', attributes: ['id', 'tag_name'] },
      { model: Notebook, as: 'notebooks', attributes: ['id', 'notebook_name'] }
    ];
    
    // Apply notebook filter
    if (notebook_id) {
      includeConditions.push({
        model: Notebook,
        as: 'notebooks',
        where: { id: notebook_id },
        attributes: ['id', 'notebook_name'],
        required: true
      });
    }
    
    // Apply tag filter
    if (tag_id) {
      includeConditions.push({
        model: Tag,
        as: 'tags',
        where: { id: tag_id },
        attributes: ['id', 'tag_name'],
        required: true
      });
    }
    
    // Find notes
    const notes = await Note.findAll({
      where: whereClause,
      include: includeConditions,
      order: [['creation_time', 'DESC']]
    });
    
    res.json({
      message: 'Notes retrieved successfully',
      count: notes.length,
      notes
    });
    
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ 
      message: 'Error fetching notes',
      error: error.message 
    });
  }
};

/**
 * Get a single note by ID
 * GET /api/notes/:id
 */
const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    // Find note
    const note = await Note.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'tag_name'] },
        { model: Notebook, as: 'notebooks', attributes: ['id', 'notebook_name'] },
        {
          model: Note,
          as: 'connected_notes',
          attributes: ['id', 'title', 'note_id']
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'user_name', 'first_name', 'last_name']
          }]
        },
        {
          model: Attachment,
          as: 'attachments',
          required: false
        }
      ]
    });
    
    if (!note) {
      return res.status(404).json({ 
        message: 'Note not found' 
      });
    }
    
    // Check access permission
    if (!userRoles.includes('Admin') && 
        note.UID !== userId && 
        note.view_type === 'private') {
      return res.status(403).json({ 
        message: 'Access denied to this note' 
      });
    }
    
    res.json({
      message: 'Note retrieved successfully',
      note
    });
    
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ 
      message: 'Error fetching note',
      error: error.message 
    });
  }
};

/**
 * Update a note
 * PUT /api/notes/:id
 * 
 * Access: Editor, Lead Editor, Admin (or note owner)
 */
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    const { title, content, type, tags, notebook_ids, view_type } = req.body;
    
    // Find note
    const note = await Note.findByPk(id);
    
    if (!note) {
      return res.status(404).json({ 
        message: 'Note not found' 
      });
    }
    
    // Check permission: Only owner, Editor, Lead Editor, or Admin can edit
    const canEdit = userRoles.includes('Admin') || 
                    userRoles.includes('Editor') || 
                    userRoles.includes('Lead Editor') ||
                    note.UID === userId;
    
    if (!canEdit) {
      return res.status(403).json({ 
        message: 'You do not have permission to edit this note' 
      });
    }
    
    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (type !== undefined) note.type = type;
    if (view_type !== undefined) note.view_type = view_type;
    
    await note.save();
    
    // Update associations
    if (tags !== undefined) {
      await note.setTags(tags);
    }
    if (notebook_ids !== undefined) {
      await note.setNotebooks(notebook_ids);
    }
    
    // Reload with associations
    await note.reload({
      include: [
        { model: Tag, as: 'tags' },
        { model: Notebook, as: 'notebooks' },
        { model: User, as: 'creator', attributes: ['id', 'user_name', 'first_name', 'last_name'] }
      ]
    });
    
    res.json({
      message: 'Note updated successfully',
      note
    });
    
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ 
      message: 'Error updating note',
      error: error.message 
    });
  }
};

/**
 * Delete a note
 * DELETE /api/notes/:id
 * 
 * Access: Editor, Lead Editor, Admin (or note owner)
 */
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    // Find note
    const note = await Note.findByPk(id);
    
    if (!note) {
      return res.status(404).json({ 
        message: 'Note not found' 
      });
    }
    
    // Check permission
    const canDelete = userRoles.includes('Admin') || 
                     userRoles.includes('Editor') || 
                     userRoles.includes('Lead Editor') ||
                     note.UID === userId;
    
    if (!canDelete) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this note' 
      });
    }
    
    // Delete associated comments and attachments
    await Comment.destroy({ where: { note_id: id } });
    await Attachment.destroy({ where: { parent_type: 'Note', parent_id: id } });
    
    // Delete note
    await note.destroy();
    
    res.json({
      message: 'Note deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ 
      message: 'Error deleting note',
      error: error.message 
    });
  }
};

/**
 * Add tag to note
 * POST /api/notes/:id/tags
 */
const addTagToNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;
    
    if (!tag_id) {
      return res.status(400).json({ 
        message: 'tag_id is required' 
      });
    }
    
    // Find note and tag
    const note = await Note.findByPk(id);
    const tag = await Tag.findByPk(tag_id);
    
    if (!note || !tag) {
      return res.status(404).json({ 
        message: 'Note or tag not found' 
      });
    }
    
    // Add tag to note (Sequelize handles the many-to-many relationship)
    await note.addTag(tag);
    
    // Reload with associations
    await note.reload({
      include: [{ model: Tag, as: 'tags' }]
    });
    
    res.json({
      message: 'Tag added to note successfully',
      note
    });
    
  } catch (error) {
    console.error('Add tag error:', error);
    res.status(500).json({ 
      message: 'Error adding tag',
      error: error.message 
    });
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  addTagToNote
};
