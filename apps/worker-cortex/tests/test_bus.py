"""Bus wire-format round-trip (skips if Redis is unreachable, so the gate stays green without infra).
Proves the Python bus speaks the SAME XADD {key, data:<json>} contract as packages/bus."""
import json
import time

import pytest
import redis as _redis
from cortex.bus import Bus
from cortex.config import REDIS_URL


def _redis_up() -> bool:
    try:
        r = _redis.from_url(REDIS_URL, socket_connect_timeout=0.5)
        r.ping()
        return True
    except Exception:
        return False


@pytest.mark.skipif(not _redis_up(), reason="redis not reachable")
def test_publish_roundtrips_wire_format():
    bus = Bus()
    topic = f"cortex.test.{int(time.time() * 1000)}"
    env = {"type": "mark", "source": "cortex", "match_id": "1", "payload": {"fair": {"over": 0.4, "under": 0.6}}}
    try:
        bus.publish(topic, "1", env)
        entries = bus.r.xrange(topic)
        assert len(entries) == 1
        _id, fields = entries[0]
        assert (fields.get(b"key") or fields.get("key")) in (b"1", "1")
        data = fields.get(b"data") or fields.get("data")
        assert json.loads(data) == env
    finally:
        bus.r.delete(topic)
        bus.close()
