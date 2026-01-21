# GitHub Pages 部署配置说明

## 如何在 GitHub 上配置 GitHub Pages

按照以下步骤将您的项目部署到 GitHub Pages：

### 1. 启用 GitHub Actions（如果尚未启用）

1. 在您的 GitHub 仓库中，转到 "Settings"（设置）选项卡
2. 在左侧菜单中找到 "Actions"（操作）-> "General"（常规）
3. 在 "Workflow permissions"（工作流权限）部分，选择：
   - "Read and write permissions"（读取和写入权限）
   - 勾选 "Allow GitHub Actions to create and approve pull requests"（允许 GitHub Actions 创建和批准拉取请求）
4. 点击 "Save"（保存）按钮

### 2. 配置 GitHub Pages

1. 在您的 GitHub 仓库中，转到 "Settings"（设置）选项卡
2. 在左侧菜单中向下滚动到 "Pages"（页面）部分
3. 在 "Source"（源）下拉菜单中，选择：
   - Branch: `gh-pages`
   - Folder: `/ (root)` 或 `/aurora-player` （根据需要选择）
4. 点击 "Save"（保存）按钮

### 3. 确保工作流文件已存在

本项目已经包含了 GitHub Actions 工作流文件：
- 文件路径：`.github/workflows/gh-pages.yml`

该工作流会在以下情况下自动运行：
- 推送到 `main` 分支时
- 创建 Pull Request 到 `main` 分支时

### 4. 验证部署

1. 转到仓库的 "Actions"（操作）标签页
2. 您应该能看到名为 "Deploy to GitHub Pages" 的工作流正在运行或已完成
3. 部署完成后，您可以在 "Settings" -> "Pages" 中看到部署状态
4. 页面将在以下 URL 可访问：
   - `https://<your-username>.github.io/<repository-name>/`
   - 例如，如果您的仓库名为 `aurora-player`，则地址为：
     `https://mitkimi.github.io/aurora-player`

### 5. 自定义域名（可选）

如果您想使用自定义域名：

1. 在仓库根目录创建或编辑 `public/CNAME` 文件
2. 添加您的自定义域名，例如：`myplayer.example.com`
3. 在 GitHub 仓库的 "Settings" -> "Pages" 部分输入相同的域名

### 6. 故障排除

如果部署失败，请检查：

1. 确保 `package.json` 中的 `homepage` 字段设置为 `/aurora-player`
2. 确保工作流有适当的权限
3. 检查 "Actions" 标签页中的错误日志
4. 确保构建脚本能够成功运行
5. 如果遇到依赖安装问题，请参考下方详细说明

### 依赖安装问题

如果工作流在依赖安装步骤失败，并显示关于 package-lock.json 同步的错误，这表明 package.json 和 package-lock.json 之间存在不匹配。

**症状：**
```
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync. Please update your lock file with `npm install` before continuing.
```

**解决方案：**
在本地运行 `npm install` 来更新 package-lock.json 文件，然后将更新后的文件提交到仓库。

### 7. 手动触发部署

如果需要手动触发部署，您可以：

1. 提交任何更改到 `main` 分支
2. 或者在 GitHub 上创建一个新的发布版本
3. 或者通过 GitHub API 触发工作流

---

**注意**：确保您的仓库是公开的，以便 GitHub Pages 能够正常工作。如果仓库是私有的，您需要升级到付费账户才能使用私有仓库的 GitHub Pages 功能。