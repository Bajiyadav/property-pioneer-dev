package com.seedha.properties;

import com.seedha.properties.controller.FileController;
import com.seedha.properties.controller.MediaController;
import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.dto.AuthRequest;
import com.seedha.properties.dto.AuthResponse;
import com.seedha.properties.dto.PresignUploadRequest;
import com.seedha.properties.dto.PresignUploadResponse;
import com.seedha.properties.entity.Property;
import com.seedha.properties.entity.StoredFile;
import com.seedha.properties.repository.PropertyRepository;
import com.seedha.properties.repository.StoredFileRepository;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("staging")
class FileSecurityTests {

    @Autowired
    private MediaController mediaController;

    @Autowired
    private FileController fileController;

    @Autowired
    private AuthService authService;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private StoredFileRepository storedFileRepository;

    private UserPrincipal ownerA;
    private UserPrincipal userB;
    private UserPrincipal adminUser;
    private Property propertyA;

    @BeforeEach
    void setUp() {
        ownerA = createPrincipal("owner_file_" + System.currentTimeMillis() + "@test.com", "Owner A", "OWNER");
        userB = createPrincipal("user_file_" + System.currentTimeMillis() + "@test.com", "User B", "SEEKER");
        adminUser = createPrincipal("admin_file_" + System.currentTimeMillis() + "@test.com", "Admin User", "ADMIN");

        Property prop = new Property();
        prop.setOwnerId(ownerA.getId());
        prop.setTitle("Security Test Villa");
        prop.setDescription("Villa description");
        prop.setPrice(new BigDecimal("15000000"));
        prop.setCityName("Hyderabad");
        prop.setStateName("Telangana");
        prop.setLocality("Madhapur");
        prop.setAddress("Cyber Towers Road");
        prop.setListingType("BUY");
        prop.setPropertyType("VILLA");
        prop.setBhk(4);
        prop.setBuiltupAreaSqft(3200);
        propertyA = propertyRepository.save(prop);
    }

    private UserPrincipal createPrincipal(String email, String name, String role) {
        AuthRequest req = new AuthRequest();
        req.setAction("signup");
        req.setEmail(email);
        req.setPassword("Password123!");
        req.setFullName(name);
        req.setRole(role);
        AuthResponse resp = authService.handleAuthRequest(req, null);
        assertTrue(resp.isOk(), "Signup must succeed for test user");
        return new UserPrincipal(resp.getUser().getId(), email, name, role);
    }

    @Test
    void testUnauthenticatedPresignUploadRejected() {
        PresignUploadRequest req = new PresignUploadRequest("property-photos", "living_room.jpg", "image/jpeg", 204800L);
        ResponseEntity<ApiResponse<PresignUploadResponse>> res = mediaController.getPresignUploadUrl(req, null);
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
        assertFalse(res.getBody().isOk());
    }

    @Test
    void testUnauthenticatedPresignDownloadRejected() {
        ResponseEntity<ApiResponse<Map<String, Object>>> res = mediaController.getPresignDownloadUrl(Map.of("object_key", "kyc-documents/user/file.pdf"), null);
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
    }

    @Test
    void testPresignUploadPublicPhotoSuccess() {
        PresignUploadRequest req = new PresignUploadRequest("property-photos", "living_room.jpg", "image/jpeg", 500000L);
        req.setEntityId(propertyA.getId());

        ResponseEntity<ApiResponse<PresignUploadResponse>> res = mediaController.getPresignUploadUrl(req, ownerA);
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertTrue(res.getBody().isOk());

        PresignUploadResponse data = res.getBody().getData();
        assertNotNull(data.getUploadUrl());
        assertTrue(data.getUploadUrl().contains("X-Amz-Expires=300"));
        assertNotNull(data.getPublicUrl());
        assertFalse(data.isPrivate());
        assertEquals(300, data.getExpiresInSeconds());
        assertTrue(data.getObjectKey().startsWith("property-photos/" + ownerA.getId()));
    }

    @Test
    void testPresignUploadPrivateKycSuccess() {
        PresignUploadRequest req = new PresignUploadRequest("kyc-documents", "aadhaar_card.pdf", "application/pdf", 1024000L);

        ResponseEntity<ApiResponse<PresignUploadResponse>> res = mediaController.getPresignUploadUrl(req, ownerA);
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertTrue(res.getBody().isOk());

        PresignUploadResponse data = res.getBody().getData();
        assertNotNull(data.getUploadUrl());
        assertNull(data.getPublicUrl()); // Sensitive docs MUST NOT expose a public URL
        assertTrue(data.isPrivate());
        assertEquals(300, data.getExpiresInSeconds());
        assertTrue(data.getObjectKey().startsWith("kyc-documents/" + ownerA.getId()));
    }

