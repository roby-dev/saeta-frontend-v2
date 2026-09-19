#!/bin/sh
set -eu

export PORT="${PORT:-8080}"

envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf

exec nginx -c /tmp/nginx.conf -g "daemon off;"
