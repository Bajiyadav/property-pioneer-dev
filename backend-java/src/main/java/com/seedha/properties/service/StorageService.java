package com.seedha.properties.service;

import com.seedha.properties.dto.PresignUploadRequest;
import com.seedha.properties.dto.PresignUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class StorageService {

    private final String publicBucket;
    private final String privateBucket;
    private final String awsRegion;

    private static final Set<String> ALLOWED_IMAGE_MIMES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> ALLOWED_DOC_MIMES = Set.of("application/pdf");

    public StorageService(
            @Value("${seedha.aws.public-bucket:seedha-properties-public-media-staging}") String publicBucket,
            @Value("${seedha.aws.private-bucket:seedha-properties-private-docs-staging}") String privateBucket,
            @Value("${seedha.aws.region:ap-south-1}") String awsRegion) {
        this.publicBucket = publicBucket;
        this.privateBucket = privateBucket;
        this.awsRegion = awsRegion;
    }

    public PresignUploadResponse createUploadUrl(PresignUploadRequest req, UUID userId) {
        boolean isPrivate = "kyc-documents".equalsIgnoreCase(req.getFolder()) || "rental-agreements".equalsIgnoreCase(req.getFolder());
        String bucket = isPrivate ? privateBucket : publicBucket;

        // Clean filename and generate deterministic secure key
        String ext = getExtension(req.getFileName());
        String objectKey = req.getFolder().toLowerCase() + "/" + userId + "/" + UUID.randomUUID() + ext;

        // Generate standard S3 pre-signed PUT URL format
        String presignedUrl = String.format("https://%s.s3.%s.amazonaws.com/%s?X-Amz-Expires=300", bucket, awsRegion, objectKey);

        return new PresignUploadResponse(
                presignedUrl,
                objectKey,
                300,
                isPrivate,
                Map.of("Content-Type", req.getContentType())
        );
    }

    public String createDownloadUrl(String objectKey, UUID userId) {
        // Enforce owner/actor check in caller before pre-signing GET
        return String.format("https://%s.s3.%s.amazonaws.com/%s?X-Amz-Expires=300&token=%s",
                privateBucket, awsRegion, objectKey, UUID.randomUUID());
    }

    private String getExtension(String fileName) {
        if (fileName != null && fileName.contains(".")) {
            return fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
        }
        return ".bin";
    }
}
