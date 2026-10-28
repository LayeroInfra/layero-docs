---
sidebar_position: 4.5
title: Files
description: The database's file storage — buckets, policies on storage.objects, signed URLs and limits. Compatible with supabase.storage.
---

# Files

:::info[Beta]

Data API is in beta and available on the Pro plan. What to expect from
these pages is covered in [What Data API Is](./index.md).

:::

Files live at the same address as the Data API: `https://data.layero.ru/<database>/storage/v1`.
The `storage` schema is built as in Supabase — the `storage.buckets` and
`storage.objects` tables, the `storage.foldername()` function — so
`supabase.storage` and a migrated project's policies work unchanged. The bytes
live in object storage; the database holds only the file's row, and that row
decides who may touch the file.

## Turn it on

```bash
npx layero@latest data enable --db <database> --storage
```

Or in the panel: "Databases" → the database → "Files" → "Enable files".

A bucket is created there too ("Add bucket"): name, public or private, a file
size limit and allowed types (`image/jpeg, image/png`). From server code —
`supabase.storage.createBucket()` with the secret key.

## Public and private buckets

| Bucket | Read | Write and delete |
|---|---|---|
| public | anyone, by the direct link `…/storage/v1/object/public/<bucket>/<path>` | by policies |
| private | by policies or by a signed URL | by policies |

A new bucket is closed until it has policies: without them only the secret key
can read and write its files.

## Policies on `storage.objects`

Each action checks its own policy — as in Supabase:

| Action | Policy needed |
|---|---|
| upload (`upload`) | `INSERT` |
| overwrite (`upload` with `upsert: true`) | `INSERT`, `SELECT` and `UPDATE` |
| read, download, a signed read URL | `SELECT` |
| move (`move`) | `SELECT` and `UPDATE` |
| copy (`copy`) | `SELECT` on the source and `INSERT` on the new path |
| delete | `DELETE` |
| upload URL (`createSignedUploadUrl`) | `INSERT` — checked when the URL is issued |

The table privilege is needed too, but it opens only what the policy lets
through. Don't grant `ALL ON storage.objects` to guests: the table is shared by
every bucket of the database.

### Each user in their own folder

```sql
GRANT SELECT, INSERT, DELETE ON storage.objects TO authenticated;

CREATE POLICY "own files: read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own files: upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own files: delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

```js
await db.storage.from("avatars").upload(`${user.id}/photo.jpg`, file);
```

### A guest uploads but can't read

A feedback form with a screenshot: the guest puts the file into a private
bucket, only the site owner reads it.

```sql
GRANT INSERT ON storage.objects TO anon;

CREATE POLICY "guest uploads a screenshot" ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'screenshots' AND (storage.foldername(name))[1] = 'reports');
```

The guest has no read policy — and a plain upload doesn't need one. Better have
the intake function hand out the path (a random name inside the submission's
folder) than take it from the guest.

## Signed URLs

```js
// a download URL for 10 minutes — needs SELECT by policy
const { data } = await db.storage.from("screenshots").createSignedUrl(path, 600);

// an upload URL — the browser puts the file without knowing a key; INSERT is checked now
const { data: up } = await db.storage.from("uploads").createSignedUploadUrl(path);
await db.storage.from("uploads").uploadToSignedUrl(path, up.token, file);
```

A signed URL works without a key until it expires; after that the gateway
answers `400 InvalidJWT`. The path inside the URL can't be swapped.

## Check access without signing in as the user

```bash
# which files of the bucket the user sees
npx layero@latest data probe POST /storage/v1/object/list/screenshots --as user --user <id>
# may a guest upload here (no file is written — the INSERT policy is checked)
npx layero@latest data probe POST /storage/v1/object/upload/sign/screenshots/reports/test.jpg
```

The file probe writes nothing: it doesn't perform a real upload or delete,
because bytes can't be rolled back.

## Limits

| What | Value |
|---|---|
| File | up to 50 MB on any plan; less if the bucket limit says so |
| File space per database | Free — 1 GB, Pro — up to 100 GB |
| Not available | image transformations, resumable upload, the S3 protocol |

File requests count toward the database's daily request limit — see [What's Missing](./limits.md).
