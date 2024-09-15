---
title: "Kafka Patterns for Event-Driven Architecture"
description: "Practical patterns for building event-driven systems with Apache Kafka, including partitioning strategies, consumer group design, and handling failures gracefully."
pubDate: 2024-09-15
tags: ["kafka", "backend", "architecture", "distributed-systems"]
draft: false
---

After running Kafka in production across several projects, I've collected a set of patterns that consistently help teams avoid common pitfalls. This post covers the ones that matter most.

## The Core Mental Model

Kafka is an append-only distributed log. Producers write events to topics, consumers read them at their own pace. Unlike traditional message queues, messages aren't deleted after consumption — they're retained based on time or size policies.

This changes how you think about messaging:

- **Replay is a feature.** Made a bug in your consumer? Fix it, reset the offset, and reprocess.
- **Multiple consumers, one stream.** Different services can read the same topic independently via consumer groups.
- **Ordering is per-partition.** Within a partition, messages are strictly ordered. Across partitions, there's no ordering guarantee.

## Partitioning Strategy

The partition key determines which partition a message lands in. Getting this right is critical:

```python
# Order events keyed by order_id — all events for one order
# go to the same partition, preserving causal ordering.
producer.send(
    "order-events",
    key=order_id.encode(),
    value=json.dumps(event).encode(),
)
```

**Rules of thumb:**

- Key by the entity that needs ordered processing (e.g., `user_id`, `order_id`).
- Avoid high-cardinality keys that create hot partitions. If one customer generates 80% of traffic, you'll bottleneck a single partition.
- Don't use random keys unless you truly don't care about ordering — you lose the ability to reason about event sequences.

## Consumer Group Design

Each partition is assigned to exactly one consumer within a group. This gives you parallelism with ordering guarantees:

```
Topic: order-events (6 partitions)
Consumer Group: order-processor

  Consumer A → Partitions 0, 1
  Consumer B → Partitions 2, 3
  Consumer C → Partitions 4, 5
```

Scaling up? Add consumers (up to the partition count). Scaling down? Kafka rebalances automatically. But rebalances are expensive — they pause processing while partitions are reassigned.

To minimize rebalance impact:

- Use **cooperative sticky rebalancing** (available since Kafka 2.4) instead of eager rebalancing.
- Set `session.timeout.ms` and `heartbeat.interval.ms` appropriately — too aggressive and you trigger unnecessary rebalances.
- Keep consumer processing fast. If processing takes longer than `max.poll.interval.ms`, Kafka assumes the consumer is dead and triggers a rebalance.

## Idempotent Consumers

Kafka guarantees at-least-once delivery. Your consumers will see duplicate messages — during rebalances, network retries, or producer retries. Design for idempotency:

```python
async def handle_order_event(event: OrderEvent, db: AsyncSession):
    # Check if we've already processed this event
    existing = await db.execute(
        select(ProcessedEvent).where(
            ProcessedEvent.event_id == event.event_id
        )
    )
    if existing.scalar_one_or_none():
        return  # Already processed, skip

    # Process the event and record it atomically
    async with db.begin():
        await process_order(event, db)
        db.add(ProcessedEvent(event_id=event.event_id))
```

The deduplication check and business logic must be in the same transaction. Otherwise, you can process an event, crash before recording it, and process it again on restart.

## Dead Letter Topics

Not every message can be processed successfully. Rather than blocking the consumer or silently dropping failures, route them to a dead letter topic:

```python
async def consume_with_dlq(consumer, dlq_producer):
    for message in consumer:
        try:
            await process(message)
        except RetryableError:
            raise  # Let the consumer retry
        except Exception as e:
            # Non-retryable failure — send to DLQ
            await dlq_producer.send(
                "order-events.dlq",
                key=message.key,
                value=message.value,
                headers=[
                    ("original-topic", b"order-events"),
                    ("error", str(e).encode()),
                    ("failed-at", datetime.utcnow().isoformat().encode()),
                ],
            )
```

Include enough context in the DLQ message to debug and replay later. The headers above tell you where the message came from, what went wrong, and when it failed.

## Schema Evolution

As your system grows, event schemas change. Use a schema registry (Confluent Schema Registry or Apicurio) with Avro or Protobuf:

- **Backward compatible** changes (adding optional fields) let new consumers read old messages.
- **Forward compatible** changes (removing optional fields) let old consumers read new messages.
- **Full compatibility** supports both directions.

If you're using JSON without a schema registry, at minimum version your events:

```json
{
  "event_type": "order.created",
  "version": 2,
  "data": { ... }
}
```

Consumers can then branch on version and handle each format explicitly.

## Monitoring What Matters

The single most important Kafka metric is **consumer lag** — the difference between the latest produced offset and the consumer's committed offset. Rising lag means your consumers can't keep up.

Set alerts on:

- **Consumer lag** per partition (absolute and rate of change)
- **Under-replicated partitions** (indicates broker health issues)
- **Request latency** at the 99th percentile for both produce and fetch
- **Consumer group state** (rebalancing too frequently suggests instability)

Kafka's built-in JMX metrics combined with Prometheus and Grafana give you solid observability. For consumer lag specifically, Burrow is purpose-built and worth running alongside your cluster.

## Start Simple

Event-driven architecture adds complexity. Start with direct service-to-service calls, and introduce Kafka when you have a concrete need: decoupling deployment cycles, handling traffic spikes with backpressure, or enabling event sourcing.

When you do adopt Kafka, these patterns will help you avoid the sharp edges.
