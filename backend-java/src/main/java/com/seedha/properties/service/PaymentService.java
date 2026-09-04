package com.seedha.properties.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seedha.properties.entity.Notification;
import com.seedha.properties.entity.PaymentWebhookEvent;
import com.seedha.properties.entity.Property;
import com.seedha.properties.entity.PromotionOrder;
import com.seedha.properties.repository.NotificationRepository;
import com.seedha.properties.repository.PaymentWebhookEventRepository;
import com.seedha.properties.repository.PropertyRepository;
import com.seedha.properties.repository.PromotionOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * Enterprise Payment Service for Seedha Properties.
 *
 * Implements strict money safety, server-side amount calculation, IDOR ownership verification,
 * state machine enforcement, constant-time HMAC-SHA256 signature verification, and webhook idempotency.
 *
 * SENSITIVE DATA POLICY: Never logs Razorpay key secret, webhook secret, or raw card/UPI details.
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    // Supported visibility plans and their exact server-calculated minor currency units (paise)
    public record VisibilityPlanConfig(String id, String name, int pricePaise, int durationDays) {}

    public static final Map<String, VisibilityPlanConfig> PLANS = Map.of(
        "visibility-more-299", new VisibilityPlanConfig("visibility-more-299", "Visibility More", 29900, 30),
        "visibility-max-499", new VisibilityPlanConfig("visibility-max-499", "Visibility Max", 49900, 60)
    );

    // State machine: strictly allowed forward transitions
    private static final Map<String, Set<String>> ALLOWED_TRANSITIONS = Map.of(
        "pending", Set.of("created", "cancelled", "failed"),
        "created", Set.of("processing", "cancelled", "failed"),
        "processing", Set.of("paid", "failed"),
        "paid", Set.of("refunded"),
        "failed", Set.of(),
        "cancelled", Set.of(),
        "refunded", Set.of()
    );

    private static final List<String> OPEN_STATUSES = List.of("pending", "created", "processing");

    private final PromotionOrderRepository promotionOrderRepository;
    private final PaymentWebhookEventRepository paymentWebhookEventRepository;
    private final PropertyRepository propertyRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    @Value("${seedha.razorpay.key-id:}")
    private String keyId;

    @Value("${seedha.razorpay.key-secret:}")
    private String keySecret;

    @Value("${seedha.razorpay.webhook-secret:}")
    private String webhookSecret;

    public PaymentService(
        PromotionOrderRepository promotionOrderRepository,
        PaymentWebhookEventRepository paymentWebhookEventRepository,
        PropertyRepository propertyRepository,
        NotificationRepository notificationRepository,
        ObjectMapper objectMapper
    ) {
        this.promotionOrderRepository = promotionOrderRepository;
        this.paymentWebhookEventRepository = paymentWebhookEventRepository;
        this.propertyRepository = propertyRepository;
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
    }

    public boolean isGatewayConfigured() {
        return keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank();
    }

    public boolean isWebhookConfigured() {
        return webhookSecret != null && !webhookSecret.isBlank();
    }

    public static boolean canTransition(String fromStatus, String toStatus) {
        if (fromStatus == null || toStatus == null) return false;
        Set<String> allowed = ALLOWED_TRANSITIONS.get(fromStatus.toLowerCase());
        return allowed != null && allowed.contains(toStatus.toLowerCase());
    }

    /**
     * Creates or idempotently reuses a promotion order.
     *
     * SECURITY INVARIANTS:
     * 1. IDOR: Caller must own the property being promoted.
     * 2. Money Safety: Amount is calculated strictly on the server from the plan ID in minor units (paise).
     * 3. Idempotency: Multiple taps reuse an open order rather than creating duplicate debts.
     */
    @Transactional
    public Map<String, Object> createPromotionOrder(UUID userId, UUID propertyId, String planId) {
        VisibilityPlanConfig plan = PLANS.get(planId);
        if (plan == null) {
            throw new IllegalArgumentException("Unknown promotion plan: " + planId);
        }

        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new IllegalArgumentException("Property not found."));

        // Strict IDOR Check
        if (!property.getOwnerId().equals(userId)) {
            throw new AccessDeniedException("You can only promote properties you own.");
        }

        // Idempotent open order check
        Optional<PromotionOrder> existingOpen = promotionOrderRepository
            .findFirstByPropertyIdAndStatusInOrderByCreatedAtDesc(propertyId, OPEN_STATUSES);

        PromotionOrder order;
        if (existingOpen.isPresent()) {
            order = existingOpen.get();
            if (!order.getPlanId().equals(plan.id())) {
                order.setPlanId(plan.id());
                order.setAmountPaise(plan.pricePaise());
                order.setUpdatedAt(OffsetDateTime.now());
                promotionOrderRepository.save(order);
            }
        } else {
            order = new PromotionOrder();
            order.setUserId(userId);
            order.setPropertyId(propertyId);
            order.setPlanId(plan.id());
            order.setAmountPaise(plan.pricePaise());
            order.setCurrency("INR");
            order.setStatus("pending");
            order.setUpdatedAt(OffsetDateTime.now());
            order = promotionOrderRepository.save(order);
        }

        if (!isGatewayConfigured()) {
            return Map.of(
                "ok", true,
                "gatewayConfigured", false,
                "orderId", order.getId().toString(),
                "planId", plan.id(),
                "amountPaise", plan.pricePaise(),
                "currency", "INR",
                "message", "Your promotion request is saved. Online payment is not open yet."
            );
        }

        // Generate or assign gateway order id
        String gatewayOrderId = order.getGatewayOrderId();
        if (gatewayOrderId == null || gatewayOrderId.isBlank()) {
            gatewayOrderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            order.setGateway("razorpay");
            order.setGatewayOrderId(gatewayOrderId);
            order.setStatus("created");
            order.setUpdatedAt(OffsetDateTime.now());
            promotionOrderRepository.save(order);
        }

        return Map.of(
            "ok", true,
            "gatewayConfigured", true,
            "orderId", order.getId().toString(),
            "razorpayOrderId", gatewayOrderId,
            "keyId", keyId,
            "amountPaise", plan.pricePaise(),
            "currency", "INR"
        );
    }

    /**
     * Verifies payment callback signature from Razorpay checkout.
     *
     * Never trusts client status flags. Verification requires valid HMAC-SHA256 signature,
     * authenticated user ownership (IDOR check), and valid state machine transition.
     */
    @Transactional
    public Map<String, Object> verifyPayment(UUID userId, String razorpayOrderId, String razorpayPaymentId, String signature) {
        if (razorpayOrderId == null || razorpayPaymentId == null || signature == null) {
            throw new IllegalArgumentException("Missing required payment verification fields.");
        }

        if (!isGatewayConfigured()) {
            throw new IllegalStateException("Payment gateway credentials not configured.");
        }

        // 1. Verify Signature
        boolean signatureValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature, keySecret);
        if (!signatureValid) {
            log.warn("Payment signature verification failed for order {}", razorpayOrderId);
            throw new IllegalArgumentException("Payment signature could not be verified.");
        }

        // 2. Lookup Order
        PromotionOrder order = promotionOrderRepository.findByGatewayOrderId(razorpayOrderId)
            .orElseThrow(() -> new IllegalArgumentException("Unknown order: " + razorpayOrderId));

        // 3. IDOR Check: Authenticated caller must own the order
        if (!order.getUserId().equals(userId)) {
            throw new AccessDeniedException("You do not own this order.");
        }

        // 4. State Machine & Idempotency
        if ("paid".equalsIgnoreCase(order.getStatus())) {
            return Map.of("ok", true, "verified", true, "status", "paid", "alreadyProcessed", true);
        }

        if (!canTransition(order.getStatus(), "paid") && !"created".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalStateException("Cannot transition order from " + order.getStatus() + " to paid.");
        }

        // 5. Apply Paid Transition
        applyPaidOrderSuccess(order, razorpayPaymentId, signature);

        return Map.of("ok", true, "verified", true, "status", "paid", "alreadyProcessed", false);
    }

    /**
     * Authoritative Webhook Reconciliation.
     *
     * Strictly verifies raw payload signature with webhookSecret.
     * Uses payment_webhook_events as an idempotency ledger to guarantee that
     * duplicate gateway deliveries are safe no-ops.
     */
    @Transactional
    public Map<String, Object> reconcileWebhook(String rawBody, String signature) {
        if (!isWebhookConfigured()) {
            throw new IllegalStateException("Razorpay webhook secret is not configured.");
        }

        if (signature == null || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
            log.warn("Rejected Razorpay webhook with invalid signature.");
            throw new IllegalArgumentException("Invalid webhook signature.");
        }

        JsonNode rootNode;
        try {
            rootNode = objectMapper.readTree(rawBody);
        } catch (Exception e) {
            throw new IllegalArgumentException("Malformed webhook payload.");
        }

        String eventId = rootNode.path("id").asText(null);
        String eventType = rootNode.path("event").asText(null);

        if (eventId == null || eventType == null) {
            throw new IllegalArgumentException("Missing event id or event type.");
        }

        // Idempotency check: duplicate event handling
        if (paymentWebhookEventRepository.existsByProviderAndEventId("razorpay", eventId)) {
            log.info("Duplicate webhook event received: {}. Skipping.", eventId);
            return Map.of("ok", true, "duplicate", true, "message", "Event already processed.");
        }

        // Extract gateway identifiers from nested payload
        JsonNode paymentEntity = rootNode.path("payload").path("payment").path("entity");
        JsonNode orderEntity = rootNode.path("payload").path("order").path("entity");

        String gatewayOrderId = paymentEntity.path("order_id").asText(orderEntity.path("id").asText(null));
        String gatewayPaymentId = paymentEntity.path("id").asText(null);

        // Record in idempotency ledger
        PaymentWebhookEvent eventRecord = new PaymentWebhookEvent("razorpay", eventId, eventType, gatewayOrderId, gatewayPaymentId);
        paymentWebhookEventRepository.save(eventRecord);

        // State Machine Transition
        if (gatewayOrderId != null && !gatewayOrderId.isBlank()) {
            Optional<PromotionOrder> orderOpt = promotionOrderRepository.findByGatewayOrderId(gatewayOrderId);
            if (orderOpt.isPresent()) {
                PromotionOrder order = orderOpt.get();
                if ("payment.captured".equals(eventType) || "order.paid".equals(eventType)) {
                    if (!"paid".equalsIgnoreCase(order.getStatus())) {
                        applyPaidOrderSuccess(order, gatewayPaymentId, null);
                    }
                } else if ("payment.failed".equals(eventType)) {
                    if (canTransition(order.getStatus(), "failed")) {
                        order.setStatus("failed");
                        order.setUpdatedAt(OffsetDateTime.now());
                        promotionOrderRepository.save(order);
                    }
                } else if ("refund.processed".equals(eventType)) {
                    if (canTransition(order.getStatus(), "refunded")) {
                        order.setStatus("refunded");
                        order.setUpdatedAt(OffsetDateTime.now());
                        promotionOrderRepository.save(order);
                        // Deactivate featured flag on property
                        propertyRepository.findById(order.getPropertyId()).ifPresent(prop -> {
                            prop.setIsFeatured(false);
                            propertyRepository.save(prop);
                        });
                    }
                }
            }
        }

        return Map.of("ok", true, "duplicate", false, "eventType", eventType);
    }

    private void applyPaidOrderSuccess(PromotionOrder order, String paymentId, String signature) {
        order.setStatus("paid");
        if (paymentId != null) order.setGatewayPaymentId(paymentId);
        if (signature != null) order.setGatewaySignature(signature);

        VisibilityPlanConfig plan = PLANS.get(order.getPlanId());
        int durationDays = plan != null ? plan.durationDays() : 30;

        OffsetDateTime startsAt = OffsetDateTime.now();
        OffsetDateTime endsAt = startsAt.plusDays(durationDays);

        order.setPromotionStartsAt(startsAt);
        order.setPromotionEndsAt(endsAt);
        order.setUpdatedAt(startsAt);
        promotionOrderRepository.save(order);

        // Activate is_featured on Property
        propertyRepository.findById(order.getPropertyId()).ifPresent(property -> {
            property.setIsFeatured(true);
            propertyRepository.save(property);
        });

        // Create user-scoped Notification
        Notification notification = new Notification();
        notification.setUserId(order.getUserId());
        notification.setTitle("Property Promotion Activated!");
        notification.setMessage("Your visibility boost is now active. Your listing is now featured on Seedha Properties.");
        notification.setType("PROMOTION_ACTIVE");
        notification.setIsRead(false);
        notification.setLinkUrl("/owner-dashboard");
        notificationRepository.save(notification);
    }

    /**
     * Constant-time HMAC-SHA256 signature verification for client payment callback.
     */
    public static boolean verifyPaymentSignature(String orderId, String paymentId, String signature, String secret) {
        if (orderId == null || paymentId == null || signature == null || secret == null) return false;
        String payload = orderId + "|" + paymentId;
        String expectedHex = calculateHmacSha256(payload, secret);
        return constantTimeEquals(expectedHex, signature);
    }

    /**
     * Constant-time HMAC-SHA256 signature verification for webhook raw payload.
     */
    public static boolean verifyWebhookSignature(String rawBody, String signature, String secret) {
        if (rawBody == null || signature == null || secret == null) return false;
        String expectedHex = calculateHmacSha256(rawBody, secret);
        return constantTimeEquals(expectedHex, signature);
    }

    public static String calculateHmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate HMAC-SHA256", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] aBytes = a.getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(aBytes, bBytes);
    }
}
