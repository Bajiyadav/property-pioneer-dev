package com.seedha.properties;

import com.seedha.properties.controller.AdminPropertyManagementController;
import com.seedha.properties.controller.PropertyController;
import com.seedha.properties.controller.PropertyManagementController;
import com.seedha.properties.dto.*;
import com.seedha.properties.entity.Property;
import com.seedha.properties.repository.PropertyManagementInternalNoteRepository;
import com.seedha.properties.repository.PropertyManagementRequestRepository;
import com.seedha.properties.repository.PropertyRepository;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("staging")
class PropertyManagementSecurityTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private PropertyController propertyController;

    @Autowired
    private PropertyManagementController propertyManagementController;

    @Autowired
    private AdminPropertyManagementController adminPropertyManagementController;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private PropertyManagementRequestRepository requestRepository;

    @Autowired
    private PropertyManagementInternalNoteRepository internalNoteRepository;

    private UserPrincipal ownerA;
    private UserPrincipal ownerB;
    private UserPrincipal adminUser;
    private MockHttpServletRequest mockRequest;

    @BeforeEach
    void setUp() {
        mockRequest = new MockHttpServletRequest();
        mockRequest.setRemoteAddr("127.0.0.1");

        long ts = System.currentTimeMillis();
        ownerA = createPrincipal("pm_owner_a_" + ts + "@test.com", "Owner A", "OWNER");
        ownerB = createPrincipal("pm_owner_b_" + ts + "@test.com", "Owner B", "OWNER");
        adminUser = createPrincipal("pm_admin_" + ts + "@test.com", "Admin User", "ADMIN");
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

    private Property createTestProperty(UserPrincipal owner) {
        PropertyWriteRequest prop = new PropertyWriteRequest();
        prop.setTitle("Rental Villa for " + owner.getEmail());
        prop.setDescription("Managed rental property in prime area");
        prop.setListingType("RENT");
        prop.setPropertyType("VILLA");
        prop.setPrice(new BigDecimal("45000"));
        prop.setStateName("Telangana");
        prop.setCityName("Hyderabad");
        prop.setLocality("Jubilee Hills");
        prop.setAddress("Road 36, Jubilee Hills");
        ResponseEntity<ApiResponse<Property>> resp = propertyController.createProperty(prop, owner);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        return resp.getBody().getData();
    }

    // 1. IDOR Prevention: Owner B cannot request management for Owner A's property
    @Test
    void testIdorPreventedOnPropertyManagementRequest() {
        Property propA = createTestProperty(ownerA);

        CreatePropertyManagementRequestDto dto = new CreatePropertyManagementRequestDto();
        dto.setPropertyId(propA.getId());
        dto.setOwnerContactPhone("9876543210");
        dto.setOwnerNotes("Attempted spoof by Owner B");

        // Owner B attempts to request management for Owner A's property -> Forbidden
        ResponseEntity<ApiResponse<PropertyManagementResponseDto>> resp =
                propertyManagementController.createRequest(dto, ownerB, mockRequest);
        assertEquals(HttpStatus.FORBIDDEN, resp.getStatusCode());

        // Verify no request was created
        assertFalse(requestRepository.existsByPropertyIdAndStatusNotIn(propA.getId(), List.of("COMPLETED", "REJECTED", "CANCELLED")));
    }

    // 2. Legitimate Owner Submission & Duplicate Prevention
    @Test
    void testOwnerSubmissionAndDuplicatePrevention() {
        Property propA = createTestProperty(ownerA);

        CreatePropertyManagementRequestDto dto = new CreatePropertyManagementRequestDto();
        dto.setPropertyId(propA.getId());
        dto.setOwnerContactPhone("9876543210");
        dto.setOwnerNotes("Please manage tenant screening and rent collection");
        dto.setServicesRequested(List.of("TENANT_SCREENING", "RENT_COLLECTION"));

        // First submission succeeds
        ResponseEntity<ApiResponse<PropertyManagementResponseDto>> resp1 =
                propertyManagementController.createRequest(dto, ownerA, mockRequest);
        assertEquals(HttpStatus.CREATED, resp1.getStatusCode());
        assertNotNull(resp1.getBody().getData().getId());
        assertEquals("SUBMITTED", resp1.getBody().getData().getStatus());

        // Second duplicate active submission is rejected with 409 Conflict
        ResponseEntity<ApiResponse<PropertyManagementResponseDto>> resp2 =
                propertyManagementController.createRequest(dto, ownerA, mockRequest);
        assertEquals(HttpStatus.CONFLICT, resp2.getStatusCode());
    }

    // 3. Strict Customer Privacy: Internal Notes are NEVER Exposed to Owner
    @Test
    void testCustomerPrivacyInternalNotesNeverExposedToOwner() {
        Property propA = createTestProperty(ownerA);

        CreatePropertyManagementRequestDto dto = new CreatePropertyManagementRequestDto();
        dto.setPropertyId(propA.getId());
        dto.setOwnerContactPhone("9876543210");
        dto.setOwnerNotes("Prime property");

        ResponseEntity<ApiResponse<PropertyManagementResponseDto>> created =
                propertyManagementController.createRequest(dto, ownerA, mockRequest);
        UUID requestId = created.getBody().getData().getId();

        // Admin adds internal notes about background verification & risk score
        CreateInternalNoteRequestDto noteDto = new CreateInternalNoteRequestDto("CONFIDENTIAL: Legal verification complete. Background score 85/100.");
        ResponseEntity<ApiResponse<InternalNoteResponseDto>> noteResp =
                adminPropertyManagementController.addInternalNote(requestId, noteDto, adminUser, mockRequest);
        assertEquals(HttpStatus.CREATED, noteResp.getStatusCode());

        // 1) Owner GET /my -> customer response has no notes
        ResponseEntity<ApiResponse<List<PropertyManagementResponseDto>>> myRequests =
                propertyManagementController.getMyRequests(ownerA);
        assertEquals(HttpStatus.OK, myRequests.getStatusCode());
        assertFalse(myRequests.getBody().getData().isEmpty());
        // PropertyManagementResponseDto does not even have internal notes field

        // 2) Owner GET /{id} -> customer response has no notes
        ResponseEntity<ApiResponse<PropertyManagementResponseDto>> singleReq =
                propertyManagementController.getRequestById(requestId, ownerA);
        assertEquals(HttpStatus.OK, singleReq.getStatusCode());
        assertEquals("SUBMITTED", singleReq.getBody().getData().getStatus());

        // 3) Owner attempts to access admin endpoint GET /{id}/notes directly -> Forbidden (403)
        ResponseEntity<ApiResponse<List<InternalNoteResponseDto>>> adminNotesAttempt =
                adminPropertyManagementController.getInternalNotes(requestId, ownerA);
        assertEquals(HttpStatus.FORBIDDEN, adminNotesAttempt.getStatusCode());

        // 4) Admin can view internal notes
        ResponseEntity<ApiResponse<List<InternalNoteResponseDto>>> adminNotes =
                adminPropertyManagementController.getInternalNotes(requestId, adminUser);
        assertEquals(HttpStatus.OK, adminNotes.getStatusCode());
        assertEquals(1, adminNotes.getBody().getData().size());
        assertTrue(adminNotes.getBody().getData().get(0).getNote().contains("CONFIDENTIAL"));
    }

    // 4. State Machine Validation
    @Test
    void testStateMachineTransitions() {
        Property propA = createTestProperty(ownerA);

        CreatePropertyManagementRequestDto dto = new CreatePropertyManagementRequestDto();
        dto.setPropertyId(propA.getId());
        dto.setOwnerContactPhone("9876543210");

        ResponseEntity<ApiResponse<PropertyManagementResponseDto>> created =
                propertyManagementController.createRequest(dto, ownerA, mockRequest);
        UUID requestId = created.getBody().getData().getId();

        // Admin attempts invalid direct jump from SUBMITTED -> COMPLETED -> Bad Request
        UpdateManagementStatusRequestDto invalidDto = new UpdateManagementStatusRequestDto();
        invalidDto.setStatus("COMPLETED");
        ResponseEntity<ApiResponse<AdminPropertyManagementResponseDto>> invalidResp =
                adminPropertyManagementController.updateStatus(requestId, invalidDto, adminUser, mockRequest);
        assertEquals(HttpStatus.BAD_REQUEST, invalidResp.getStatusCode());

        // Valid transition: SUBMITTED -> UNDER_REVIEW
        UpdateManagementStatusRequestDto reviewDto = new UpdateManagementStatusRequestDto();
        reviewDto.setStatus("UNDER_REVIEW");
        reviewDto.setAssignedManagerName("Seedha Manager Ravi");
        ResponseEntity<ApiResponse<AdminPropertyManagementResponseDto>> reviewResp =
                adminPropertyManagementController.updateStatus(requestId, reviewDto, adminUser, mockRequest);
        assertEquals(HttpStatus.OK, reviewResp.getStatusCode());
        assertEquals("UNDER_REVIEW", reviewResp.getBody().getData().getStatus());

        // Valid transition: UNDER_REVIEW -> APPROVED
        UpdateManagementStatusRequestDto approveDto = new UpdateManagementStatusRequestDto();
        approveDto.setStatus("APPROVED");
        ResponseEntity<ApiResponse<AdminPropertyManagementResponseDto>> approveResp =
                adminPropertyManagementController.updateStatus(requestId, approveDto, adminUser, mockRequest);
        assertEquals(HttpStatus.OK, approveResp.getStatusCode());
        assertEquals("APPROVED", approveResp.getBody().getData().getStatus());

        // Valid transition: APPROVED -> MANAGEMENT_ACTIVE
        UpdateManagementStatusRequestDto activeDto = new UpdateManagementStatusRequestDto();
        activeDto.setStatus("MANAGEMENT_ACTIVE");
        ResponseEntity<ApiResponse<AdminPropertyManagementResponseDto>> activeResp =
                adminPropertyManagementController.updateStatus(requestId, activeDto, adminUser, mockRequest);
        assertEquals(HttpStatus.OK, activeResp.getStatusCode());
        assertEquals("MANAGEMENT_ACTIVE", activeResp.getBody().getData().getStatus());

        // Valid transition: MANAGEMENT_ACTIVE -> COMPLETED
        UpdateManagementStatusRequestDto completeDto = new UpdateManagementStatusRequestDto();
        completeDto.setStatus("COMPLETED");
        ResponseEntity<ApiResponse<AdminPropertyManagementResponseDto>> completeResp =
                adminPropertyManagementController.updateStatus(requestId, completeDto, adminUser, mockRequest);
        assertEquals(HttpStatus.OK, completeResp.getStatusCode());
        assertEquals("COMPLETED", completeResp.getBody().getData().getStatus());
    }

    // 5. Admin KPIs and Listing
    @Test
    void testAdminStatsAndListing() {
        ResponseEntity<ApiResponse<PropertyManagementStatsDto>> statsResp =
                adminPropertyManagementController.getStats(adminUser);
        assertEquals(HttpStatus.OK, statsResp.getStatusCode());
        assertNotNull(statsResp.getBody().getData());

        ResponseEntity<ApiResponse<Page<AdminPropertyManagementResponseDto>>> listResp =
                adminPropertyManagementController.getAllRequests(null, 0, 10, adminUser);
        assertEquals(HttpStatus.OK, listResp.getStatusCode());
        assertNotNull(listResp.getBody().getData());
    }
}
