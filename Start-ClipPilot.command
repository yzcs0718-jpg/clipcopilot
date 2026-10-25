#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
python3 tools/local_app.py --enable-local-ai
read -r -p '按回车关闭窗口'
