package com.seedha.properties.repository;

import com.seedha.properties.entity.HomeLoanEnquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HomeLoanRepository extends JpaRepository<HomeLoanEnquiry, UUID> {
    List<HomeLoanEnquiry> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<HomeLoanEnquiry> findByCityNameOrderByCreatedAtDesc(String cityName);
}
