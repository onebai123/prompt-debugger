# Vercel 部署指南

## 📦 一键部署

### 方式1：直接部署（最快）

点击下方按钮即可一键部署到Vercel：

[![部署到 Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fonebai123%2Fprompt-debugger)

### 方式2：Fork后部署（推荐）

1. **Fork项目**
   - 访问 https://github.com/onebai123/prompt-debugger
   - 点击右上角 "Fork" 按钮
   - Fork到你的GitHub账号

2. **导入到Vercel**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择你Fork的 `prompt-debugger` 项目
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: Next.js（自动识别）
   - **Root Directory**: ./（默认）
   - **Build Command**: `yarn build`（自动识别）
   - **Output Directory**: `.next`（自动识别）

4. **配置环境变量（可选）**
   
   在 "Environment Variables" 部分添加：
   
   ```bash
   # API配置（可选，推荐在界面配置）
   NEXT_PUBLIC_API_BASE_URL=https://api.openai.com/v1
   NEXT_PUBLIC_TEST_MODEL=deepseek-v3
   NEXT_PUBLIC_EVAL_MODEL=gpt-4o
   
   # 不建议在此配置API KEY，请在部署后的界面中配置
   ```

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待3-5分钟完成部署
   - 部署成功后会显示访问链接

## ⚙️ 部署后配置

### 1. 访问应用

部署成功后，Vercel会提供三个域名：
- **Production**: `https://your-project.vercel.app`
- **Preview**: 每次PR会自动生成预览链接
- **Development**: 本地开发环境

### 2. 配置API密钥

**重要：不建议在Vercel环境变量中配置API密钥**

推荐方式：
1. 打开部署的应用
2. 点击右上角 ⚙️ 配置按钮
3. 填写 API 配置：
   - API Base URL: `https://api.openai.com/v1`
   - API Key: 你的API密钥
   - 测试模型: `deepseek-v3`
   - 评估模型: `gpt-4o`
4. 点击保存

配置会保存在浏览器LocalStorage中，更加安全。

### 3. 自定义域名（可选）

1. 在Vercel项目设置中选择 "Domains"
2. 添加你的自定义域名
3. 按提示配置DNS记录
4. 等待DNS生效（通常5-30分钟）

## 🔄 持续集成

Fork方式的优势是可以跟踪上游更新：

### 同步上游更新

1. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/onebai123/prompt-debugger.git
   git fetch upstream
   ```

2. **合并更新**
   ```bash
   git checkout main
   git merge upstream/main
   git push origin main
   ```

3. **自动部署**
   - 推送到GitHub后，Vercel会自动部署
   - 通常1-3分钟内完成

### GitHub Actions（可选）

项目包含自动化工作流，会在PR和Push时自动运行测试。

## 📊 监控与分析

Vercel提供内置的分析功能：

### 1. Analytics（分析）
- 访问量统计
- 用户地理分布
- 设备分析

### 2. Speed Insights（性能）
- 页面加载速度
- Core Web Vitals
- 性能建议

### 3. Logs（日志）
- 实时日志查看
- 错误追踪
- API调用监控

## 🔧 高级配置

### 环境变量管理

Vercel支持三种环境：
- **Production**: 生产环境
- **Preview**: 预览环境（PR/分支）
- **Development**: 开发环境

可以为不同环境设置不同的变量。

### 区域设置

在 `vercel.json` 中配置：

```json
{
  "regions": ["sin1"]  // 新加坡节点（亚洲用户最快）
}
```

可选区域：
- `sin1`: 新加坡
- `hnd1`: 日本东京
- `iad1`: 美国弗吉尼亚
- `sfo1`: 美国旧金山

### 性能优化

1. **启用边缘缓存**
   - Vercel自动启用CDN缓存
   - 静态资源全球加速

2. **图片优化**
   - 使用Next.js Image组件
   - 自动WebP转换

3. **代码分割**
   - Next.js自动代码分割
   - 按需加载组件

## ❓ 常见问题

### Q: 部署失败怎么办？

**A**: 检查以下几点：
1. package.json中的依赖是否完整
2. Build Command是否正确（`yarn build`）
3. Node.js版本是否兼容（推荐18.x）
4. 查看Vercel部署日志中的错误信息

### Q: API调用失败？

**A**: 可能原因：
1. API密钥未配置或错误
2. API地址不正确
3. 浏览器CORS限制
4. API服务商限流

解决方案：
- 检查API配置
- 使用支持CORS的API端点
- 考虑使用代理服务

### Q: 如何回滚版本？

**A**: 
1. 在Vercel Dashboard找到历史部署
2. 点击三点菜单
3. 选择 "Promote to Production"
4. 即可回滚到该版本

### Q: 如何删除项目？

**A**:
1. Vercel Dashboard → 项目设置
2. 滚动到底部 "Delete Project"
3. 输入项目名确认删除

## 💡 最佳实践

1. **Fork后部署**: 便于跟踪更新
2. **配置域名**: 使用自定义域名更专业
3. **启用HTTPS**: Vercel自动配置SSL
4. **监控日志**: 定期检查错误日志
5. **测试Preview**: PR时自动部署预览版本
6. **环境分离**: Production和Preview使用不同配置

## 🔗 相关链接

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel CLI 工具](https://vercel.com/docs/cli)

## 📞 需要帮助？

- 提交 [Issue](https://github.com/onebai123/prompt-debugger/issues)
- 查看 [讨论区](https://github.com/onebai123/prompt-debugger/discussions)
- 阅读 [完整文档](README.md)
