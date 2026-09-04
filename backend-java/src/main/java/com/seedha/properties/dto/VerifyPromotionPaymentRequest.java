package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class VerifyPromotionPaymentRequest {

    @NotBlank(message = "razorpay_order_id is required")
    @JsonAlias({"razorpay_order_id", "razorpayOrderId", "orderId"})
    private String razorpayOrderId;

    @NotBlank(message = "razorpay_payment_id is required")
    @JsonAlias({"razorpay_payment_id", "razorpayPaymentId", "paymentId"})
    private String razorpayPaymentId;

    @NotBlank(message = "razorpay_signature is required")
    @JsonAlias({"razorpay_signature", "signature"})
    private String razorpaySignature;

    public VerifyPromotionPaymentRequest() {}

    public VerifyPromotionPaymentRequest(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        this.razorpayOrderId = razorpayOrderId;
        this.razorpayPaymentId = razorpayPaymentId;
        this.razorpaySignature = razorpaySignature;
    }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }
}
