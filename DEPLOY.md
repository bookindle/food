# 部署指南 (Deployment Guide)

这个项目是一个基于 React + Vite 的静态网页应用。你可以通过以下几种方式将其发布到互联网上供他人访问。

## 方法一：使用 AnyGen 自带的分享功能 (最简单)
在右侧预览窗口的右上角，点击 **"分享 (Share)"** 按钮，系统会生成一个公开的链接，你可以直接发给朋友使用。

## 方法二：部署到 Vercel (推荐)
Vercel 是一个免费且极其好用的静态网站托管平台。

1. **获取代码**：下载本项目的压缩包并解压。
2. **上传到 GitHub**：将代码上传到你的 GitHub 仓库。
3. **连接 Vercel**：
   - 访问 [vercel.com](https://vercel.com) 并注册/登录。
   - 点击 "Add New..." -> "Project"。
   - 选择你刚才上传的 GitHub 仓库。
   - Vercel 会自动识别这是一个 Vite 项目。
   - 点击 "Deploy"。
4. **完成**：等待几十秒，Vercel 会给你一个类似 `your-project.vercel.app` 的永久域名。

## 方法三：部署到 Netlify
Netlify 是另一个优秀的选择。

1. 访问 [netlify.com](https://www.netlify.com) 并注册。
2. 直接将解压后的文件夹（或者 `dist` 文件夹，如果你自己在本地构建了的话）拖入 Netlify 的上传区域。
3. 或者像 Vercel 一样连接 GitHub 仓库进行自动部署。

## 本地开发命令
如果你懂技术，想在本地运行：

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```
