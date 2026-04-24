#!/bin/bash
sudo docker rm -f modeling_platform_front
sudo docker rmi -f modeling_platform_front
docker build -t modeling_platform_front .
docker run -p 9877:80 -d --name modeling_platform_front modeling_platform_front