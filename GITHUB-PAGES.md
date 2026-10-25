# GitHub Pages 发布

本仓库：yzcs0718-jpg/clipcopilot。静态入口：dist/index.html。

## 发布方式

Settings → Pages → Build and deployment → Source 选择 GitHub Actions。设置完成后，每次 main 分支推送会运行 Publish ClipPilot：先执行前端测试，再上传 dist 并部署。

部署状态在仓库 Actions 中查看。只有 configure-pages、upload-pages-artifact 和 deploy-pages 均成功后，才确认上线。失败时先检查具体步骤日志，再重试。

站点地址（部署成功后可访问）：https://yzcs0718-jpg.github.io/clipcopilot/

## 功能范围

GitHub Pages 托管静态网页。浏览器本地粗剪、候选分镜、SRT 对齐、教学动画示意与本地文件导出由前端执行。Python 本地视觉模型服务需下载本地版在自己的电脑运行，不能在 GitHub Pages 运行。云模型调用默认关闭。

大型本地发行包从现有公开站点下载；源码保留在本仓库，避免将发行 ZIP 重复提交。
