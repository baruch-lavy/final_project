@echo off
echo Installing dependencies in server directory...
cd /d "c:\Users\baruc\OneDrive\Desktop\final_project.worktrees\copilot-worktree-2026-03-23T11-10-42\server"
call npm install
if errorlevel 1 (
    echo Server npm install failed with error code %errorlevel%
    exit /b 1
)

echo.
echo Installing dependencies in client directory...
cd /d "c:\Users\baruc\OneDrive\Desktop\final_project.worktrees\copilot-worktree-2026-03-23T11-10-42\client"
call npm install
if errorlevel 1 (
    echo Client npm install failed with error code %errorlevel%
    exit /b 1
)

echo.
echo Both npm install commands completed successfully!
exit /b 0
