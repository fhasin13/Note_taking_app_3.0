# Note Taking App - PHP Version

This is the PHP/HTML/CSS version of the note-taking application, converted from the React/Node.js version.

## Structure

```
note-taking-app/
├── php-backend/          # PHP backend code
│   ├── config/          # Database and session configuration
│   ├── controllers/     # Business logic (optional, can be integrated into pages)
│   ├── utils/           # Utility functions
│   └── api/             # API endpoints (if needed)
├── php-frontend/        # PHP frontend pages
│   ├── includes/        # Shared components (navbar, etc.)
│   ├── css/             # Stylesheets
│   ├── login.php        # Login page
│   ├── signup.php       # Signup page
│   ├── dashboard.php    # Main dashboard
│   ├── notebook.php     # Notebook view
│   ├── note.php         # Note editor
│   ├── groups.php       # Group management
│   └── logout.php       # Logout handler
└── .env                 # Environment variables (database config)
```

## Setup Instructions

### 1. Database Setup

The PHP version uses the same MySQL database as the Node.js version. Make sure your database is set up with the same schema.

### 2. Environment Configuration

Create a `.env` file in the root directory (or update the existing one):

```env
DB_HOST=localhost
DB_NAME=note_taking_app
DB_USER=root
DB_PASSWORD=your_password
DB_PORT=3306
```

### 3. Web Server Configuration

#### Option A: Using PHP Built-in Server (Development)

```bash
cd php-frontend
php -S localhost:8000
```

Then visit `http://localhost:8000/login.php`

#### Option B: Using Apache

1. Point your Apache document root to the `php-frontend` directory
2. Make sure mod_rewrite is enabled
3. The `.htaccess` file will handle URL routing

#### Option C: Using Nginx

Configure Nginx to point to the `php-frontend` directory and use PHP-FPM.

### 4. File Permissions

Make sure PHP has read access to all files and write access to session directory:

```bash
chmod -R 755 php-frontend
chmod -R 755 php-backend
```

## Features

- **User Authentication**: Login and signup with session-based authentication
- **Dashboard**: View notebooks and recent notes
- **Notebooks**: Create and manage notebooks
- **Notes**: Create, edit, and delete notes
- **Comments**: Add comments to notes
- **Groups**: Group management (for Lead Editors and Admins)

## Differences from React Version

1. **Server-Side Rendering**: All pages are rendered on the server using PHP
2. **Session-Based Auth**: Uses PHP sessions instead of JWT tokens
3. **Direct Database Access**: Pages directly query the database instead of using API endpoints
4. **No Build Step**: No need for npm, webpack, or build processes
5. **Simpler Deployment**: Just upload files to a web server with PHP support

## Database Schema

The PHP version uses the same database schema as the Node.js version. The tables should already exist if you've run the Node.js version.

## Security Notes

- Passwords are hashed using PHP's `password_hash()` function
- SQL queries use prepared statements to prevent SQL injection
- User input is sanitized using `htmlspecialchars()`
- Session-based authentication is used instead of JWT

## Troubleshooting

### Database Connection Issues

- Check your `.env` file has correct database credentials
- Ensure MySQL is running
- Verify the database exists

### Session Issues

- Make sure PHP has write access to the session directory
- Check `php.ini` for session configuration

### Path Issues

- All paths are relative to the `php-frontend` directory
- Make sure you're accessing files through the web server, not directly

## Migration from React Version

If you're migrating from the React version:

1. The database schema remains the same
2. User accounts are compatible
3. All existing data will work with the PHP version
4. You can run both versions simultaneously if needed (using different ports)

