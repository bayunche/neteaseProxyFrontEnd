# 使用轻量的 Debian 镜像
FROM node:22-slim

# 安装必要工具
RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

# 全局安装 Claude Code 和 Router
RUN npm install -g @anthropic-ai/claude-code @musistudio/claude-code-router

# 创建工作目录
WORKDIR /workspace

# 挂载宿主机 claude-code-router 配置至 /root/.claude-code-router
VOLUME ["/workspace", "/root/.claude-code-router"]

# 默认命令进入 bash
CMD ["bash"]
