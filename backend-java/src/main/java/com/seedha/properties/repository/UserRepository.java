package com.seedha.properties.repository;

import com.seedha.properties.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findFirstByPhoneOrderByCreatedAtDesc(String phone);
    boolean existsByEmail(String email);
}
