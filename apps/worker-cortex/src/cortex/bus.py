"""Redis Streams consumer/producer — the Python arm of packages/bus (ADR-022). SAME wire format as the TS
driver: XADD with fields {key, data:<json envelope>}, consumer groups for at-least-once. Per the architecture
law this is the ONLY module in cortex that speaks Redis; everything else goes through it."""
import json
import logging
import os
import socket
from collections.abc import Callable

import redis

from .config import REDIS_URL

MAXLEN = 100_000
log = logging.getLogger("cortex.bus")


class Bus:
    def __init__(self, url: str = REDIS_URL) -> None:
        self.r = redis.from_url(url)
        self._stop = False

    def publish(self, topic: str, key: str, env: dict) -> None:
        self.r.xadd(topic, {"key": key, "data": json.dumps(env)}, maxlen=MAXLEN, approximate=True)

    def _ensure_group(self, topic: str, group: str) -> None:
        try:
            self.r.xgroup_create(topic, group, id="0", mkstream=True)
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

    def consume(self, handlers: dict[str, Callable[[dict], None]], group: str, block_ms: int = 5000, count: int = 10) -> None:
        """handlers: {topic: fn(env)}. Reads all topics in one loop; acks after each handler. Runs until stop()."""
        for topic in handlers:
            self._ensure_group(topic, group)
        consumer = f"{socket.gethostname()}-{os.getpid()}"
        streams = {t: ">" for t in handlers}
        while not self._stop:
            try:
                resp = self.r.xreadgroup(group, consumer, streams, count=count, block=block_ms)
            except redis.exceptions.TimeoutError:
                continue  # redis-py 8.x surfaces an idle BLOCK window as a socket timeout — no entries, keep polling
            if not resp:
                continue
            for stream, entries in resp:
                topic = stream.decode() if isinstance(stream, bytes) else stream
                fn = handlers.get(topic)
                for entry_id, fields in entries:
                    data = fields.get(b"data") or fields.get("data")
                    try:
                        env = json.loads(data)
                        if fn:
                            fn(env)
                    except Exception as ex:  # a bad frame must never poison-loop the group
                        log.error(json.dumps({"evt": "cortex.consume.error", "topic": topic, "msg": str(ex)}))
                    self.r.xack(topic, group, entry_id)

    def stop(self) -> None:
        self._stop = True

    def close(self) -> None:
        self._stop = True
        try:
            self.r.close()
        except Exception:
            pass
