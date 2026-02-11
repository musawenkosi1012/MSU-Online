@echo off
echo Starting MSU Online AI Platform...

echo Starting Backend...
start cmd /k "cd /d backend && python run.py"

echo Starting Frontend...
start cmd /k "cd /d frontend && npm run dev"

echo Done. Backend will be available at http://localhost:8000
echo Frontend will be available at http://localhost:5173
echo.
echo If you prefer PowerShell, you can run:
echo cd backend; python run.py
echo.
pause
