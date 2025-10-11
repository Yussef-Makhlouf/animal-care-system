@echo off
REM ========================================
REM   AHCP Database Backup Script
REM   Windows MongoDB Backup Automation
REM ========================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   AHCP Database Backup
echo ========================================
echo.

REM Configuration
set DB_NAME=ahcp_database
set BACKUP_DIR=backups
set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_PATH=%BACKUP_DIR%\backup_%TIMESTAMP%

echo [1/5] Checking MongoDB installation...
where mongodump >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: mongodump not found!
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
echo [3/5] Creating backup directory...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
echo ✓ Backup directory ready: %BACKUP_DIR%

echo.
echo [4/5] Backing up database: %DB_NAME%...
echo Backup location: %BACKUP_PATH%
mongodump --db %DB_NAME% --out "%BACKUP_PATH%" --quiet
if %errorLevel% neq 0 (
    echo ERROR: Database backup failed!
    pause
    exit /b 1
)
echo ✓ Database backup completed

echo.
echo [5/5] Creating compressed archive...
cd %BACKUP_DIR%
tar -czf backup_%TIMESTAMP%.tar.gz backup_%TIMESTAMP% 2>nul
if %errorLevel% equ 0 (
    echo ✓ Compressed archive created
    rmdir /s /q backup_%TIMESTAMP%
    echo ✓ Removed uncompressed backup
) else (
    echo Note: tar compression failed (requires Windows 10 1803+)
    echo Backup available in: %BACKUP_PATH%
)
cd ..

echo.
echo ========================================
echo   Backup Complete!
echo ========================================
echo.
echo Backup location: %BACKUP_PATH%
echo Database: %DB_NAME%
echo Timestamp: %TIMESTAMP%
echo.
echo To restore this backup, run:
echo   restore-database.bat %TIMESTAMP%
echo.

REM Cleanup old backups (keep last 7 days)
echo Cleaning up old backups (keeping last 7)...
set COUNT=0
for /f "delims=" %%i in ('dir /b /o-d "%BACKUP_DIR%\backup_*"') do (
    set /a COUNT+=1
    if !COUNT! gtr 7 (
        echo Deleting old backup: %%i
        del /q "%BACKUP_DIR%\%%i" 2>nul
        rmdir /s /q "%BACKUP_DIR%\%%i" 2>nul
    )
)

echo ✓ Cleanup complete
echo.
pause

