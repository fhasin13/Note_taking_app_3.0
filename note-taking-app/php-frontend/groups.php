<?php
/**
 * Group Management Page
 * 
 * Allows Lead Editors and Admins to manage groups.
 */

require_once __DIR__ . '/../php-backend/config/session.php';
require_once __DIR__ . '/../php-backend/config/database.php';
requireAuth();

$user = getCurrentUser();

// Check permission
$isAdmin = in_array('Admin', $user['roles'] ?? []);
$isLeadEditor = in_array('Lead Editor', $user['roles'] ?? []);

if (!$isAdmin && !$isLeadEditor) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
$success = '';

// Get groups
$stmt = $pdo->query("
    SELECT g.*, u.first_name, u.last_name
    FROM groups g
    LEFT JOIN users u ON g.lead_editor_id = u.id
    ORDER BY g.created_at DESC
");
$groups = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Groups - Note Taking App</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>
    
    <div class="container">
        <div class="dashboard-header">
            <h1>Group Management</h1>
            <p>Manage groups and their members</p>
        </div>
        
        <?php if ($error): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <div class="card">
            <h2>Groups</h2>
            
            <?php if (empty($groups)): ?>
                <p class="empty-message">No groups yet.</p>
            <?php else: ?>
                <div class="notes-list">
                    <?php foreach ($groups as $group): ?>
                        <div class="note-item">
                            <h3><?php echo htmlspecialchars($group['group_name']); ?></h3>
                            <p class="note-meta">
                                Lead Editor: <?php echo htmlspecialchars($group['first_name'] . ' ' . $group['last_name']); ?>
                            </p>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>

