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

## Malware scanning — implemented, OFF by default

A real ClamAV scanner is wired. It is **disabled until clamd is deployed**, and
nothing treats a file as safe until the scanner has actually returned `CLEAN`.

- `MalwareScanService` is the contract. Its verdicts keep the honest distinction
  that matters: `UNAVAILABLE` (no scanner) and `ERROR` (scan failed) are **not**
  `CLEAN`.
- `ClamAvScanService` speaks clamd's INSTREAM protocol over TCP. Self-hosted and
  free — chosen over a paid SaaS scanner. Enabled by
  `seedha.files.clamav.enabled=true`. The socket transport is injected in tests,
  so framing and verdict parsing are unit-tested without a running daemon
  (`MalwareScanTests`).

**The pipeline, for the direct-upload route** (`POST /api/v2/files/upload`):

```
UPLOAD → validate (MIME + extension + size)
       → magic-byte inspection
       → MALWARE SCAN (bytes in hand)
          ├─ INFECTED  → 422, audited, nothing stored
          ├─ CLEAN     → scan_status = CLEAN, stored
          └─ UNAVAILABLE/ERROR
               ├─ private folder + seedha.files.scan.require-for-private=true
               │      → 503, refused (fail closed)
               └─ otherwise → scan_status = PENDING, stored for async re-scan
```

- `stored_files.scan_status` defaults to `NOT_SCANNED` and never silently
  becomes `CLEAN`.
- `seedha.files.scan.require-for-private` (default `false`) is the fail-closed
  switch. Turn it on once clamd is deployed.

**Detection is never claimed to be complete.** ClamAV catches known signatures;
it is a layer, not a guarantee.

**The presigned direct-to-S3 route** does not route bytes through the app, so
scanning there is an async post-upload step: an S3 `ObjectCreated` event enqueues
the key, a worker scans and writes `scan_status`, and `INFECTED` flips `status`
to `QUARANTINED`. That worker is the remaining piece — the schema, the service
and the config are in place for it.
