package com.seedha.properties.repository;

import com.seedha.properties.entity.PromotionOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PromotionOrderRepository extends JpaRepository<PromotionOrder, UUID> {

    Optional<PromotionOrder> findByGatewayOrderId(String gatewayOrderId);

    Optional<PromotionOrder> findFirstByPropertyIdAndStatusInOrderByCreatedAtDesc(UUID propertyId, List<String> statuses);

    List<PromotionOrder> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<PromotionOrder> findAllByOrderByCreatedAtDesc();
}
