package com.seedha.properties.repository;

import com.seedha.properties.entity.PropertyManagementRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyManagementRequestRepository extends JpaRepository<PropertyManagementRequest, UUID> {

    List<PropertyManagementRequest> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    Optional<PropertyManagementRequest> findFirstByPropertyIdAndStatusNotInOrderByCreatedAtDesc(
            UUID propertyId, Collection<String> terminalStatuses);

    boolean existsByPropertyIdAndStatusNotIn(UUID propertyId, Collection<String> terminalStatuses);

    Page<PropertyManagementRequest> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<PropertyManagementRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(String status);
}
