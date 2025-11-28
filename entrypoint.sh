#!/bin/sh
set -e

cat <<EOF > /app/public/runtime-config.js
window.__ENV = {
  
  PYTHON_BACKEND_URL: "${PYTHON_BACKEND_URL}"
};
EOF

node server.js
