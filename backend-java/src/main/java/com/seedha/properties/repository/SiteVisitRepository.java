package com.seedha.properties.repository;

import com.seedha.properties.entity.SiteVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisit, UUID> {
    List<SiteVisit> findBySeekerIdOrderByCreatedAtDesc(UUID seekerId);
    List<SiteVisit> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<SiteVisit> findByPropertyIdOrderByCreatedAtDesc(UUID propertyId);
}