    @Test
    void testPresignUploadDisallowedExtensionExecutableRejected() {
        PresignUploadRequest req = new PresignUploadRequest("property-photos", "malware.exe", "image/jpeg", 204800L);
        ResponseEntity<ApiResponse<PresignUploadResponse>> res = mediaController.getPresignUploadUrl(req, ownerA);
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertFalse(res.getBody().isOk());
        assertTrue(res.getBody().getError().contains("Forbidden file extension"));
    }

    @Test
    void testPresignUploadDisallowedExtensionSvgRejected() {
        PresignUploadRequest req = new PresignUploadRequest("property-photos", "exploit.svg", "image/svg+xml", 204800L);
        ResponseEntity<ApiResponse<PresignUploadResponse>> res = mediaController.getPresignUploadUrl(req, ownerA);
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertFalse(res.getBody().isOk());
    }

    @Test
    void testPresignUploadOversizedPhotoRejected() {
        // Property photo max size is 10 MB. Send 15 MB.
        long fifteenMb = 15 * 1024 * 1024L;
        PresignUploadRequest req = new PresignUploadRequest("property-photos", "huge_panorama.jpg", "image/jpeg", fifteenMb);
        ResponseEntity<ApiResponse<PresignUploadResponse>> res = mediaController.getPresignUploadUrl(req, ownerA);
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertFalse(res.getBody().isOk());
        assertTrue(res.getBody().getError().contains("exceeds maximum allowed limit"));
    }

    @Test
    void testPresignUploadPathTraversalFilenameRejected() {
        PresignUploadRequest req = new PresignUploadRequest("property-photos", "../../etc/passwd.jpg", "image/jpeg", 500000L);
        ResponseEntity<ApiResponse<PresignUploadResponse>> res = mediaController.getPresignUploadUrl(req, ownerA);
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertFalse(res.getBody().isOk());
        assertTrue(res.getBody().getError().contains("path traversal"));
    }

    @Test
    void testPresignUploadPropertyPhotoEntityIdorRejected() {
        // User B attempts to upload a photo scoped to Owner A's property
        PresignUploadRequest req = new PresignUploadRequest("property-photos", "intruder_photo.jpg", "image/jpeg", 500000L);
        req.setEntityId(propertyA.getId());

        ResponseEntity<ApiResponse<PresignUploadResponse>> res = mediaController.getPresignUploadUrl(req, userB);
        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
        assertFalse(res.getBody().isOk());
        assertTrue(res.getBody().getError().contains("You do not own property"));
    }

    @Test
    void testPresignDownloadAuthorizedOwnerSuccess() {
        // Owner A requests upload for KYC
        PresignUploadRequest uploadReq = new PresignUploadRequest("kyc-documents", "passport.pdf", "application/pdf", 500000L);
        ResponseEntity<ApiResponse<PresignUploadResponse>> uploadRes = mediaController.getPresignUploadUrl(uploadReq, ownerA);
        String objectKey = uploadRes.getBody().getData().getObjectKey();

        // Owner A requests presigned download for their own document
        ResponseEntity<ApiResponse<Map<String, Object>>> downloadRes = mediaController.getPresignDownloadUrl(
                Map.of("object_key", objectKey), ownerA
        );
        assertEquals(HttpStatus.OK, downloadRes.getStatusCode());
        assertTrue(downloadRes.getBody().isOk());
        assertNotNull(downloadRes.getBody().getData().get("download_url"));
        assertEquals(300, downloadRes.getBody().getData().get("expires_in_seconds"));
    }

