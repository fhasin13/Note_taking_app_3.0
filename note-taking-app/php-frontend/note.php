<?php
/**
 * Note Editor Page
 * 
 * Allows users to view, create, and edit notes.
 */

require_once __DIR__ . '/../php-backend/config/session.php';
require_once __DIR__ . '/../php-backend/config/database.php';
requireAuth();

$user = getCurrentUser();
$note_id = $_GET['id'] ?? null;
$is_new = isset($_GET['new']) || !$note_id;
$error = '';
$success = '';

// Handle save note
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $content = $_POST['content'] ?? '';
    
    if (empty($title)) {
        $error = 'Note title is required';
    } else {
        if ($is_new) {
            // Create new note
            $note_id_str = 'NOTE_' . time() . '_' . bin2hex(random_bytes(4));
            
            $stmt = $pdo->prepare("
                INSERT INTO notes (note_id, UID, title, content, type, creation_time, updated_at)
                VALUES (?, ?, ?, ?, 'text', NOW(), NOW())
            ");
            
            if ($stmt->execute([$note_id_str, $user['id'], $title, $content])) {
                $note_id = $pdo->lastInsertId();
                $success = 'Note created successfully!';
                header('Location: note.php?id=' . $note_id);
                exit;
            } else {
                $error = 'Failed to create note';
            }
        } else {
            // Update existing note
            $stmt = $pdo->prepare("
                UPDATE notes 
                SET title = ?, content = ?, updated_at = NOW()
                WHERE id = ? AND UID = ?
            ");
            
            if ($stmt->execute([$title, $content, $note_id, $user['id']])) {
                $success = 'Note saved successfully!';
            } else {
                $error = 'Failed to save note';
            }
        }
    }
}

// Handle delete note
if (isset($_POST['delete_note'])) {
    $stmt = $pdo->prepare("DELETE FROM notes WHERE id = ? AND UID = ?");
    if ($stmt->execute([$note_id, $user['id']])) {
        header('Location: dashboard.php');
        exit;
    } else {
        $error = 'Failed to delete note';
    }
}

// Get note data
$note = null;
if (!$is_new) {
    $stmt = $pdo->prepare("SELECT * FROM notes WHERE id = ?");
    $stmt->execute([$note_id]);
    $note = $stmt->fetch();
    
    if (!$note) {
        $error = 'Note not found';
        $is_new = true;
    }
}

// Get comments
$comments = [];
if (!$is_new && $note) {
    $stmt = $pdo->prepare("
        SELECT c.*, u.first_name, u.last_name, u.user_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.note_id = ?
        ORDER BY c.comment_time DESC
    ");
    $stmt->execute([$note_id]);
    $comments = $stmt->fetchAll();
}

// Handle add comment
if (isset($_POST['add_comment'])) {
    $comment_text = trim($_POST['comment_text'] ?? '');
    
    if (empty($comment_text)) {
        $error = 'Comment text is required';
    } else {
        $comment_id = 'COMMENT_' . time() . '_' . bin2hex(random_bytes(4));
        
        $stmt = $pdo->prepare("
            INSERT INTO comments (comment_id, user_id, note_id, comment_text, comment_time)
            VALUES (?, ?, ?, ?, NOW())
        ");
        
        if ($stmt->execute([$comment_id, $user['id'], $note_id, $comment_text])) {
            header('Location: note.php?id=' . $note_id);
            exit;
        } else {
            $error = 'Failed to add comment';
        }
    }
}

// Handle delete comment
if (isset($_POST['delete_comment'])) {
    $comment_id = $_POST['comment_id'] ?? null;
    
    if ($comment_id) {
        $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ? AND (user_id = ? OR ? IN (SELECT id FROM users WHERE JSON_CONTAINS(roles, '[\"Admin\"]') OR JSON_CONTAINS(roles, '[\"Editor\"]')))");
        $stmt->execute([$comment_id, $user['id'], $user['id']]);
        header('Location: note.php?id=' . $note_id);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $is_new ? 'New Note' : htmlspecialchars($note['title'] ?? 'Note'); ?> - Note Taking App</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>
    
    <div class="container">
        <div class="note-editor-header">
            <a href="dashboard.php" class="back-link">← Back to Dashboard</a>
            <div class="note-actions">
                <form method="POST" action="note.php<?php echo !$is_new ? '?id=' . $note_id : ''; ?>" style="display: inline;">
                    <button type="submit" class="btn btn-primary">Save Note</button>
                </form>
                <?php if (!$is_new): ?>
                    <form method="POST" action="note.php?id=<?php echo $note_id; ?>" style="display: inline;" onsubmit="return confirm('Are you sure you want to delete this note?');">
                        <input type="hidden" name="delete_note" value="1">
                        <button type="submit" class="btn btn-danger">Delete Note</button>
                    </form>
                <?php endif; ?>
            </div>
        </div>
        
        <?php if ($error): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <!-- Note Editor Form -->
        <div class="card">
            <form method="POST" action="note.php<?php echo !$is_new ? '?id=' . $note_id : ''; ?>">
                <div class="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        name="title"
                        value="<?php echo htmlspecialchars($note['title'] ?? ''); ?>"
                        placeholder="Enter note title"
                        class="note-title-input"
                        required
                    />
                </div>
                
                <div class="form-group">
                    <label>Content</label>
                    <textarea
                        name="content"
                        placeholder="Write your note content here..."
                        class="note-content-input"
                        rows="15"
                    ><?php echo htmlspecialchars($note['content'] ?? ''); ?></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary">Save Note</button>
            </form>
        </div>
        
        <!-- Comments Section (only for existing notes) -->
        <?php if (!$is_new): ?>
            <div class="card">
                <h2>Comments</h2>
                
                <!-- Add Comment Form -->
                <form method="POST" action="note.php?id=<?php echo $note_id; ?>" class="comment-form">
                    <textarea
                        name="comment_text"
                        placeholder="Write a comment..."
                        rows="3"
                        required
                    ></textarea>
                    <button type="submit" name="add_comment" class="btn btn-primary">Add Comment</button>
                </form>
                
                <!-- Comments List -->
                <div class="comments-list">
                    <?php if (empty($comments)): ?>
                        <p class="empty-message">No comments yet.</p>
                    <?php else: ?>
                        <?php foreach ($comments as $comment): ?>
                            <div class="comment-item">
                                <div class="comment-header">
                                    <strong><?php echo htmlspecialchars($comment['first_name'] . ' ' . $comment['last_name']); ?></strong>
                                    <span class="comment-time">
                                        <?php echo date('M d, Y H:i', strtotime($comment['comment_time'])); ?>
                                    </span>
                                    <?php if ($comment['user_id'] == $user['id'] || in_array('Admin', $user['roles']) || in_array('Editor', $user['roles'])): ?>
                                        <form method="POST" action="note.php?id=<?php echo $note_id; ?>" style="display: inline;">
                                            <input type="hidden" name="comment_id" value="<?php echo $comment['id']; ?>">
                                            <input type="hidden" name="delete_comment" value="1">
                                            <button type="submit" class="btn-delete-comment">Delete</button>
                                        </form>
                                    <?php endif; ?>
                                </div>
                                <p class="comment-text"><?php echo htmlspecialchars($comment['comment_text']); ?></p>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>

