package com.seedha.properties.repository;

import com.seedha.properties.entity.Enquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, UUID> {
    List<Enquiry> findBySeekerIdOrderByCreatedAtDesc(UUID seekerId);
    List<Enquiry> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<Enquiry> findByPropertyIdOrderByCreatedAtDesc(UUID propertyId);
}
