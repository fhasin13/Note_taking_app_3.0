/**
 * Attachment Controller
 */

const { Attachment, Note, Comment, Group } = require('../models');
const { Op } = require('sequelize');

/**
 * Create an attachment
 * POST /api/attachments
 */
const createAttachment = async (req, res) => {
  try {
    const { parent_type, parent_id, file_name, file_type, URL, file_size } = req.body;
    
    if (!parent_type || !parent_id || !file_name || !file_type || !URL) {
      return res.status(400).json({ 
        message: 'parent_type, parent_id, file_name, file_type, and URL are required' 
      });
    }
    
    // Verify parent exists
    let parent;
    if (parent_type === 'Note') {
      parent = await Note.findByPk(parent_id);
    } else if (parent_type === 'Comment') {
      parent = await Comment.findByPk(parent_id);
    } else if (parent_type === 'Group') {
      parent = await Group.findByPk(parent_id);
    }
    
    if (!parent) {
      return res.status(404).json({ 
        message: `${parent_type} not found` 
      });
    }
    
    // Generate unique attachment_ID
    const attachment_ID = `ATTACH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const attachment = await Attachment.create({
      attachment_ID,
      parent_type,
      parent_id,
      file_name,
      file_type,
      URL,
      file_size: file_size || 0
    });
    
    res.status(201).json({
      message: 'Attachment created successfully',
      attachment
    });
    
  } catch (error) {
    console.error('Create attachment error:', error);
    res.status(500).json({ 
      message: 'Error creating attachment',
      error: error.message 
    });
  }
};

/**
 * Get attachments
 * GET /api/attachments?parent_type=...&parent_id=...
 */
const getAttachments = async (req, res) => {
  try {
    const { parent_type, parent_id } = req.query;
    
    let whereClause = {};
    if (parent_type) whereClause.parent_type = parent_type;
    if (parent_id) whereClause.parent_id = parent_id;
    
    const attachments = await Attachment.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      message: 'Attachments retrieved successfully',
      count: attachments.length,
      attachments
    });
    
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ 
      message: 'Error fetching attachments',
      error: error.message 
    });
  }
};

/**
 * Delete an attachment
 * DELETE /api/attachments/:id
 */
const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachment = await Attachment.findByPk(id);
    
    if (!attachment) {
      return res.status(404).json({ 
        message: 'Attachment not found' 
      });
    }
    
    await attachment.destroy();
    
    res.json({
      message: 'Attachment deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ 
      message: 'Error deleting attachment',
      error: error.message 
    });
  }
};

module.exports = {
  createAttachment,
  getAttachments,
  deleteAttachment
};
