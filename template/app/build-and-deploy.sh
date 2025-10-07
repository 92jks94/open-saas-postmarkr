#!/bin/bash
export PATH=$PATH:/home/nathah/.local/bin
cd /mnt/c/Users/natha/AppData/Local/Temp
wasp build
cd .wasp/build
flyctl deploy --config ../../fly-server.toml --app postmarkr-server --detach
