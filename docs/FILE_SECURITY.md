# File & document security

How uploaded content is handled across the web backend (`src/server/storage.ts`,
`src/routes/api/v2/media/*`) and the Java backend
(`StorageService`, `MediaController`). Both enforce the same policy table; a rule
that holds on only one of them is not a rule, because the web app and the Flutter
app do not use the same backend.

## Folder policy

The **folder decides everything**. The client picks a folder name; it does not
pick a bucket, a privacy level, or a size ceiling. An unrecognised folder is
rejected rather than defaulted, so there is no way to land a file in the public
bucket by inventing a folder.

| Folder                 | Bucket  | MIME allowed    | Extensions           | Max   |
| ---------------------- | ------- | --------------- | -------------------- | ----- |
| `property-photos`      | public  | jpeg, png, webp | jpg, jpeg, png, webp | 10 MB |
| `property-videos`      | public  | mp4, webm       | mp4, webm            | 50 MB |
| `kyc-documents`        | private | jpeg, png, pdf  | jpg, jpeg, png, pdf  | 10 MB |
| `rental-agreements`    | private | pdf             | pdf                  | 10 MB |
| `supporting-documents` | private | pdf, jpeg, png  | pdf, jpg, jpeg, png  | 10 MB |

Extension **and** declared MIME must both pass. Checking only the MIME let a file
be stored as `payload.svg` or `payload.html` with `Content-Type: image/jpeg`; an
object served back under its stored name is what turns that into stored XSS.
SVG is not accepted anywhere — it is a script container, and nothing in the
product needs it.

## Object keys

Keys are generated server-side:

```
{folder}/{authenticated user id}/[{entity id}/]{uuid}.{validated extension}
```

The submitted filename contributes nothing but a validated extension, so `../`,
absolute paths and encoded segments cannot appear in a key. Downloads
additionally reject any key containing `..`, `//`, `%`, a leading `/`, or fewer
than three segments before it is signed.

## Authorization

- **Upload**: authentication is required. When an `entity_id` is supplied the
  caller must own the property, or be a party to the rental agreement — an
  unknown id is refused, not ignored.
- **Download**: private objects are reachable only through a 5-minute pre-signed
  GET. The owner is read from `stored_files` when a row exists and from the key's
  user segment otherwise; a caller who is neither the owner nor an admin never
  receives a signature. Every grant and denial is written to the security audit
  log — the signed URL itself never is, because for five minutes it _is_ the
  credential.
- Private buckets are written with `ServerSideEncryption: AES256`.

## The `stored_files` ledger

`scripts/migrations/005_document_file_security.sql`. One row per pre-signed
object. It exists because a key string alone cannot answer "who owns this",
"was this ever actually uploaded", or "has this been deleted".

- `status`: `PENDING_UPLOAD` → `ACTIVE` | `QUARANTINED` | `DELETED`
- `deleted_at`: soft delete, so the row survives as an audit record after the
  S3 object is removed
- **Orphan cleanup**: a `PENDING_UPLOAD` row older than the 5-minute URL life had
  no upload behind it. `idx_stored_files_pending` is the index for that sweep.

## Malware scanning — NOT IMPLEMENTED

**No malware scanning runs today.** `scan_status` defaults to `NOT_SCANNED` and
nothing in the platform may treat a file as clean on the strength of that value.

The column exists so a scanner can be added without touching the storage design.
The intended integration, when it is built:

1. Client PUTs to the pre-signed URL.
2. An S3 `ObjectCreated` event enqueues the key.
3. A worker scans it (ClamAV in the async worker is the free option; a managed
   scanner is the paid one) and writes `scan_status` = `CLEAN` | `INFECTED`.
4. `INFECTED` sets `status` = `QUARANTINED`; download pre-signing refuses
   anything not `CLEAN`.

Step 4 is the only part that changes existing code, and it is one condition in
`MediaController.getPresignDownloadUrl`.

Magic-byte validation is likewise **not** performed: the client uploads straight
to S3, so no byte of the file passes through the application. It belongs in the
same post-upload worker as the scanner.
