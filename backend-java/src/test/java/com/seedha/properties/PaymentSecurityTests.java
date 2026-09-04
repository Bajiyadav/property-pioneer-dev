package com.seedha.properties;

import com.seedha.properties.controller.PaymentController;
import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.dto.CreatePromotionOrderRequest;
import com.seedha.properties.dto.PromotionOrderResponse;
import com.seedha.properties.dto.VerifyPromotionPaymentRequest;
import com.seedha.properties.entity.Notification;
import com.seedha.properties.entity.Property;
import com.seedha.properties.entity.PromotionOrder;
import com.seedha.properties.repository.NotificationRepository;
import com.seedha.properties.repository.PaymentWebhookEventRepository;
import com.seedha.properties.repository.PropertyRepository;
import com.seedha.properties.repository.PromotionOrderRepository;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.AuthService;
import com.seedha.properties.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("staging")
class PaymentSecurityTests {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentController paymentController;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private PromotionOrderRepository promotionOrderRepository;

    @Autowired
    private PaymentWebhookEventRepository paymentWebhookEventRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuthService authService;

    private UserPrincipal ownerUser;
    private UserPrincipal attackerUser;
    private UserPrincipal adminUser;
    private Property ownerProperty;

    private final String testKeySecret = "test_rzp_secret_998877";
    private final String testWebhookSecret = "test_wh_secret_112233";

    private UserPrincipal createPrincipal(String email, String name, String role) {
        com.seedha.properties.dto.AuthRequest req = new com.seedha.properties.dto.AuthRequest();
        req.setAction("signup");
        req.setEmail(email);
        req.setPassword("Password123!");
        req.setFullName(name);
        req.setRole(role);
        com.seedha.properties.dto.AuthResponse resp = authService.handleAuthRequest(req, null);
        assertTrue(resp.isOk(), "Signup must succeed for test user");
        return new UserPrincipal(resp.getUser().getId(), email, name, role);
    }

    @BeforeEach
    void setUp() {
        long ts = System.currentTimeMillis();
        ownerUser = createPrincipal("owner_" + ts + "@seedha.test", "Owner Test", "OWNER");
        attackerUser = createPrincipal("attacker_" + ts + "@seedha.test", "Attacker Test", "SEEKER");
        adminUser = createPrincipal("admin_" + ts + "@seedha.test", "Admin Test", "ADMIN");

        // Seed an owner property
        ownerProperty = new Property();
        ownerProperty.setOwnerId(ownerUser.getId());
        ownerProperty.setTitle("Sunny Villa in HSR Layout");
        ownerProperty.setDescription("Spacious 3 BHK");
        ownerProperty.setListingType("RENT");
        ownerProperty.setPropertyType("VILLA");
        ownerProperty.setPrice(BigDecimal.valueOf(45000));
        ownerProperty.setStateName("Karnataka");
        ownerProperty.setCityName("Bengaluru");
        ownerProperty.setLocality("HSR Layout");
        ownerProperty.setIsFeatured(false);
        ownerProperty = propertyRepository.save(ownerProperty);

        // Inject test secrets into PaymentService for verification tests
        ReflectionTestUtils.setField(paymentService, "keyId", "rzp_test_12345");
        ReflectionTestUtils.setField(paymentService, "keySecret", testKeySecret);
        ReflectionTestUtils.setField(paymentService, "webhookSecret", testWebhookSecret);
    }

