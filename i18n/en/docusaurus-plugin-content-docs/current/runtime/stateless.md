---
sidebar_position: 3
title: Files and state
description: An app with a server has a temporary disk. What doesn't work because of that — writes to SQLite, file sessions, uploads to disk — and where to keep data, files and sessions.
---

# Files and state

**Everything an app with a server writes to disk is gone after a restart: after a new build and after a long idle period.**
Keep data in a database, files in storage, sessions in a cookie or in the
database.

## Why the disk is temporary

- After 48 hours without visitors the app is removed from the server, and the next start uses a clean image — see [Running and idling](./lifecycle.md).
  What was written to disk isn't kept.
- Every build runs in a new container with a clean disk. Don't count on a file surviving until tomorrow, even with steady traffic.

## What doesn't work

- **SQLite with writes**: the database lives only until a restart.
- **File databases** — `node-persist`, `lowdb`, `nedb` and the like.
- **Sessions in files** — `express-session` with FileStore, Flask file
  sessions and the like.
- **User uploads to disk**: the file is gone after a restart.

## What works

- **Read-only SQLite**, if the file is in the repository and ends up in the
  image.
- **An in-memory cache in the app**, while it runs.
- **Temporary files in `/tmp`** — an in-memory folder, up to 64 MB — for the data of a single request.

## Where to keep things

| What | Where |
|---|---|
| Data | a [Layero database](../database/index.md) — the platform passes the connection string in `LAYERO_DATABASE_URL` |
| Uploaded files | Data API [file storage](../data-api/storage.md) |
| Sessions | a token in a cookie or a sessions table in the database |
| Cache across restarts | a table in the database |
