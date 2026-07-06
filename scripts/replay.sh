#!/usr/bin/env bash
# one-command judge demo: replays a finished match through the live pipeline at 10x
curl -X POST "$API/admin/replay" -d '{"match_id":"'$1'","speed":10}' -H 'content-type: application/json'
