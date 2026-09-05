package com.seedha.properties.repository;

import com.seedha.properties.entity.PropertyManagementInternalNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyManagementInternalNoteRepository extends JpaRepository<PropertyManagementInternalNote, UUID> {

    List<PropertyManagementInternalNote> findByManagementRequestIdOrderByCreatedAtAsc(UUID managementRequestId);

    long countByManagementRequestId(UUID managementRequestId);
}
