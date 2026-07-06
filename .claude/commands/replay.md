---
description: Drive the replay demo for a match id
allowed-tools: Bash(bash:*), Bash(curl:*)
---
Run `bash scripts/replay.sh $ARGUMENTS`, then verify: ingest logs show bucket walking, prices.marks flowing, and WS frames ticking on m:$ARGUMENTS:prices. Report tick→frame latency you observe.
