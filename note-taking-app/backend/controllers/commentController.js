/**
 * Comment Controller
 */

const { Comment, Note, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a comment on a note
 * POST /api/comments
 */
const createComment = async (req, res) => {
  try {
    const { note_id, comment_text } = req.body;
    const userId = req.userId;
    
    if (!note_id || !comment_text) {
      return res.status(400).json({ 
        message: 'note_id and comment_text are required' 
      });
    }
    
    // Verify note exists
    const note = await Note.findByPk(note_id);
    if (!note) {
      return res.status(404).json({ 
        message: 'Note not found' 
      });
    }
    
    // Generate unique comment_id
    const comment_id = `COMMENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create comment
    const comment = await Comment.create({
      comment_id,
      user_id: userId,
      note_id: note_id,
      comment_text
    });
    
    await comment.reload({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'user_name', 'first_name', 'last_name']
      }]
    });
    
    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
    
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ 
      message: 'Error creating comment',
      error: error.message 
    });
  }
};

/**
 * Get comments for a note
 * GET /api/comments?note_id=...
 */
const getComments = async (req, res) => {
  try {
    const { note_id } = req.query;
    
    let whereClause = {};
    if (note_id) {
      whereClause.note_id = note_id;
    }
    
    const comments = await Comment.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: Note, as: 'note', attributes: ['id', 'title'] }
      ],
      order: [['comment_time', 'DESC']]
    });
    
    res.json({
      message: 'Comments retrieved successfully',
      count: comments.length,
      comments
    });
    
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ 
      message: 'Error fetching comments',
      error: error.message 
    });
  }
};

/**
 * Delete a comment
 * DELETE /api/comments/:id
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    const comment = await Comment.findByPk(id);
    
    if (!comment) {
      return res.status(404).json({ 
        message: 'Comment not found' 
      });
    }
    
    // Check permission: Only owner, Editor, Lead Editor, or Admin can delete
    const canDelete = userRoles.includes('Admin') || 
                     userRoles.includes('Editor') || 
                     userRoles.includes('Lead Editor') ||
                     comment.user_id === userId;
    
    if (!canDelete) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this comment' 
      });
    }
    
    await comment.destroy();
    
    res.json({
      message: 'Comment deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ 
      message: 'Error deleting comment',
      error: error.message 
    });
  }
};

module.exports = {
  createComment,
  getComments,
  deleteComment
};
