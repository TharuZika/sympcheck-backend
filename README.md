# SympCheck Backend

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create a `.env` file in the root directory with:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_NAME=sympcheck
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Database Setup
```bash
# Set environment (Windows PowerShell)
$env:NODE_ENV="development"

# Create database
npm run db:create

# Run migrations
npm run db:migrate
```

### 4. Start Development Server
```bash
npm run dev
```

## Available Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:create` - Create database
- `npm run db:migrate` - Run migrations
- `npm run db:migrate:undo` - Undo last migration
- `npm run db:drop` - Drop database

## API Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/symptoms/analyze` - Analyze symptoms
- `GET /api/v1/history` - Get user history (requires auth)
