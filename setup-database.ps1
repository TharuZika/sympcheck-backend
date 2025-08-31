# SympCheck Database Setup Script
# Run this script to set up your database with proper migrations

Write-Host "🚀 SympCheck Database Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Set environment variable
$env:NODE_ENV = "development"
Write-Host "✅ Set NODE_ENV to development" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your database configuration" -ForegroundColor Yellow
    Write-Host "See MIGRATION_GUIDE.md for details" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# Install dependencies if needed
Write-Host "📦 Checking dependencies..." -ForegroundColor Blue
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Create database
Write-Host "🗄️  Creating database..." -ForegroundColor Blue
try {
    npx sequelize-cli db:create
    Write-Host "✅ Database created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create database" -ForegroundColor Red
    Write-Host "Make sure MySQL is running and credentials are correct" -ForegroundColor Yellow
    exit 1
}

# Run migrations
Write-Host "🔄 Running migrations..." -ForegroundColor Blue
try {
    npx sequelize-cli db:migrate
    Write-Host "✅ Migrations completed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to run migrations" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Database setup completed successfully!" -ForegroundColor Green
Write-Host "You can now start the application with: npm run dev" -ForegroundColor Blue
Write-Host ""
Write-Host "📚 For more information, see MIGRATION_GUIDE.md" -ForegroundColor Cyan
