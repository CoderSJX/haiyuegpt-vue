# 使用官方 Node.js 镜像作为基础镜像
FROM nginx:stable-alpine AS production-stage

# 设置工作目录
WORKDIR /app


# 复制项目源码到容器中
COPY ./dist ./dist

# 移除默认的 Nginx 配置文件
RUN rm /etc/nginx/conf.d/default.conf

# 将 Vue 应用的静态资源从构建阶段的容器复制到 Nginx 服务器的 HTML 目录下
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 将自定义的 Nginx 配置文件复制到容器中
COPY nginx.conf /etc/nginx/conf.d

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]