---
title: "Building REST APIs with FastAPI"
description: "A practical walkthrough of building production-grade REST APIs with FastAPI, covering project structure, validation, dependency injection, and async patterns."
pubDate: 2024-09-12
tags: ["python", "fastapi", "backend", "api"]
draft: false
---

FastAPI has become my default choice for Python APIs. It's fast to develop with, fast at runtime, and the automatic OpenAPI docs mean you spend less time writing API documentation.

## Why FastAPI Over Flask or Django REST Framework?

The short answer: type hints as the single source of truth. FastAPI uses Python type annotations for request validation, serialization, and documentation — all from the same code.

```python
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

class PostCreate(BaseModel):
    title: str
    content: str
    tags: list[str] = []

class PostResponse(PostCreate):
    id: int
    created_at: datetime

@app.post("/posts", response_model=PostResponse, status_code=201)
async def create_post(post: PostCreate):
    # Validation happens automatically from the type hints.
    # Invalid requests get a 422 with detailed error messages.
    return await save_post(post)
```

With Flask, you'd need separate libraries for validation (marshmallow or cerberus), serialization, and docs (flasgger). FastAPI bundles all of this into the framework itself.

## Project Structure

For anything beyond a toy project, I structure FastAPI apps like this:

```
src/
├── main.py              # App factory & middleware
├── config.py            # Settings via pydantic-settings
├── models/              # SQLAlchemy / ORM models
├── schemas/             # Pydantic request/response models
├── routers/             # Route handlers, grouped by domain
├── services/            # Business logic
├── dependencies/        # FastAPI dependency functions
└── middleware/           # Custom middleware
```

The key principle: **routers are thin**. They handle HTTP concerns (parsing requests, returning responses) and delegate to services for business logic. This keeps the code testable — services can be tested without spinning up an HTTP server.

## Dependency Injection

FastAPI's dependency injection system is one of its best features. It lets you declare what a route handler needs, and the framework provides it:

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

@app.get("/posts/{post_id}")
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404)
    return post
```

Dependencies can depend on other dependencies, forming a graph that FastAPI resolves automatically. This is how you'd layer authentication on top of database access without coupling them.

## Async All the Way

FastAPI runs on ASGI (via Uvicorn or Hypercorn), so async handlers are first-class:

```python
import httpx

@app.get("/external-data")
async def fetch_external():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
        return response.json()
```

For CPU-bound work, FastAPI automatically runs synchronous handlers in a thread pool, so you don't block the event loop. But for I/O-bound operations — database queries, HTTP calls, file reads — async handlers give you significantly better throughput.

## Testing

Testing FastAPI is clean thanks to the `TestClient` (sync) or `httpx.AsyncClient` (async):

```python
import pytest
from httpx import AsyncClient
from src.main import app

@pytest.mark.anyio
async def test_create_post():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/posts", json={
            "title": "Test Post",
            "content": "Some content",
        })
    assert response.status_code == 201
    assert response.json()["title"] == "Test Post"
```

The app runs in-process without a real server, so tests are fast and deterministic.

## Production Checklist

Before deploying, there are a few things I always set up:

- **CORS middleware** for frontend clients
- **Rate limiting** via slowapi or a reverse proxy
- **Structured logging** with structlog, outputting JSON in production
- **Health check endpoint** returning dependency status (database, cache, external services)
- **Graceful shutdown** handling for long-running requests

FastAPI makes the path from prototype to production shorter than any other Python framework I've used. The type-driven approach catches entire categories of bugs at development time, and the async foundation means you can handle real traffic without reaching for Go or Rust.
