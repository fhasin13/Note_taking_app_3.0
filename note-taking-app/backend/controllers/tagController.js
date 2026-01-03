/**
 * Tag Controller
 */

const { Tag, Note } = require('../models');

/**
 * Create a new tag
 * POST /api/tags
 */
const createTag = async (req, res) => {
  try {
    const { tag_name } = req.body;
    
    if (!tag_name) {
      return res.status(400).json({ 
        message: 'tag_name is required' 
      });
    }
    
    // Check if tag already exists
    const existingTag = await Tag.findOne({ 
      where: { tag_name: tag_name.toLowerCase().trim() }
    });
    
    if (existingTag) {
      return res.status(400).json({ 
        message: 'Tag already exists' 
      });
    }
    
    // Generate unique tag_id
    const tag_id = `TAG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const tag = await Tag.create({
      tag_id,
      tag_name: tag_name.toLowerCase().trim()
    });
    
    res.status(201).json({
      message: 'Tag created successfully',
      tag
    });
    
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ 
      message: 'Error creating tag',
      error: error.message 
    });
  }
};

/**
 * Get all tags
 * GET /api/tags
 */
const getTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      include: [{
        model: Note,
        as: 'notes',
        attributes: ['id', 'title', 'note_id']
      }],
      order: [['tag_name', 'ASC']]
    });
    
    res.json({
      message: 'Tags retrieved successfully',
      count: tags.length,
      tags
    });
    
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ 
      message: 'Error fetching tags',
      error: error.message 
    });
  }
};

/**
 * Delete a tag
 * DELETE /api/tags/:id
 */
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tag = await Tag.findByPk(id);
    
    if (!tag) {
      return res.status(404).json({ 
        message: 'Tag not found' 
      });
    }
    
    // Remove tag from all notes (many-to-many relationship)
    const notes = await tag.getNotes();
    if (notes.length > 0) {
      await tag.removeNotes(notes);
    }
    
    await tag.destroy();
    
    res.json({
      message: 'Tag deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ 
      message: 'Error deleting tag',
      error: error.message 
    });
  }
};

module.exports = {
  createTag,
  getTags,
  deleteTag
};