    @Test
    void testAmountSafety_ServerCalculatedPaiseOnly() {
        // Plan visibility-more-299 must be strictly 29900 paise (integer minor units)
        var morePlan = PaymentService.PLANS.get("visibility-more-299");
        assertNotNull(morePlan);
        assertEquals(29900, morePlan.pricePaise());
        assertEquals(30, morePlan.durationDays());

        // Plan visibility-max-499 must be strictly 49900 paise
        var maxPlan = PaymentService.PLANS.get("visibility-max-499");
        assertNotNull(maxPlan);
        assertEquals(49900, maxPlan.pricePaise());
        assertEquals(60, maxPlan.durationDays());

        // Creating order must ignore client-side price attempts and set 29900 paise
        CreatePromotionOrderRequest req = new CreatePromotionOrderRequest(
            ownerProperty.getId().toString(),
            "visibility-more-299"
        );
        ResponseEntity<ApiResponse<Map<String, Object>>> response = paymentController.createPromotionOrder(req, ownerUser);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isOk());
        assertEquals(29900, response.getBody().getData().get("amountPaise"));
        assertEquals("INR", response.getBody().getData().get("currency"));
    }

    @Test
    void testInvalidPlanRejection() {
        CreatePromotionOrderRequest req = new CreatePromotionOrderRequest(
            ownerProperty.getId().toString(),
            "free-vip-plan-hack"
        );
        ResponseEntity<ApiResponse<Map<String, Object>>> response = paymentController.createPromotionOrder(req, ownerUser);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isOk());
        assertTrue(response.getBody().getError().contains("Unknown promotion plan"));
    }

    @Test
    void testIDORProtection_NonOwnerCannotPromoteProperty() {
        // Attacker attempts to promote ownerProperty
        CreatePromotionOrderRequest req = new CreatePromotionOrderRequest(
            ownerProperty.getId().toString(),
            "visibility-more-299"
        );
        ResponseEntity<ApiResponse<Map<String, Object>>> response = paymentController.createPromotionOrder(req, attackerUser);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertFalse(response.getBody().isOk());
        assertTrue(response.getBody().getError().contains("You can only promote properties you own"));
    }

    @Test
    void testSignatureVerification_ValidAndInvalidHMAC() {
        String orderId = "order_test_123456789";
        String paymentId = "pay_test_987654321";

        // 1. Valid HMAC
        String validSignature = PaymentService.calculateHmacSha256(orderId + "|" + paymentId, testKeySecret);
        assertTrue(PaymentService.verifyPaymentSignature(orderId, paymentId, validSignature, testKeySecret));

        // 2. Tampered paymentId
        assertFalse(PaymentService.verifyPaymentSignature(orderId, "pay_tampered_000", validSignature, testKeySecret));

        // 3. Tampered signature
        assertFalse(PaymentService.verifyPaymentSignature(orderId, paymentId, "deadbeefcafebabe00112233", testKeySecret));

        // 4. Null / empty signature
        assertFalse(PaymentService.verifyPaymentSignature(orderId, paymentId, null, testKeySecret));
        assertFalse(PaymentService.verifyPaymentSignature(orderId, paymentId, "", testKeySecret));
    }

    @Test
    void testWebhookSignatureVerification_ValidAndInvalid() {
        String rawBody = "{\"id\":\"evt_1001\",\"event\":\"payment.captured\",\"payload\":{}}";

        String validSignature = PaymentService.calculateHmacSha256(rawBody, testWebhookSecret);
        assertTrue(PaymentService.verifyWebhookSignature(rawBody, validSignature, testWebhookSecret));

        // Tampered body
        String tamperedBody = "{\"id\":\"evt_1001\",\"event\":\"payment.captured\",\"payload\":{\"hack\":true}}";
        assertFalse(PaymentService.verifyWebhookSignature(tamperedBody, validSignature, testWebhookSecret));

        // Null signature
        assertFalse(PaymentService.verifyWebhookSignature(rawBody, null, testWebhookSecret));
    }

    @Test
    void testStateMachine_AllowedAndDisallowedTransitions() {
        // Legal transitions
        assertTrue(PaymentService.canTransition("pending", "created"));
        assertTrue(PaymentService.canTransition("pending", "cancelled"));
        assertTrue(PaymentService.canTransition("pending", "failed"));
        assertTrue(PaymentService.canTransition("created", "processing"));
        assertTrue(PaymentService.canTransition("created", "cancelled"));
        assertTrue(PaymentService.canTransition("processing", "paid"));
        assertTrue(PaymentService.canTransition("paid", "refunded"));

        // Illegal transitions
        assertFalse(PaymentService.canTransition("failed", "paid"));
        assertFalse(PaymentService.canTransition("cancelled", "paid"));
        assertFalse(PaymentService.canTransition("refunded", "paid"));
        assertFalse(PaymentService.canTransition("paid", "processing"));
        assertFalse(PaymentService.canTransition("paid", "created"));
        assertFalse(PaymentService.canTransition("unknown", "paid"));
    }

    @Test
    void testWebhookIdempotency_DuplicateEventHandledSafely() {
        String eventId = "evt_idempotency_test_" + UUID.randomUUID().toString().substring(0, 8);
        String rawBody = "{\"id\":\"" + eventId + "\",\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"order_none_exist\",\"id\":\"pay_test\"}}}}";
        String validSignature = PaymentService.calculateHmacSha256(rawBody, testWebhookSecret);

        // First delivery: recorded in ledger
        ResponseEntity<ApiResponse<Map<String, Object>>> firstResp = paymentController.handleRazorpayWebhook(rawBody, validSignature);
        assertEquals(HttpStatus.OK, firstResp.getStatusCode());
        assertTrue(firstResp.getBody().isOk());
        assertEquals(false, firstResp.getBody().getData().get("duplicate"));

        // Second delivery (duplicate): caught by idempotency ledger, no error, duplicate=true
        ResponseEntity<ApiResponse<Map<String, Object>>> duplicateResp = paymentController.handleRazorpayWebhook(rawBody, validSignature);
        assertEquals(HttpStatus.OK, duplicateResp.getStatusCode());
        assertTrue(duplicateResp.getBody().isOk());
        assertEquals(true, duplicateResp.getBody().getData().get("duplicate"));
    }

    @Test
    void testVerifyPayment_ConcludesPaidStateAndActivatesFeatured() {
        // 1. Create order
        CreatePromotionOrderRequest createReq = new CreatePromotionOrderRequest(
            ownerProperty.getId().toString(),
            "visibility-more-299"
        );
        var createResp = paymentController.createPromotionOrder(createReq, ownerUser);
        assertEquals(HttpStatus.OK, createResp.getStatusCode());
        String orderId = (String) createResp.getBody().getData().get("orderId");
        String razorpayOrderId = (String) createResp.getBody().getData().get("razorpayOrderId");

        // 2. Generate valid HMAC signature
        String razorpayPaymentId = "pay_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        String validSignature = PaymentService.calculateHmacSha256(razorpayOrderId + "|" + razorpayPaymentId, testKeySecret);

        // 3. Verify payment
        VerifyPromotionPaymentRequest verifyReq = new VerifyPromotionPaymentRequest(
            razorpayOrderId,
            razorpayPaymentId,
            validSignature
        );
        var verifyResp = paymentController.verifyPromotionPayment(verifyReq, ownerUser);
        assertEquals(HttpStatus.OK, verifyResp.getStatusCode());
        assertTrue(verifyResp.getBody().isOk());
        assertEquals("paid", verifyResp.getBody().getData().get("status"));
        assertEquals(false, verifyResp.getBody().getData().get("alreadyProcessed"));

        // 4. Verify property is_featured is now true
        Property updatedProperty = propertyRepository.findById(ownerProperty.getId()).orElseThrow();
        assertTrue(updatedProperty.getIsFeatured(), "Property must be featured after payment");

        // 5. Verify user received notification
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(ownerUser.getId());
        assertFalse(notifs.isEmpty());
        assertEquals("Property Promotion Activated!", notifs.getFirst().getTitle());

        // 6. Idempotent re-verify: duplicate callback returns success without re-processing
        var reverifyResp = paymentController.verifyPromotionPayment(verifyReq, ownerUser);
        assertEquals(HttpStatus.OK, reverifyResp.getStatusCode());
        assertEquals(true, reverifyResp.getBody().getData().get("alreadyProcessed"));
    }

    @Test
    void testPaymentHistoryAndStatus_OwnershipIsolation() {
        // 1. Create an order for owner
        CreatePromotionOrderRequest createReq = new CreatePromotionOrderRequest(
            ownerProperty.getId().toString(),
            "visibility-max-499"
        );
        var createResp = paymentController.createPromotionOrder(createReq, ownerUser);
        String orderId = (String) createResp.getBody().getData().get("orderId");

        // 2. Owner can read status
        var statusRespOwner = paymentController.getPromotionStatus(orderId, ownerUser);
        assertEquals(HttpStatus.OK, statusRespOwner.getStatusCode());
        assertEquals(49900, statusRespOwner.getBody().getData().getAmountPaise());

        // 3. Attacker CANNOT read owner's order status (IDOR Guard)
        var statusRespAttacker = paymentController.getPromotionStatus(orderId, attackerUser);
        assertEquals(HttpStatus.FORBIDDEN, statusRespAttacker.getStatusCode());

        // 4. Admin CAN read order status
        var statusRespAdmin = paymentController.getPromotionStatus(orderId, adminUser);
        assertEquals(HttpStatus.OK, statusRespAdmin.getStatusCode());

        // 5. History query is user-scoped
        var historyOwner = paymentController.getPaymentHistory(ownerUser);
        assertEquals(HttpStatus.OK, historyOwner.getStatusCode());
        assertFalse(historyOwner.getBody().getData().isEmpty());

        var historyAttacker = paymentController.getPaymentHistory(attackerUser);
        assertEquals(HttpStatus.OK, historyAttacker.getStatusCode());
        assertTrue(historyAttacker.getBody().getData().isEmpty(), "Attacker should have 0 orders in history");
    }
}
