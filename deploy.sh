#!/bin/bash

# 智能社区平台部署脚本

set -e

echo "=========================================="
echo "智能社区平台部署脚本"
echo "=========================================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: 未安装Docker，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: 未安装Docker Compose，请先安装Docker Compose"
    exit 1
fi

# 检查.env文件是否存在
if [ ! -f .env ]; then
    echo "警告: .env文件不存在，正在从.env.example创建..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "已创建.env文件，请编辑配置后再运行此脚本"
        exit 1
    else
        echo "错误: .env.example文件不存在"
        exit 1
    fi
fi

# 询问操作类型
echo ""
echo "请选择操作："
echo "1. 启动服务（首次部署）"
echo "2. 重启服务"
echo "3. 停止服务"
echo "4. 查看日志"
echo "5. 更新代码并重启"
read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo "正在启动服务..."
        docker-compose up -d --build
        
        echo "等待服务启动..."
        sleep 10
        
        echo "正在运行数据库迁移..."
        docker-compose exec -T backend python manage.py migrate
        
        echo ""
        echo "=========================================="
        echo "部署完成！"
        echo "=========================================="
        echo "前端管理后台: http://localhost:3000"
        echo "后端API: http://localhost:8000/api"
        echo "API文档: http://localhost:8000/api/schema/swagger-ui/"
        echo ""
        echo "提示: 如需创建超级用户，请运行:"
        echo "  docker-compose exec backend python manage.py createsuperuser"
        ;;
    2)
        echo "正在重启服务..."
        docker-compose restart
        echo "服务已重启"
        ;;
    3)
        echo "正在停止服务..."
        docker-compose down
        echo "服务已停止"
        ;;
    4)
        echo "正在显示日志（按Ctrl+C退出）..."
        docker-compose logs -f
        ;;
    5)
        echo "正在拉取最新代码..."
        git pull
        
        echo "正在重建并重启服务..."
        docker-compose up -d --build
        
        echo "正在运行数据库迁移..."
        docker-compose exec -T backend python manage.py migrate
        
        echo "更新完成！"
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

