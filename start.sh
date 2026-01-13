#!/bin/sh
set -e

mkdir -p /run/nginx
uvicorn backend.app:app --host 0.0.0.0 --port 8000 &
nginx -g "daemon off;"
