package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.dto.CreatePromotionOrderRequest;
import com.seedha.properties.dto.PromotionOrderResponse;
import com.seedha.properties.dto.VerifyPromotionPaymentRequest;
import com.seedha.properties.entity.PromotionOrder;
import com.seedha.properties.repository.PromotionOrderRepository;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class PaymentController {

    private final PaymentService paymentService;
    private final PromotionOrderRepository promotionOrderRepository;

    public PaymentController(PaymentService paymentService, PromotionOrderRepository promotionOrderRepository) {
        this.paymentService = paymentService;
        this.promotionOrderRepository = promotionOrderRepository;
    }

    /**
     * Creates or reuses a promotion order. Server computes the payable amount from planId.
     */
    @PostMapping("/api/v2/payments/promotion/create")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPromotionOrder(
            @Valid @RequestBody CreatePromotionOrderRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        UUID propertyId;
        try {
            propertyId = UUID.fromString(request.getPropertyId());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid propertyId format."));
        }

        try {
            Map<String, Object> result = paymentService.createPromotionOrder(currentUser.getId(), propertyId, request.getPlanId());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Verifies payment signature server-side. Concludes payment state securely.
     */
    @PostMapping("/api/v2/payments/promotion/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPromotionPayment(
            @Valid @RequestBody VerifyPromotionPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        try {
            Map<String, Object> result = paymentService.verifyPayment(
                currentUser.getId(),
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
            );
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Authoritative status lookup for an order. Scoped to the owner (or admin).
     */
    @GetMapping("/api/v2/payments/promotion/status")
    public ResponseEntity<ApiResponse<PromotionOrderResponse>> getPromotionStatus(
            @RequestParam("orderId") String orderIdStr,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        UUID orderId;
        try {
            orderId = UUID.fromString(orderIdStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid orderId format."));
        }

        PromotionOrder order = promotionOrderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Order not found."));
        }

        // IDOR Check
        boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
        if (!order.getUserId().equals(currentUser.getId()) && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }

        PromotionOrderResponse response = mapToResponse(order);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Authoritative payment history. Strictly user-scoped (or all for admin).
     */
    @GetMapping("/api/v2/payments/history")
    public ResponseEntity<ApiResponse<List<PromotionOrderResponse>>> getPaymentHistory(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
        List<PromotionOrder> orders = isAdmin
            ? promotionOrderRepository.findAllByOrderByCreatedAtDesc()
            : promotionOrderRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());

        List<PromotionOrderResponse> list = orders.stream().map(this::mapToResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Webhook endpoint for Razorpay. Public endpoint authenticated via HMAC-SHA256 signature in X-Razorpay-Signature.
     */
    @PostMapping("/api/webhooks/razorpay")
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleRazorpayWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {

        if (signature == null || signature.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing webhook signature."));
        }

        try {
            Map<String, Object> result = paymentService.reconcileWebhook(rawBody, signature);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ApiResponse.error(e.getMessage()));
        }
    }

    private PromotionOrderResponse mapToResponse(PromotionOrder order) {
        PromotionOrderResponse resp = new PromotionOrderResponse();
        resp.setId(order.getId());
        resp.setPropertyId(order.getPropertyId());
        resp.setPlanId(order.getPlanId());
        resp.setAmountPaise(order.getAmountPaise());
        resp.setCurrency(order.getCurrency());
        resp.setStatus(order.getStatus());
        resp.setGateway(order.getGateway());
        resp.setGatewayOrderId(order.getGatewayOrderId());
        resp.setPromotionStartsAt(order.getPromotionStartsAt());
        resp.setPromotionEndsAt(order.getPromotionEndsAt());
        resp.setCreatedAt(order.getCreatedAt());
        return resp;
    }
}
