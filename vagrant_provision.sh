#!/usr/bin/env bash

cat > /etc/default/locale <<EOL
LANG=en_US.UTF-8
LC_ALL="en_US.UTF-8"
LANGUAGE=en_US.UTF-8
LC_CTYPE=UTF-8
EOL

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export LANGUAGE=en_US.UTF-8
export LC_CTYPE=UTF-8

locale-gen en_US.UTF-8

apt-get update
apt-get install -y npm

ln -s /usr/bin/nodejs /usr/bin/node
