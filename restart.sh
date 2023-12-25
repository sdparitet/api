#!/bin/bash
docker compose down -v
docker volume prune -f
docker container prune -f
docker image prune -f
docker compose up --force-recreate -d
docker compose logs --tail -f
