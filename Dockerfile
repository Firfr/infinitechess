## 需要现在本地编译，在把编译后的文件复制到镜像中

# 使用指定的 Node.js 镜像
FROM node:22.15.0-bookworm-slim

# 设置工作目录
WORKDIR /app

# 复制 package.json 和启动脚本等必要文件
COPY package.json .env ./ 
# COPY database.db ./ 

# 复制子目录
COPY dist dist
COPY translation translation
# COPY cert cert
# COPY database database

# 复制依赖
COPY node_modules node_modules

# 暴露端口（注意：Dockerfile中不能设置 host 端口映射，需在 docker run 中使用 -p）
EXPOSE 1443

# 启动命令
CMD ["npm", "run", "start"]


# docker build -t firfe/infinitechess:2025.05.12 .

