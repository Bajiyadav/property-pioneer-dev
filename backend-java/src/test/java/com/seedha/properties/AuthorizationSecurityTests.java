package com.seedha.properties;

import com.seedha.properties.controller.*;
import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.dto.AuthRequest;
import com.seedha.properties.dto.AuthResponse;
import com.seedha.properties.dto.PropertyWriteRequest;
import com.seedha.properties.dto.UserProfileDto;
import com.seedha.properties.entity.*;
import com.seedha.properties.repository.*;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("staging")
class AuthorizationSecurityTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private PropertyController propertyController;

    @Autowired
    private EnquiryController enquiryController;

    @Autowired
    private SiteVisitController siteVisitController;

    @Autowired
    private FavoriteController favoriteController;

    @Autowired
    private RentalAgreementController rentalAgreementController;

    @Autowired
    private NotificationController notificationController;

    @Autowired
    private HomeLoanController homeLoanController;

    @Autowired
    private UserProfileController userProfileController;

    @Autowired
    private AdminUserController adminUserController;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private EnquiryRepository enquiryRepository;

    @Autowired
    private SiteVisitRepository siteVisitRepository;

    @Autowired
    private RentalAgreementRepository rentalAgreementRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private HomeLoanRepository homeLoanRepository;

    private UserPrincipal customerA;
    private UserPrincipal customerB;
    private UserPrincipal ownerA;
    private UserPrincipal ownerB;
    private UserPrincipal adminUser;

    @BeforeEach
    void setUp() {
        customerA = createPrincipal("cust_a_" + System.currentTimeMillis() + "@test.com", "Customer A", "SEEKER");
        customerB = createPrincipal("cust_b_" + System.currentTimeMillis() + "@test.com", "Customer B", "SEEKER");
        ownerA = createPrincipal("owner_a_" + System.currentTimeMillis() + "@test.com", "Owner A", "OWNER");
        ownerB = createPrincipal("owner_b_" + System.currentTimeMillis() + "@test.com", "Owner B", "OWNER");
        adminUser = createPrincipal("admin_" + System.currentTimeMillis() + "@test.com", "Admin User", "ADMIN");
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

    // 1. Unauthenticated access rejected
    @Test
    void testUnauthenticatedAccessRejected() {
        ResponseEntity<ApiResponse<Property>> propResp = propertyController.createProperty(new PropertyWriteRequest(), null);
        assertEquals(HttpStatus.UNAUTHORIZED, propResp.getStatusCode());

        ResponseEntity<ApiResponse<List<Enquiry>>> enqResp = enquiryController.getEnquiries("seeker", null);
        assertEquals(HttpStatus.UNAUTHORIZED, enqResp.getStatusCode());

        ResponseEntity<ApiResponse<List<SiteVisit>>> visitResp = siteVisitController.getVisits("seeker", null);
        assertEquals(HttpStatus.UNAUTHORIZED, visitResp.getStatusCode());

        ResponseEntity<ApiResponse<UserProfileDto>> profResp = userProfileController.getProfile(null);
        assertEquals(HttpStatus.UNAUTHORIZED, profResp.getStatusCode());
    }

    // 2. Owner A vs Owner B: Property IDOR on Update & Delete
    @Test
    void testOwnerPropertyIdorProtection() {
        PropertyWriteRequest propA = new PropertyWriteRequest();
        propA.setTitle("Owner A Property");
        propA.setDescription("Spacious apartment in Madhapur");
        propA.setListingType("BUY");
        propA.setPropertyType("APARTMENT");
        propA.setPrice(new BigDecimal("9000000"));
        propA.setStateName("Telangana");
        propA.setCityName("Hyderabad");
        propA.setLocality("Madhapur");
        propA.setAddress("Street 1, Madhapur");

        ResponseEntity<ApiResponse<Property>> created = propertyController.createProperty(propA, ownerA);
        assertEquals(HttpStatus.OK, created.getStatusCode());
        UUID propId = created.getBody().getData().getId();

        // Owner B attempts to update Owner A's property -> Forbidden
        PropertyWriteRequest updateAttempt = new PropertyWriteRequest();
        updateAttempt.setId(propId);
        updateAttempt.setTitle("Hacked Title by Owner B");
        ResponseEntity<ApiResponse<Property>> updateResp = propertyController.saveProperty(updateAttempt, ownerB);
        assertEquals(HttpStatus.FORBIDDEN, updateResp.getStatusCode());

        // Owner B attempts to delete Owner A's property -> Forbidden
        ResponseEntity<ApiResponse<Void>> deleteResp = propertyController.deleteProperty(propId, ownerB);
        assertEquals(HttpStatus.FORBIDDEN, deleteResp.getStatusCode());

        // Verify property is still intact in DB
        Property intact = propertyRepository.findById(propId).orElseThrow();
        assertEquals("Owner A Property", intact.getTitle());
    }

    private Property createTestProperty(UserPrincipal owner) {
        PropertyWriteRequest prop = new PropertyWriteRequest();
        prop.setTitle("Test Property for " + owner.getEmail());
        prop.setDescription("Prime luxury property");
        prop.setListingType("BUY");
        prop.setPropertyType("APARTMENT");
        prop.setPrice(new BigDecimal("12000000"));
        prop.setStateName("Telangana");
        prop.setCityName("Hyderabad");
        prop.setLocality("Gachibowli");
        prop.setAddress("Street 42, Gachibowli");
        ResponseEntity<ApiResponse<Property>> resp = propertyController.createProperty(prop, owner);
        return resp.getBody().getData();
    }

    // 3. Enquiry IDOR: Customer A vs Customer B & Owner A vs Owner B
    @Test
    void testEnquiryIdorProtection() {
        Property propA = createTestProperty(ownerA);
        Enquiry enqA = new Enquiry();
        enqA.setPropertyId(propA.getId());
        enqA.setPhone("9876543210");
        enqA.setMessage("Private Enquiry from Customer A");
        ResponseEntity<ApiResponse<Enquiry>> created = enquiryController.createEnquiry(enqA, customerA);
        assertEquals(HttpStatus.OK, created.getStatusCode());
        UUID enqId = created.getBody().getData().getId();

        // Customer B attempts to view Customer A's enquiry -> Forbidden
        ResponseEntity<ApiResponse<Enquiry>> viewRespB = enquiryController.getEnquiryById(enqId, customerB);
        assertEquals(HttpStatus.FORBIDDEN, viewRespB.getStatusCode());

        // Owner B attempts to view Customer A's enquiry -> Forbidden
        ResponseEntity<ApiResponse<Enquiry>> viewRespOwnerB = enquiryController.getEnquiryById(enqId, ownerB);
        assertEquals(HttpStatus.FORBIDDEN, viewRespOwnerB.getStatusCode());

        // Collection search does not leak Customer A's enquiry to Customer B
        ResponseEntity<ApiResponse<List<Enquiry>>> listRespB = enquiryController.getEnquiries("seeker", customerB);
        assertTrue(listRespB.getBody().getData().stream().noneMatch(e -> e.getId().equals(enqId)));
    }

    // 4. Site Visit IDOR: Customer & Owner Isolation
    @Test
    void testSiteVisitIdorProtection() {
        Property propA = createTestProperty(ownerA);
        SiteVisit visit = new SiteVisit();
        visit.setPropertyId(propA.getId());
        visit.setOwnerId(ownerA.getId());
        visit.setVisitDate(java.time.LocalDate.now().plusDays(2));
        visit.setTimeSlot("10:00 AM");
        ResponseEntity<ApiResponse<SiteVisit>> created = siteVisitController.scheduleVisit(visit, customerA);
        assertEquals(HttpStatus.OK, created.getStatusCode());
        UUID visitId = created.getBody().getData().getId();

        // Customer B attempts to modify status of Customer A's visit -> Forbidden
        ResponseEntity<ApiResponse<SiteVisit>> patchResp = siteVisitController.updateVisitStatus(
                Map.of("id", visitId.toString(), "status", "CONFIRMED"), customerB);
        assertEquals(HttpStatus.FORBIDDEN, patchResp.getStatusCode());

        // Owner B attempts to modify status of Owner A's visit -> Forbidden
        ResponseEntity<ApiResponse<SiteVisit>> patchRespOwnerB = siteVisitController.updateVisitStatus(
                Map.of("id", visitId.toString(), "status", "CONFIRMED"), ownerB);
        assertEquals(HttpStatus.FORBIDDEN, patchRespOwnerB.getStatusCode());
    }

    // 5. Rental Agreement IDOR: Tenant & Owner Isolation
    @Test
    void testRentalAgreementIdorProtection() {
        Property propA = createTestProperty(ownerA);
        RentalAgreement agreement = new RentalAgreement();
        agreement.setPropertyId(propA.getId());
        agreement.setTenantId(customerA.getId());
        agreement.setMonthlyRent(new BigDecimal("25000"));
        ResponseEntity<ApiResponse<RentalAgreement>> created = rentalAgreementController.createAgreement(agreement, ownerA);
        assertEquals(HttpStatus.OK, created.getStatusCode());
        UUID agreementId = created.getBody().getData().getId();

        // Unrelated Customer B attempts to access Agreement -> Forbidden
        ResponseEntity<ApiResponse<RentalAgreement>> viewResp = rentalAgreementController.getAgreementById(agreementId, customerB);
        assertEquals(HttpStatus.FORBIDDEN, viewResp.getStatusCode());

        // Unrelated Owner B attempts to access Agreement -> Forbidden
        ResponseEntity<ApiResponse<RentalAgreement>> viewRespOwnerB = rentalAgreementController.getAgreementById(agreementId, ownerB);
        assertEquals(HttpStatus.FORBIDDEN, viewRespOwnerB.getStatusCode());
    }

    // 6. Home Loan IDOR: Sensitive Financial Data Protection
    @Test
    void testHomeLoanIdorProtection() {
        HomeLoanEnquiry loan = new HomeLoanEnquiry();
        loan.setFullName("Customer A");
        loan.setEmail("customer_a@test.com");
        loan.setPhone("9876543210");
        loan.setEmploymentType("SALARIED");
        loan.setCityName("Hyderabad");
        loan.setLoanAmount(new BigDecimal("5000000"));
        loan.setMonthlyIncome(new BigDecimal("150000"));
        ResponseEntity<ApiResponse<HomeLoanEnquiry>> created = homeLoanController.submitHomeLoan(loan, customerA);
        assertEquals(HttpStatus.OK, created.getStatusCode());
        UUID loanId = created.getBody().getData().getId();

        // Customer B attempts to view Customer A's financial record -> Forbidden
        ResponseEntity<ApiResponse<HomeLoanEnquiry>> viewResp = homeLoanController.getHomeLoanById(loanId, customerB);
        assertEquals(HttpStatus.FORBIDDEN, viewResp.getStatusCode());
    }

    // 7. Mass-Assignment & Privilege Escalation Attack Rejection
    @Test
    void testMassAssignmentAndRoleEscalationPrevention() {
        // Customer attempts to escalate role to ADMIN and change userId via payload
        Map<String, Object> maliciousPayload = Map.of(
                "role", "ADMIN",
                "is_admin", true,
                "user_id", UUID.randomUUID().toString(),
                "full_name", "Legitimate Name Update"
        );

        ResponseEntity<ApiResponse<UserProfileDto>> updateResp = userProfileController.updateProfile(maliciousPayload, customerA);
        assertEquals(HttpStatus.OK, updateResp.getStatusCode());

        UserProfileDto profile = updateResp.getBody().getData();
        assertEquals("Legitimate Name Update", profile.getFullName(), "Allowed field updated");
        assertEquals("SEEKER", profile.getRole(), "Privileged role escalation MUST be rejected");
        assertEquals(customerA.getId(), profile.getId(), "User ID cannot be altered by client payload");
    }

    // 8. Admin Endpoint Protection
    @Test
    void testAdminEndpointRoleProtection() {
        // Customer attempts to access Admin User list -> Forbidden
        ResponseEntity<ApiResponse<List<User>>> custResp = adminUserController.listUsers(customerA);
        assertEquals(HttpStatus.FORBIDDEN, custResp.getStatusCode());

        // Owner attempts to access Admin User list -> Forbidden
        ResponseEntity<ApiResponse<List<User>>> ownerResp = adminUserController.listUsers(ownerA);
        assertEquals(HttpStatus.FORBIDDEN, ownerResp.getStatusCode());

        // Admin successfully accesses Admin User list
        ResponseEntity<ApiResponse<List<User>>> adminResp = adminUserController.listUsers(adminUser);
        assertEquals(HttpStatus.OK, adminResp.getStatusCode());
    }

    // 9. Random / Non-existent UUID enumeration safety
    @Test
    void testRandomUuidEnumerationSafety() {
        UUID nonExistentId = UUID.randomUUID();
        ResponseEntity<ApiResponse<Enquiry>> enqResp = enquiryController.getEnquiryById(nonExistentId, customerA);
        assertEquals(HttpStatus.NOT_FOUND, enqResp.getStatusCode());

        ResponseEntity<ApiResponse<RentalAgreement>> agrResp = rentalAgreementController.getAgreementById(nonExistentId, customerA);
        assertEquals(HttpStatus.NOT_FOUND, agrResp.getStatusCode());

        ResponseEntity<ApiResponse<HomeLoanEnquiry>> loanResp = homeLoanController.getHomeLoanById(nonExistentId, customerA);
        assertEquals(HttpStatus.NOT_FOUND, loanResp.getStatusCode());
    }
}
