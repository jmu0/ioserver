#!/bin/bash
path="/var/local/node/ioserver"
mdkir -p $path
rsync -a --delete --verbose --progress * $path/
sudo cp $path/ioserver.service /usr/lib/systemd/system/
sudo systemctl restart ioserver
