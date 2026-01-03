/**
 * Models Index
 * 
 * This file sets up all model relationships and exports all models.
 * It ensures proper foreign key relationships and many-to-many associations.
 */

const User = require('./User');
const Note = require('./Note');
const Notebook = require('./Notebook');
const Tag = require('./Tag');
const Comment = require('./Comment');
const Attachment = require('./Attachment');
const Group = require('./Group');
const Admin = require('./Admin');

// User relationships
User.hasMany(Note, { foreignKey: 'UID', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'UID', as: 'creator' });

User.hasMany(Notebook, { foreignKey: 'owner_id', as: 'notebooks' });
Notebook.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Group, { foreignKey: 'lead_editor_id', as: 'led_groups' });
Group.belongsTo(User, { foreignKey: 'lead_editor_id', as: 'lead_editor' });

// Note relationships
Note.hasMany(Comment, { foreignKey: 'note_id', as: 'comments' });
Comment.belongsTo(Note, { foreignKey: 'note_id', as: 'note' });

// Self-referencing: Notes can be connected to other notes
Note.belongsToMany(Note, {
  through: 'note_connections',
  as: 'connected_notes',
  foreignKey: 'note_id',
  otherKey: 'connected_note_id'
});

// Many-to-many: Notes and Tags
Note.belongsToMany(Tag, {
  through: 'note_tags',
  as: 'tags',
  foreignKey: 'note_id',
  otherKey: 'tag_id'
});

Tag.belongsToMany(Note, {
  through: 'note_tags',
  as: 'notes',
  foreignKey: 'tag_id',
  otherKey: 'note_id'
});

// Many-to-many: Notes and Notebooks
Note.belongsToMany(Notebook, {
  through: 'notebook_notes',
  as: 'notebooks',
  foreignKey: 'note_id',
  otherKey: 'notebook_id'
});

Notebook.belongsToMany(Note, {
  through: 'notebook_notes',
  as: 'notes',
  foreignKey: 'notebook_id',
  otherKey: 'note_id'
});

// Many-to-many: Groups and Users (members)
Group.belongsToMany(User, {
  through: 'group_members',
  as: 'members',
  foreignKey: 'group_id',
  otherKey: 'user_id'
});

User.belongsToMany(Group, {
  through: 'group_members',
  as: 'groups',
  foreignKey: 'user_id',
  otherKey: 'group_id'
});

// Many-to-many: Groups and Notebooks (accessible notebooks)
Group.belongsToMany(Notebook, {
  through: 'group_notebooks',
  as: 'accessible_notebooks',
  foreignKey: 'group_id',
  otherKey: 'notebook_id'
});

Notebook.belongsToMany(Group, {
  through: 'group_notebooks',
  as: 'accessible_groups',
  foreignKey: 'notebook_id',
  otherKey: 'group_id'
});

// Attachment relationships (polymorphic - handled via parent_type and parent_id)
// Note: Sequelize doesn't natively support polymorphic associations, so we define separate relationships
Note.hasMany(Attachment, {
  foreignKey: 'parent_id',
  constraints: false,
  scope: { parent_type: 'Note' },
  as: 'attachments'
});

Comment.hasMany(Attachment, {
  foreignKey: 'parent_id',
  constraints: false,
  scope: { parent_type: 'Comment' },
  as: 'attachments'
});

Group.hasMany(Attachment, {
  foreignKey: 'parent_id',
  constraints: false,
  scope: { parent_type: 'Group' },
  as: 'attachments'
});

// Admin relationship
Admin.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Admin, { foreignKey: 'user_id', as: 'admin' });

module.exports = {
  User,
  Note,
  Notebook,
  Tag,
  Comment,
  Attachment,
  Group,
  Admin
};

