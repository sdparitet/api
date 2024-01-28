#!/bin/bash
docker compose down -v
docker volume prune -f
docker container prune -f
docker image prune -f
docker compose up --pull always --force-recreate -d
docker compose logs --tail 500 -f
