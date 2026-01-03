<?php
/**
 * Notebook View Page
 * 
 * Displays a single notebook and all its notes.
 */

require_once __DIR__ . '/../php-backend/config/session.php';
require_once __DIR__ . '/../php-backend/config/database.php';
requireAuth();

$user = getCurrentUser();
$notebook_id = $_GET['id'] ?? null;
$error = '';

if (!$notebook_id) {
    header('Location: dashboard.php');
    exit;
}

// Get notebook
$stmt = $pdo->prepare("
    SELECT n.*, u.first_name, u.last_name
    FROM notebooks n
    LEFT JOIN users u ON n.owner_id = u.id
    WHERE n.id = ?
");
$stmt->execute([$notebook_id]);
$notebook = $stmt->fetch();

if (!$notebook) {
    $error = 'Notebook not found';
} else {
    // Get notes in this notebook
    $stmt = $pdo->prepare("
        SELECT n.*, u.first_name, u.last_name
        FROM notes n
        INNER JOIN notebook_notes nn ON n.id = nn.note_id
        LEFT JOIN users u ON n.UID = u.id
        WHERE nn.notebook_id = ?
        ORDER BY n.creation_time DESC
    ");
    $stmt->execute([$notebook_id]);
    $notes = $stmt->fetchAll();
}

// Handle create note
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_note'])) {
    $title = trim($_POST['title'] ?? '');
    
    if (empty($title)) {
        $error = 'Note title is required';
    } else {
        // Generate unique note_id
        $note_id = 'NOTE_' . time() . '_' . bin2hex(random_bytes(4));
        
        $stmt = $pdo->prepare("
            INSERT INTO notes (note_id, UID, title, content, type, creation_time, updated_at)
            VALUES (?, ?, ?, '', 'text', NOW(), NOW())
        ");
        
        if ($stmt->execute([$note_id, $user['id'], $title])) {
            $new_note_id = $pdo->lastInsertId();
            
            // Add note to notebook
            $stmt = $pdo->prepare("
                INSERT INTO notebook_notes (notebook_id, note_id)
                VALUES (?, ?)
            ");
            $stmt->execute([$notebook_id, $new_note_id]);
            
            header('Location: note.php?id=' . $new_note_id);
            exit;
        } else {
            $error = 'Failed to create note';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($notebook['notebook_name'] ?? 'Notebook'); ?> - Note Taking App</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>
    
    <div class="container">
        <?php if ($error && !$notebook): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
            <a href="dashboard.php" class="btn btn-primary">Back to Dashboard</a>
        <?php else: ?>
            <!-- Notebook Header -->
            <div class="notebook-header">
                <a href="dashboard.php" class="back-link">← Back to Dashboard</a>
                <h1><?php echo htmlspecialchars($notebook['notebook_name']); ?></h1>
                <p class="notebook-info">
                    <?php echo count($notes ?? []); ?> note(s) in this notebook
                </p>
            </div>
            
            <?php if ($error): ?>
                <div class="error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <!-- Create New Note Section -->
            <div class="card">
                <form method="POST" action="notebook.php?id=<?php echo $notebook_id; ?>" class="inline-form">
                    <input
                        type="text"
                        name="title"
                        placeholder="Enter note title"
                        required
                    />
                    <button type="submit" name="create_note" class="btn btn-success">Create</button>
                </form>
            </div>
            
            <!-- Notes List -->
            <div class="card">
                <h2>Notes</h2>
                
                <?php if (empty($notes)): ?>
                    <p class="empty-message">
                        No notes in this notebook yet. Create one to get started!
                    </p>
                <?php else: ?>
                    <div class="notes-grid">
                        <?php foreach ($notes as $note): ?>
                            <a href="note.php?id=<?php echo $note['id']; ?>" class="note-card">
                                <h3><?php echo htmlspecialchars($note['title']); ?></h3>
                                <p class="note-preview">
                                    <?php echo htmlspecialchars(substr($note['content'] ?? 'No content yet...', 0, 150)); ?>
                                </p>
                                <p class="note-meta">
                                    Created: <?php echo date('M d, Y', strtotime($note['creation_time'])); ?>
                                </p>
                            </a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>

