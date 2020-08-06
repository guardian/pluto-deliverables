#!/usr/bin/env bash

docker network ls | grep pluto-deliverables
if [ "$?" != "0" ]; then
    docker network create pluto-deliverables
fi

docker ps | grep deliverables-rabbitmq
if [ "$?" == "0" ]; then
    docker rm deliverables-rabbitmq
fi

docker volume ls | grep rabbitmq-deliv-mnesia
if [ "$?" != "0" ]; then
  docker volume create rabbitmq-deliv-mnesia
fi

#Port 5672 is AMQP messaging, port 15672 is http management interface
docker run --rm -p 5672:5672 -p 15672:15672 --network pluto-deliverables --name deliverables-rabbitmq --env-file=docker_rabbitmq.env -v rabbitmq-deliv-mnesia:/var/lib/rabbitmq/mnesia rabbitmq:3.8-management-alpine