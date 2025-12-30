@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo 智能社区平台部署脚本
echo ==========================================

REM 检查Docker是否安装
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未安装Docker，请先安装Docker
    exit /b 1
)

REM 检查Docker Compose是否安装
where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未安装Docker Compose，请先安装Docker Compose
    exit /b 1
)

REM 检查.env文件是否存在
if not exist .env (
    echo 警告: .env文件不存在，正在从.env.example创建...
    if exist .env.example (
        copy .env.example .env
        echo 已创建.env文件，请编辑配置后再运行此脚本
        exit /b 1
    ) else (
        echo 错误: .env.example文件不存在
        exit /b 1
    )
)

echo.
echo 请选择操作：
echo 1. 启动服务（首次部署）
echo 2. 重启服务
echo 3. 停止服务
echo 4. 查看日志
echo 5. 更新代码并重启
set /p choice=请输入选项 (1-5): 

if "%choice%"=="1" (
    echo 正在启动服务...
    docker-compose up -d --build
    
    echo 等待服务启动...
    timeout /t 10 /nobreak >nul
    
    echo 正在运行数据库迁移...
    docker-compose exec -T backend python manage.py migrate
    
    echo.
    echo ==========================================
    echo 部署完成！
    echo ==========================================
    echo 前端管理后台: http://localhost:3000
    echo 后端API: http://localhost:8000/api
    echo API文档: http://localhost:8000/api/schema/swagger-ui/
    echo.
    echo 提示: 如需创建超级用户，请运行:
    echo   docker-compose exec backend python manage.py createsuperuser
) else if "%choice%"=="2" (
    echo 正在重启服务...
    docker-compose restart
    echo 服务已重启
) else if "%choice%"=="3" (
    echo 正在停止服务...
    docker-compose down
    echo 服务已停止
) else if "%choice%"=="4" (
    echo 正在显示日志（按Ctrl+C退出）...
    docker-compose logs -f
) else if "%choice%"=="5" (
    echo 正在拉取最新代码...
    git pull
    
    echo 正在重建并重启服务...
    docker-compose up -d --build
    
    echo 正在运行数据库迁移...
    docker-compose exec -T backend python manage.py migrate
    
    echo 更新完成！
) else (
    echo 无效选项
    exit /b 1
)

endlocal

