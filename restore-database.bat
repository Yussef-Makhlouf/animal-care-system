@echo off
REM ========================================
REM   AHCP Database Restore Script
REM   Windows MongoDB Restore Automation
REM ========================================

echo.
echo ========================================
echo   AHCP Database Restore
echo ========================================
echo.

REM Configuration
set DB_NAME=ahcp_database
set BACKUP_DIR=backups

REM Check if backup timestamp is provided
if "%1"=="" (
    echo ERROR: Backup timestamp not provided!
    echo.
    echo Usage: restore-database.bat TIMESTAMP
    echo.
    echo Available backups:
    dir /b "%BACKUP_DIR%\backup_*" 2>nul
    echo.
    pause
    exit /b 1
)

set TIMESTAMP=%1
set BACKUP_PATH=%BACKUP_DIR%\backup_%TIMESTAMP%
set ARCHIVE_PATH=%BACKUP_DIR%\backup_%TIMESTAMP%.tar.gz

echo [1/5] Checking MongoDB installation...
where mongorestore >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: mongorestore not found!
    echo Please install MongoDB Tools or add to PATH.
    pause
    exit /b 1
)
echo ✓ MongoDB tools found

echo.
echo [2/5] Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorLevel% neq 0 (
    echo ERROR: MongoDB service is not running!
    echo Please start MongoDB service first.
    pause
    exit /b 1
)
echo ✓ MongoDB is running

echo.
echo [3/5] Locating backup...
if exist "%ARCHIVE_PATH%" (
    echo Found compressed backup: %ARCHIVE_PATH%
    echo Extracting...
    cd %BACKUP_DIR%
    tar -xzf backup_%TIMESTAMP%.tar.gz 2>nul
    if %errorLevel% neq 0 (
        echo ERROR: Failed to extract backup!
        pause
        exit /b 1
    )
    cd ..
    echo ✓ Backup extracted
) else if exist "%BACKUP_PATH%" (
    echo Found backup: %BACKUP_PATH%
) else (
    echo ERROR: Backup not found!
    echo Looking for: %BACKUP_PATH%
    echo.
    echo Available backups:
    dir /b "%BACKUP_DIR%\backup_*" 2>nul
    pause
    exit /b 1
)

echo.
echo ⚠️  WARNING: This will replace the current database!
echo Database: %DB_NAME%
echo Backup: %TIMESTAMP%
echo.
set /p CONFIRM="Continue with restore? (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo Restore cancelled.
    pause
    exit /b 0
)

echo.
echo [4/5] Dropping existing database...
mongo %DB_NAME% --eval "db.dropDatabase()" >nul 2>&1
echo ✓ Existing database dropped

echo.
echo [5/5] Restoring database from backup...
mongorestore --db %DB_NAME% "%BACKUP_PATH%\%DB_NAME%" --quiet
if %errorLevel% neq 0 (
    echo ERROR: Database restore failed!
    pause
    exit /b 1
)
echo ✓ Database restore completed

echo.
echo ========================================
echo   Restore Complete!
echo ========================================
echo.
echo Database: %DB_NAME%
echo Restored from: %TIMESTAMP%
echo.
pause

