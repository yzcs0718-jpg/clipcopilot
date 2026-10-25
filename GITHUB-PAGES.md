# GitHub Pages 发布

本仓库为 yzcs0718-jpg/clipcopilot，静态站点位于 dist。

进入 Settings → Pages → Build and deployment → Source，选择 GitHub Actions。随后在 Actions 中重新运行 Publish ClipPilot 工作流。只有工作流部署成功后，GitHub Pages 才算上线。

预计网址：https://yzcs0718-jpg.github.io/clipcopilot/ （尚未确认部署成功）。

Python 本地模型服务不能运行在 GitHub Pages；需下载本地版在电脑运行。云模型调用默认关闭。大型源码/本地发行包从现有公开站点下载，不将发行 ZIP 重复提交到本仓库。
