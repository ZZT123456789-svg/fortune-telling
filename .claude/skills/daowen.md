---
name: daowen
description: 恢复道问项目上下文，继续开发算命网站
---

# 道问项目 Skill

执行此 skill 时，先读取项目记忆文件恢复上下文：

1. 读取 `C:\Users\Administrator\.claude\projects\C--Users-Administrator\memory\project-daowen.md`
2. 读取 `C:\Users\Administrator\fortune-telling\index.html` 了解当前页面结构
3. 恢复以下关键信息：
   - 本地路径: `C:\Users\Administrator\fortune-telling\`
   - GitHub: `https://github.com/ZZT123456789-svg/fortune-telling`
   - 线上: `https://zzt123456789-svg.github.io/fortune-telling/`
   - Git路径: `C:\Program Files\Git\bin\git.exe`
   - SSH: `git@github.com:ZZT123456789-svg/fortune-telling.git`

## 常用操作

- 打开网站: `Start-Process "https://zzt123456789-svg.github.io/fortune-telling/"`
- Push代码: 用完整git路径 + add + commit + push
- 修改文件: 用 Edit 工具，禁止用 PowerShell Set-Content（会破坏UTF-8编码）
