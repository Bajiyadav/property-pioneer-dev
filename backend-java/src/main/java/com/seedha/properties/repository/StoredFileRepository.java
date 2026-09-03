package com.seedha.properties.repository;

import com.seedha.properties.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {
    Optional<StoredFile> findByObjectKey(String objectKey);
    List<StoredFile> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<StoredFile> findByEntityTypeAndEntityId(String entityType, UUID entityId);
    long countByOwnerIdAndCreatedAtAfter(UUID ownerId, OffsetDateTime timestamp);
}
