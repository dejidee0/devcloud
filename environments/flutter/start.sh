#!/usr/bin/env bash
set -euo pipefail
mkdir -p /workspace
export PATH="$PATH:/opt/flutter/bin"
exec code-server --bind-addr 0.0.0.0:8443 --auth none /workspace
