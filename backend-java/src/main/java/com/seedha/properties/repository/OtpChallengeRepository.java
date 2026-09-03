package com.seedha.properties.repository;

import com.seedha.properties.entity.OtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, UUID> {

    Optional<OtpChallenge> findTopByContactAndPurposeAndIsConsumedFalseOrderByCreatedAtDesc(String contact, String purpose);

    long countByIpAddressAndCreatedAtAfter(String ipAddress, OffsetDateTime since);

    long countByContactAndCreatedAtAfter(String contact, OffsetDateTime since);

    List<OtpChallenge> findByContactAndPurposeAndIsConsumedFalse(String contact, String purpose);

    @Modifying
    @Query("UPDATE OtpChallenge o SET o.isConsumed = true, o.consumedAt = :now WHERE o.contact = :contact AND o.purpose = :purpose AND o.isConsumed = false")
    int invalidateExistingChallenges(@Param("contact") String contact, @Param("purpose") String purpose, @Param("now") OffsetDateTime now);
}
