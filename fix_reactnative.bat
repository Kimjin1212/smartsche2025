@echo off
echo [1] 停止 Metro bundler（如有）
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
  echo 正在关闭占用端口 8081 的进程 %%a ...
  taskkill /PID %%a /F >nul 2>&1
)

echo [2] 删除 .cxx 构建中间文件...
rd /s /q android\app\.cxx

echo [3] Gradle clean 中...
cd android
call gradlew clean
cd ..

echo [4] 启动 Metro bundler...
start cmd /k "npx react-native start --reset-cache"

echo [5] 构建并运行 App...
npx react-native run-android