    @Test
    void testPresignDownloadUnauthorizedUserBIdorForbidden() {
        // Owner A requests upload for KYC
        PresignUploadRequest uploadReq = new PresignUploadRequest("kyc-documents", "bank_statement.pdf", "application/pdf", 500000L);
        ResponseEntity<ApiResponse<PresignUploadResponse>> uploadRes = mediaController.getPresignUploadUrl(uploadReq, ownerA);
        String objectKey = uploadRes.getBody().getData().getObjectKey();

        // User B attempts to generate download URL for Owner A's private KYC document
        ResponseEntity<ApiResponse<Map<String, Object>>> downloadRes = mediaController.getPresignDownloadUrl(
                Map.of("object_key", objectKey), userB
        );
        assertEquals(HttpStatus.FORBIDDEN, downloadRes.getStatusCode());
        assertFalse(downloadRes.getBody().isOk());
        assertTrue(downloadRes.getBody().getError().contains("Forbidden: You are not authorized"));
    }

    @Test
    void testPresignDownloadAdminAllowed() {
        // Owner A requests upload for KYC
        PresignUploadRequest uploadReq = new PresignUploadRequest("kyc-documents", "tax_returns.pdf", "application/pdf", 500000L);
        ResponseEntity<ApiResponse<PresignUploadResponse>> uploadRes = mediaController.getPresignUploadUrl(uploadReq, ownerA);
        String objectKey = uploadRes.getBody().getData().getObjectKey();

        // Admin requests download URL
        ResponseEntity<ApiResponse<Map<String, Object>>> downloadRes = mediaController.getPresignDownloadUrl(
                Map.of("object_key", objectKey), adminUser
        );
        assertEquals(HttpStatus.OK, downloadRes.getStatusCode());
        assertTrue(downloadRes.getBody().isOk());
        assertNotNull(downloadRes.getBody().getData().get("download_url"));
    }

    @Test
    void testDirectUploadValidPdfSuccess() {
        byte[] validPdfBytes = "%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\nxref\n0 1\n0000000000 65535 f\ntrailer<</Size 1/Root 1 0 R>>\nstartxref\n9\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "lease_agreement.pdf", "application/pdf", validPdfBytes);

        ResponseEntity<ApiResponse<Map<String, Object>>> res = fileController.uploadDirect(
                file, "rental-agreements", null, "rental_agreement", ownerA
        );
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertTrue(res.getBody().isOk());
        Map<String, Object> data = res.getBody().getData();
        assertNotNull(data.get("file_id"));
        assertNotNull(data.get("checksum_sha256"));
        assertEquals(true, data.get("is_private"));
    }

    @Test
    void testDirectUploadMagicBytesMismatchRejected() {
        // File named .pdf but containing malicious executable / shell script text
        byte[] fakePdfBytes = "#!/bin/bash\nrm -rf /\n".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "fake_document.pdf", "application/pdf", fakePdfBytes);

        ResponseEntity<ApiResponse<Map<String, Object>>> res = fileController.uploadDirect(
                file, "rental-agreements", null, "rental_agreement", ownerA
        );
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertFalse(res.getBody().isOk());
        assertTrue(res.getBody().getError().contains("PDF signature"));
    }

    @Test
    void testDirectUploadValidJpegImageSuccess() {
        // Valid JPEG starting with FF D8 FF
        byte[] validJpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46};
        MockMultipartFile file = new MockMultipartFile("file", "bedroom.jpg", "image/jpeg", validJpegBytes);

        ResponseEntity<ApiResponse<Map<String, Object>>> res = fileController.uploadDirect(
                file, "property-photos", propertyA.getId(), "property", ownerA
        );
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertTrue(res.getBody().isOk());
        assertFalse((Boolean) res.getBody().getData().get("is_private"));
    }

    @Test
    void testDeleteFileOwnerAllowedAndCrossUserForbidden() {
        byte[] validPdfBytes = "%PDF-1.7\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "owner_doc.pdf", "application/pdf", validPdfBytes);

        ResponseEntity<ApiResponse<Map<String, Object>>> uploadRes = fileController.uploadDirect(
                file, "kyc-documents", null, "kyc", ownerA
        );
        UUID fileId = (UUID) uploadRes.getBody().getData().get("file_id");

        // User B attempts to delete Owner A's file
        ResponseEntity<ApiResponse<Map<String, String>>> deleteResB = fileController.deleteFileById(fileId, userB);
        assertEquals(HttpStatus.FORBIDDEN, deleteResB.getStatusCode());

        // Owner A deletes their own file
        ResponseEntity<ApiResponse<Map<String, String>>> deleteResA = fileController.deleteFileById(fileId, ownerA);
        assertEquals(HttpStatus.OK, deleteResA.getStatusCode());
        assertTrue(deleteResA.getBody().isOk());
    }
}
