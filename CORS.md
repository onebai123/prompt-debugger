# CORS 跨域问题说明

## 🌐 架构说明

本项目**直接从浏览器调用AI服务API**，不经过后端服务器中转。

```
浏览器 → 直接调用 → AI服务API (OpenAI/DeepSeek/等)
```

**优势**：
- ✅ 速度快（无需后端中转）
- ✅ 降低服务器成本（Vercel免费版无限制）
- ✅ 简化部署（纯前端应用）
- ✅ 数据安全（直接与AI服务商交互）

## ⚠️ CORS限制

### 什么是CORS？

CORS（跨域资源共享）是浏览器的安全策略。当网页向不同域名的服务器发送请求时，需要服务器明确允许。

### 哪些API支持CORS？

✅ **支持CORS的API**（可直接使用）：
- OpenAI官方API (`https://api.openai.com/v1`)
- 大部分第三方OpenAI兼容API
- DeepSeek API
- 国内OneAPI、NewAPI等代理服务（需配置）

❌ **不支持CORS的API**：
- 一些国内AI服务（需要后端中转）
- 本地Ollama（HTTP协议限制）
- 部分未配置CORS的代理服务

## 🔧 解决方案

### 方案1：使用支持CORS的API（推荐）

**OpenAI官方**：
```
API Base URL: https://api.openai.com/v1
模型: gpt-4o, gpt-4o-mini, o1等
```

**DeepSeek**：
```
API Base URL: https://api.deepseek.com
模型: deepseek-chat, deepseek-coder等
```

### 方案2：使用API代理服务

如果你的API不支持CORS，可以使用代理服务：

**OneAPI（推荐）**：
```bash
# Docker部署OneAPI
docker run -d -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  justsong/one-api
```

配置CORS：
1. 登录OneAPI管理后台
2. 设置 → 系统设置
3. 允许的源: `*` 或你的域名

**NewAPI**：
```bash
docker run -d -p 3000:3000 \
  calciumion/new-api
```

### 方案3：浏览器插件绕过CORS（仅开发）

⚠️ **仅用于本地开发测试**

Chrome插件：
- [Allow CORS](https://chrome.google.com/webstore/detail/allow-cors)
- [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock)

安装后启用插件即可。**不要在生产环境使用！**

### 方案4：自建后端中转（不推荐）

如果必须使用不支持CORS的API，可以保留Next.js API路由：

1. 保留 `src/app/api/agent-debug/chat/route.ts`
2. 修改 `src/lib/api.ts`，改回调用 `/api/agent-debug/chat`
3. 在后端路由中调用AI服务

**缺点**：
- 速度慢（多一层中转）
- Vercel Serverless函数有超时限制（最多5分钟）
- 消耗Vercel资源

## 🌍 混合内容限制

### 问题说明

HTTPS网站无法请求HTTP API（浏览器安全策略）。

```
❌ https://your-app.vercel.app → http://localhost:11434 (本地Ollama)
✅ http://localhost:3000 → http://localhost:11434
```

### 解决方案

1. **本地开发**：使用 `http://localhost:3000` 访问
2. **生产环境**：确保API也是HTTPS
3. **自签名证书**：为本地API配置HTTPS

## 📋 推荐配置

### 个人开发/学习

```
API: OpenAI官方 或 DeepSeek
优势: 直接使用，无需配置
速度: 快
```

### 团队/企业

```
方案: 自建OneAPI/NewAPI代理
优势: 
- 统一管理API Key
- 成本控制和统计
- 支持多种模型切换
速度: 较快（国内服务器）
```

### 本地模型

```
方案: Ollama + OneAPI代理
配置:
1. 启动Ollama
2. 部署OneAPI，配置Ollama通道
3. OneAPI启用CORS
4. 使用OneAPI地址
```

## ⚡ 性能对比

| 方案 | 延迟 | 稳定性 | 部署难度 |
|------|------|--------|----------|
| 直接调用OpenAI | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| OneAPI代理 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Next.js中转 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 浏览器插件 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

## 🔗 相关链接

- [OneAPI项目](https://github.com/songquanpeng/one-api)
- [NewAPI项目](https://github.com/Calcium-Ion/new-api)
- [CORS详解](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [Fetch API文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)

## ❓ 常见问题

### Q: 为什么我的API调用失败？

**A**: 检查：
1. API地址是否正确（必须包含 `/v1`）
2. API Key是否有效
3. 浏览器控制台是否有CORS错误
4. API服务是否支持CORS

### Q: 如何知道是CORS问题？

**A**: 打开浏览器控制台（F12），如果看到：
```
Access to fetch at 'xxx' from origin 'xxx' has been blocked by CORS policy
```
就是CORS问题。

### Q: Vercel部署后能用吗？

**A**: 可以！只要：
1. 使用支持CORS的API（如OpenAI官方）
2. API是HTTPS协议
3. 在界面配置API密钥

### Q: 本地开发能连接本地Ollama吗？

**A**: 可以，但需要：
1. 使用 `http://localhost:3000` 访问（不要用https）
2. Ollama启用CORS：
   ```bash
   OLLAMA_ORIGINS=* ollama serve
   ```
3. 或使用OneAPI代理Ollama

## 💡 最佳实践

1. **生产环境**：使用HTTPS的AI服务API
2. **本地开发**：可以用HTTP访问本地API
3. **API密钥**：不要提交到代码仓库
4. **代理服务**：OneAPI/NewAPI适合团队使用
5. **直接调用**：个人使用推荐直接调用OpenAI
