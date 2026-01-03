<?php
/**
 * Dashboard Page
 * 
 * Main page users see after logging in.
 * Displays notebooks and recent notes.
 */

require_once __DIR__ . '/../php-backend/config/session.php';
require_once __DIR__ . '/../php-backend/config/database.php';
requireAuth();

$user = getCurrentUser();
$error = '';
$success = '';

// Handle create notebook
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_notebook'])) {
    $notebook_name = trim($_POST['notebook_name'] ?? '');
    
    if (empty($notebook_name)) {
        $error = 'Notebook name is required';
    } else {
        // Generate unique notebook_ID
        $notebook_ID = 'NOTEBOOK_' . time() . '_' . bin2hex(random_bytes(4));
        
        $stmt = $pdo->prepare("
            INSERT INTO notebooks (notebook_ID, notebook_name, owner_id, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
        ");
        
        if ($stmt->execute([$notebook_ID, $notebook_name, $user['id']])) {
            $success = 'Notebook created successfully!';
        } else {
            $error = 'Failed to create notebook';
        }
    }
}

// Get notebooks
$stmt = $pdo->prepare("
    SELECT n.*, 
           COUNT(DISTINCT nn.note_id) as note_count
    FROM notebooks n
    LEFT JOIN notebook_notes nn ON n.id = nn.notebook_id
    WHERE n.owner_id = ?
    GROUP BY n.id
    ORDER BY n.created_at DESC
");
$stmt->execute([$user['id']]);
$notebooks = $stmt->fetchAll();

// Get recent notes
$stmt = $pdo->prepare("
    SELECT n.*, u.first_name, u.last_name
    FROM notes n
    LEFT JOIN users u ON n.UID = u.id
    WHERE n.UID = ?
    ORDER BY n.creation_time DESC
    LIMIT 10
");
$stmt->execute([$user['id']]);
$notes = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Note Taking App</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>
    
    <div class="container">
        <div class="dashboard-header">
            <h1>Welcome, <?php echo htmlspecialchars($user['first_name']); ?>!</h1>
            <p>Manage your notebooks and notes</p>
        </div>
        
        <?php if ($error): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <!-- Create New Notebook Section -->
        <div class="card">
            <h2>Notebooks</h2>
            
            <form method="POST" action="dashboard.php" class="inline-form">
                <input
                    type="text"
                    name="notebook_name"
                    placeholder="Enter notebook name"
                    required
                />
                <button type="submit" name="create_notebook" class="btn btn-success">Create</button>
            </form>
            
            <!-- Notebooks List -->
            <?php if (empty($notebooks)): ?>
                <p class="empty-message">No notebooks yet. Create one to get started!</p>
            <?php else: ?>
                <div class="notebooks-grid">
                    <?php foreach ($notebooks as $notebook): ?>
                        <a href="notebook.php?id=<?php echo $notebook['id']; ?>" class="notebook-card">
                            <h3><?php echo htmlspecialchars($notebook['notebook_name']); ?></h3>
                            <p class="note-count"><?php echo $notebook['note_count']; ?> note(s)</p>
                        </a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
        
        <!-- Recent Notes Section -->
        <div class="card">
            <h2>Recent Notes</h2>
            
            <a href="note.php?new=1" class="btn btn-primary">+ Create New Note</a>
            
            <?php if (empty($notes)): ?>
                <p class="empty-message">No notes yet. Create one to get started!</p>
            <?php else: ?>
                <div class="notes-list">
                    <?php foreach ($notes as $note): ?>
                        <a href="note.php?id=<?php echo $note['id']; ?>" class="note-item">
                            <h3><?php echo htmlspecialchars($note['title']); ?></h3>
                            <p class="note-preview">
                                <?php echo htmlspecialchars(substr($note['content'] ?? '', 0, 100)); ?>...
                            </p>
                            <p class="note-meta">
                                Created: <?php echo date('M d, Y', strtotime($note['creation_time'])); ?>
                            </p>
                        </a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>

