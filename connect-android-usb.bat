@echo off
echo Setting up ADB reverse port forwarding for Android over USB...
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" reverse tcp:3001 tcp:3001
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
echo.
echo ========================================================
echo  Ports 3001 and 8081 are now routed via USB!
echo  Now in Super-campus-frontend-\.env, you can use:
echo  EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
echo ========================================================
echo.
pause
