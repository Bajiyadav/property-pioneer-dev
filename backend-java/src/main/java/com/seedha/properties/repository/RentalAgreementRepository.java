package com.seedha.properties.repository;

import com.seedha.properties.entity.RentalAgreement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RentalAgreementRepository extends JpaRepository<RentalAgreement, UUID> {
    List<RentalAgreement> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<RentalAgreement> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
