package com.seedha.properties.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class AsyncJobWorkerService {

    private static final Logger log = LoggerFactory.getLogger(AsyncJobWorkerService.class);

    @Async
    public void processPushNotification(UUID userId, String title, String body, Map<String, String> data) {
        log.info("Processing async push notification for user: {}, title: {}", userId, title);
        // Async delivery to FCM / WebPush
    }

    @Async
    public void processImageWebpConversion(String sourceBucket, String objectKey) {
        log.info("Processing async image optimization for bucket: {}, key: {}", sourceBucket, objectKey);
        // Async image resizing and WebP conversion
    }

    @Async
    public void generateRentalAgreementPdf(UUID agreementId) {
        log.info("Generating async digital rental agreement PDF for id: {}", agreementId);
        // Async PDF document stamping and watermarking
    }
}
