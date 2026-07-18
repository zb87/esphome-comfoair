#!/bin/bash

sudo docker run --rm --net=host \
  --user "$(id -u):$(id -g)" \
  -e PLATFORMIO_CORE_DIR=/config/.platformio \
  -e PLATFORMIO_GLOBALLIB_DIR=/config/.piolibs \
  -e HOME=/config \
  -v "${PWD}":/config \
  -it ghcr.io/esphome/esphome "$@"