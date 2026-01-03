/**
 * Group Controller
 * 
 * Handles group management operations.
 * Groups can only be created by Lead Editors.
 */

const { Group, User, Notebook } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a new group
 * POST /api/groups
 * 
 * Access: Lead Editor, Admin
 */
const createGroup = async (req, res) => {
  try {
    const { group_name, member_ids, notebook_ids } = req.body;
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    // Check permission: Only Lead Editor or Admin can create groups
    if (!userRoles.includes('Lead Editor') && !userRoles.includes('Admin')) {
      return res.status(403).json({ 
        message: 'Only Lead Editors and Admins can create groups' 
      });
    }
    
    if (!group_name) {
      return res.status(400).json({ 
        message: 'group_name is required' 
      });
    }
    
    // Generate unique group_id
    const group_id = `GROUP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create group
    const group = await Group.create({
      group_id,
      group_name,
      lead_editor_id: userId
    });
    
    // Add members if provided
    if (member_ids && member_ids.length > 0) {
      const members = await User.findAll({ where: { id: { [Op.in]: member_ids } } });
      await group.setMembers(members);
    }
    
    // Add accessible notebooks if provided
    if (notebook_ids && notebook_ids.length > 0) {
      const notebooks = await Notebook.findAll({ where: { id: { [Op.in]: notebook_ids } } });
      await group.setAccessible_notebooks(notebooks);
    }
    
    await group.reload({
      include: [
        { model: User, as: 'lead_editor', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: User, as: 'members', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: Notebook, as: 'accessible_notebooks', attributes: ['id', 'notebook_name', 'notebook_ID'] }
      ]
    });
    
    res.status(201).json({
      message: 'Group created successfully',
      group
    });
    
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ 
      message: 'Error creating group',
      error: error.message 
    });
  }
};

/**
 * Get all groups
 * GET /api/groups
 */
const getGroups = async (req, res) => {
  try {
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    let whereClause = {};
    
    // If not admin or lead editor, only show groups user is a member of
    if (!userRoles.includes('Admin') && !userRoles.includes('Lead Editor')) {
      // This will be filtered by checking group membership
      // For simplicity, we'll fetch all and filter in memory
      // In production, use a more efficient query
    }
    
    const groups = await Group.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'lead_editor', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: User, as: 'members', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: Notebook, as: 'accessible_notebooks', attributes: ['id', 'notebook_name', 'notebook_ID'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Filter groups if user is not admin/lead editor
    let filteredGroups = groups;
    if (!userRoles.includes('Admin') && !userRoles.includes('Lead Editor')) {
      filteredGroups = groups.filter(group => {
        const isMember = group.members.some(member => member.id === userId);
        const isLeadEditor = group.lead_editor_id === userId;
        return isMember || isLeadEditor;
      });
    }
    
    res.json({
      message: 'Groups retrieved successfully',
      count: filteredGroups.length,
      groups: filteredGroups
    });
    
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ 
      message: 'Error fetching groups',
      error: error.message 
    });
  }
};

/**
 * Get single group by ID
 * GET /api/groups/:id
 */
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const group = await Group.findByPk(id, {
      include: [
        { model: User, as: 'lead_editor', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: User, as: 'members', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: Notebook, as: 'accessible_notebooks', attributes: ['id', 'notebook_name', 'notebook_ID'] },
        {
          model: Attachment,
          as: 'attachments',
          where: { parent_type: 'Group', parent_id: id },
          required: false
        }
      ]
    });
    
    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found' 
      });
    }
    
    res.json({
      message: 'Group retrieved successfully',
      group
    });
    
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ 
      message: 'Error fetching group',
      error: error.message 
    });
  }
};

/**
 * Update group
 * PUT /api/groups/:id
 * 
 * Access: Lead Editor (who created it), Admin
 */
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { group_name, member_ids, notebook_ids } = req.body;
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    const group = await Group.findByPk(id);
    
    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found' 
      });
    }
    
    // Check permission
    const canEdit = userRoles.includes('Admin') || 
                    (userRoles.includes('Lead Editor') && 
                     group.lead_editor_id === userId);
    
    if (!canEdit) {
      return res.status(403).json({ 
        message: 'You do not have permission to edit this group' 
      });
    }
    
    // Update fields
    if (group_name !== undefined) group.group_name = group_name;
    
    await group.save();
    
    // Update members if provided
    if (member_ids !== undefined) {
      const members = await User.findAll({ where: { id: { [Op.in]: member_ids } } });
      await group.setMembers(members);
    }
    
    // Update accessible notebooks if provided
    if (notebook_ids !== undefined) {
      const notebooks = await Notebook.findAll({ where: { id: { [Op.in]: notebook_ids } } });
      await group.setAccessible_notebooks(notebooks);
    }
    
    await group.reload({
      include: [
        { model: User, as: 'lead_editor', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: User, as: 'members', attributes: ['id', 'user_name', 'first_name', 'last_name'] },
        { model: Notebook, as: 'accessible_notebooks', attributes: ['id', 'notebook_name', 'notebook_ID'] }
      ]
    });
    
    res.json({
      message: 'Group updated successfully',
      group
    });
    
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ 
      message: 'Error updating group',
      error: error.message 
    });
  }
};

/**
 * Delete group
 * DELETE /api/groups/:id
 * 
 * Access: Lead Editor (who created it), Admin
 */
const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    
    const group = await Group.findByPk(id);
    
    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found' 
      });
    }
    
    // Check permission
    const canDelete = userRoles.includes('Admin') || 
                     (userRoles.includes('Lead Editor') && 
                      group.lead_editor_id === userId);
    
    if (!canDelete) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this group' 
      });
    }
    
    // Delete associated attachments
    await Attachment.destroy({ where: { parent_type: 'Group', parent_id: id } });
    
    await group.destroy();
    
    res.json({
      message: 'Group deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ 
      message: 'Error deleting group',
      error: error.message 
    });
  }
};

/**
 * Add member to group
 * POST /api/groups/:id/members
 */
const addMemberToGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ 
        message: 'user_id is required' 
      });
    }
    
    const group = await Group.findByPk(id);
    const user = await User.findByPk(user_id);
    
    if (!group || !user) {
      return res.status(404).json({ 
        message: 'Group or user not found' 
      });
    }
    
    // Check permission
    const userId = req.userId;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : 
                     (req.user.roles ? JSON.parse(req.user.roles) : []);
    const canEdit = userRoles.includes('Admin') || 
                    (userRoles.includes('Lead Editor') && 
                     group.lead_editor_id === userId);
    
    if (!canEdit) {
      return res.status(403).json({ 
        message: 'You do not have permission to modify this group' 
      });
    }
    
    // Add member (many-to-many relationship)
    await group.addMembers([user]);
    
    await group.reload({
      include: [{ model: User, as: 'members' }]
    });
    
    res.json({
      message: 'Member added to group successfully',
      group
    });
    
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ 
      message: 'Error adding member',
      error: error.message 
    });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMemberToGroup
};
