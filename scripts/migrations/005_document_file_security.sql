-- ==============================================================================
-- Migration: 005_document_file_security.sql
-- Target:    staging (Neon). Production is migrated separately and explicitly.
--
-- Adds the file ledger that upload and download authorization is built on.
--
-- Why a ledger at all: object keys alone carried every fact about a file — who
-- owned it, whether it was private, what it belonged to. That made deletion,
-- orphan cleanup and access auditing impossible, and it made authorization a
-- string-parsing exercise. A row per object gives each of those a place to live.
--
-- Rollback: DROP TABLE public.stored_files;  -- additive migration, no existing
-- table or column is altered, so dropping it returns the schema to its prior
-- state. Uploaded S3 objects are unaffected either way.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.stored_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The uploading user. Every FK in this schema points at profiles, and
    -- users.id and profiles.id are the same identity space.
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    folder VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    object_key TEXT NOT NULL UNIQUE,
    content_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,

    -- Server-decided from the folder policy, never from the request.
    is_private BOOLEAN NOT NULL DEFAULT TRUE,

    entity_type VARCHAR(50),
    entity_id UUID,
    checksum_sha256 VARCHAR(64),

    -- PENDING_UPLOAD -> ACTIVE once the object is confirmed; DELETED is a soft
    -- delete so the row survives as an audit record after the object is removed.
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_UPLOAD',

    -- Integration point for a real scanner. NOT_SCANNED is the honest default:
    -- no malware scanning runs today, and nothing in the platform may treat a
    -- file as clean on the strength of this column until a scanner writes to it.
    scan_status VARCHAR(30) NOT NULL DEFAULT 'NOT_SCANNED',
    scanned_at TIMESTAMP WITH TIME ZONE,

    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT stored_files_status_check
        CHECK (status IN ('PENDING_UPLOAD', 'ACTIVE', 'QUARANTINED', 'DELETED')),
    CONSTRAINT stored_files_scan_status_check
        CHECK (scan_status IN ('NOT_SCANNED', 'PENDING', 'CLEAN', 'INFECTED', 'ERROR')),
    CONSTRAINT stored_files_size_check
        CHECK (file_size_bytes > 0 AND file_size_bytes <= 104857600)
);

-- Owner isolation: the lookup behind "list my documents" and behind download
-- authorization, so it is the one index that must exist.
CREATE INDEX IF NOT EXISTS idx_stored_files_owner_id
    ON public.stored_files(owner_id) WHERE deleted_at IS NULL;

-- Media for one listing / agreement.
CREATE INDEX IF NOT EXISTS idx_stored_files_entity
    ON public.stored_files(entity_type, entity_id) WHERE deleted_at IS NULL;

-- Orphan sweep: rows that were pre-signed but never confirmed uploaded.
CREATE INDEX IF NOT EXISTS idx_stored_files_pending
    ON public.stored_files(created_at) WHERE status = 'PENDING_UPLOAD';

-- object_key already carries a UNIQUE index, which serves key lookups.
