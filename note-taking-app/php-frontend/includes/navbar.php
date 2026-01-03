<?php
/**
 * Navigation Bar Component
 * 
 * This component displays the top navigation bar with links to different pages.
 */

// Session is already loaded by the including page

$user = getCurrentUser();
$currentPage = basename($_SERVER['PHP_SELF']);

// Check if user has specific roles
$isAdmin = in_array('Admin', $user['roles'] ?? []);
$isLeadEditor = in_array('Lead Editor', $user['roles'] ?? []);
$canManageGroups = $isAdmin || $isLeadEditor;
?>

<nav class="navbar">
    <div class="navbar-brand">
        <a href="dashboard.php">📝 Note Taking App</a>
    </div>
    
    <div class="navbar-links">
        <!-- Dashboard Link -->
        <a href="dashboard.php" class="<?php echo $currentPage === 'dashboard.php' ? 'active' : ''; ?>">
            Dashboard
        </a>
        
        <!-- Groups Link (only for Admin and Lead Editor) -->
        <?php if ($canManageGroups): ?>
            <a href="groups.php" class="<?php echo $currentPage === 'groups.php' ? 'active' : ''; ?>">
                Groups
            </a>
        <?php endif; ?>
        
        <!-- User Info -->
        <span class="user-info">
            <?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?>
            <?php if (!empty($user['roles'])): ?>
                <span class="user-roles">
                    (<?php echo htmlspecialchars(implode(', ', $user['roles'])); ?>)
                </span>
            <?php endif; ?>
        </span>
        
        <!-- Logout Button -->
        <form method="POST" action="logout.php" style="display: inline;">
            <button type="submit" class="btn-logout">Logout</button>
        </form>
    </div>
</nav>

