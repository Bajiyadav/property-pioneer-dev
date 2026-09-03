package com.seedha.properties.repository;

import com.seedha.properties.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.isRevoked = true, r.revokedAt = :revokedAt WHERE r.familyId = :familyId")
    void revokeFamily(@Param("familyId") UUID familyId, @Param("revokedAt") OffsetDateTime revokedAt);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.isRevoked = true, r.revokedAt = :revokedAt WHERE r.userId = :userId AND r.isRevoked = false")
    void revokeAllForUser(@Param("userId") UUID userId, @Param("revokedAt") OffsetDateTime revokedAt);

    @Modifying
    void deleteByTokenHash(String tokenHash);

    @Modifying
    void deleteByUserId(UUID userId);
}
