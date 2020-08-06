#!/usr/bin/env bash

docker network ls | grep pluto-deliverables
if [ "$?" != "0" ]; then
    docker network create pluto-deliverables
fi

docker ps | grep pluto-deliverables-db
if [ "$?" == "0" ]; then
    docker rm pluto-deliverables-db
fi

docker run --rm -p 5432:5432 --network pluto-deliverables --name pluto-deliverables-db --env-file docker_postgres.env postgres:9.6