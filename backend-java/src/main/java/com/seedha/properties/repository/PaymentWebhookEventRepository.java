package com.seedha.properties.repository;

import com.seedha.properties.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, UUID> {

    boolean existsByProviderAndEventId(String provider, String eventId);

    Optional<PaymentWebhookEvent> findByProviderAndEventId(String provider, String eventId);
}
