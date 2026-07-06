# ADR 007 bus redis streams then kafka

Status: accepted. packages/bus abstracts publish/consume. Free tier: Redis Streams (same box as cache). Graduation trigger: >5k msg/s sustained or multi-node consumers → BUS_DRIVER=kafka (Redpanda Cloud). Topic names identical (packages/schema/topics.ts).
