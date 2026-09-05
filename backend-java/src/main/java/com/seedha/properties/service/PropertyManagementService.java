package com.seedha.properties.service;

import com.seedha.properties.dto.*;
import com.seedha.properties.entity.Property;
import com.seedha.properties.entity.PropertyManagementInternalNote;
import com.seedha.properties.entity.PropertyManagementRequest;
import com.seedha.properties.repository.PropertyManagementInternalNoteRepository;
import com.seedha.properties.repository.PropertyManagementRequestRepository;
import com.seedha.properties.repository.PropertyRepository;
import com.seedha.properties.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PropertyManagementService {

    private static final Logger log = LoggerFactory.getLogger(PropertyManagementService.class);

    public static final Set<String> TERMINAL_STATUSES = Set.of("COMPLETED", "REJECTED", "CANCELLED");
    public static final Set<String> VALID_STATUSES = Set.of(
            "SUBMITTED", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED",
            "APPROVED", "MANAGEMENT_ACTIVE", "COMPLETED", "REJECTED", "CANCELLED"
    );

    private final PropertyManagementRequestRepository requestRepository;
    private final PropertyManagementInternalNoteRepository internalNoteRepository;
    private final PropertyRepository propertyRepository;
    private final SecurityAuditService securityAuditService;

    public PropertyManagementService(
            PropertyManagementRequestRepository requestRepository,
            PropertyManagementInternalNoteRepository internalNoteRepository,
            PropertyRepository propertyRepository,
            SecurityAuditService securityAuditService) {
        this.requestRepository = requestRepository;
        this.internalNoteRepository = internalNoteRepository;
        this.propertyRepository = propertyRepository;
        this.securityAuditService = securityAuditService;
    }

    @Transactional
    public PropertyManagementResponseDto createRequest(CreatePropertyManagementRequestDto dto, UserPrincipal currentUser, String ipAddress) {
        if (currentUser == null) {
            throw new AccessDeniedException("Authentication required");
        }

        Property property = propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new NoSuchElementException("Property not found with ID: " + dto.getPropertyId()));

        // IDOR Prevention: Verify that the caller is the legitimate owner of the property
        boolean isOwner = property.getOwnerId() != null && property.getOwnerId().equals(currentUser.getId());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());
        if (!isOwner && !isAdmin) {
            securityAuditService.logSecurityEvent("UNAUTHORIZED_MANAGEMENT_REQUEST_ATTEMPT", currentUser.getId(), ipAddress, "API",
                    String.format("{\"propertyId\":\"%s\",\"reason\":\"Caller is not property owner\"}", dto.getPropertyId()));
            throw new AccessDeniedException("Forbidden: You can only request property management for properties you own");
        }

        // Check for existing active management request
        if (requestRepository.existsByPropertyIdAndStatusNotIn(dto.getPropertyId(), TERMINAL_STATUSES)) {
            throw new IllegalStateException("An active property management request already exists for this property");
        }

        PropertyManagementRequest request = new PropertyManagementRequest();
        request.setPropertyId(dto.getPropertyId());
        request.setOwnerId(currentUser.getId());
        request.setStatus("SUBMITTED");
        request.setOwnerContactName(dto.getOwnerContactName() != null ? dto.getOwnerContactName() : currentUser.getFullName());
        request.setOwnerContactPhone(dto.getOwnerContactPhone());
        request.setOwnerContactEmail(dto.getOwnerContactEmail() != null ? dto.getOwnerContactEmail() : currentUser.getEmail());
        request.setServicesRequestedList(dto.getServicesRequested());
        request.setOwnerNotes(dto.getOwnerNotes());

        PropertyManagementRequest saved = requestRepository.save(request);

        securityAuditService.logSecurityEvent("PROPERTY_MANAGEMENT_REQUESTED", currentUser.getId(), ipAddress, "API",
                String.format("{\"requestId\":\"%s\",\"propertyId\":\"%s\"}", saved.getId(), saved.getPropertyId()));

        return mapToCustomerDto(saved, property);
    }

    public List<PropertyManagementResponseDto> getOwnerRequests(UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new AccessDeniedException("Authentication required");
        }

        List<PropertyManagementRequest> list = requestRepository.findByOwnerIdOrderByCreatedAtDesc(currentUser.getId());
        return list.stream().map(req -> {
            Property property = propertyRepository.findById(req.getPropertyId()).orElse(null);
            return mapToCustomerDto(req, property);
        }).collect(Collectors.toList());
    }

    public PropertyManagementResponseDto getOwnerRequestById(UUID id, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new AccessDeniedException("Authentication required");
        }

        PropertyManagementRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Management request not found with ID: " + id));

        boolean isOwner = request.getOwnerId() != null && request.getOwnerId().equals(currentUser.getId());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Forbidden: You do not have permission to view this request");
        }

        Property property = propertyRepository.findById(request.getPropertyId()).orElse(null);
        return mapToCustomerDto(request, property);
    }

    @Transactional
    public PropertyManagementResponseDto cancelRequestByOwner(UUID id, UserPrincipal currentUser, String ipAddress) {
        if (currentUser == null) {
            throw new AccessDeniedException("Authentication required");
        }

        PropertyManagementRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Management request not found with ID: " + id));

        boolean isOwner = request.getOwnerId() != null && request.getOwnerId().equals(currentUser.getId());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Forbidden: You do not have permission to cancel this request");
        }

        if (TERMINAL_STATUSES.contains(request.getStatus())) {
            throw new IllegalStateException("Cannot cancel a request that is already in terminal status: " + request.getStatus());
        }

        if ("MANAGEMENT_ACTIVE".equalsIgnoreCase(request.getStatus()) && !isAdmin) {
            throw new IllegalStateException("Active management cannot be cancelled directly by owner. Please contact your assigned Seedha Property Manager.");
        }

        request.setStatus("CANCELLED");
        PropertyManagementRequest updated = requestRepository.save(request);

        securityAuditService.logSecurityEvent("PROPERTY_MANAGEMENT_CANCELLED", currentUser.getId(), ipAddress, "API",
                String.format("{\"requestId\":\"%s\"}", id));

        Property property = propertyRepository.findById(updated.getPropertyId()).orElse(null);
        return mapToCustomerDto(updated, property);
    }

    // ==========================================
    // ADMIN ENDPOINTS & STRICT INTERNAL DATA
    // ==========================================

    public Page<AdminPropertyManagementResponseDto> getAllRequestsForAdmin(String statusFilter, int page, int size, UserPrincipal currentUser) {
        verifyAdmin(currentUser);

        Pageable pageable = PageRequest.of(page, size);
        Page<PropertyManagementRequest> pageResult;

        if (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("ALL")) {
            pageResult = requestRepository.findByStatusOrderByCreatedAtDesc(statusFilter.toUpperCase(), pageable);
        } else {
            pageResult = requestRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return pageResult.map(this::mapToAdminDto);
    }

    public AdminPropertyManagementResponseDto getAdminRequestById(UUID id, UserPrincipal currentUser) {
        verifyAdmin(currentUser);

        PropertyManagementRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Management request not found with ID: " + id));

        return mapToAdminDto(request);
    }

    public PropertyManagementStatsDto getManagementStats(UserPrincipal currentUser) {
        verifyAdmin(currentUser);

        PropertyManagementStatsDto stats = new PropertyManagementStatsDto();
        stats.setTotalRequests(requestRepository.count());
        stats.setSubmittedCount(requestRepository.countByStatus("SUBMITTED"));
        stats.setUnderReviewCount(requestRepository.countByStatus("UNDER_REVIEW"));
        stats.setMoreInformationCount(requestRepository.countByStatus("MORE_INFORMATION_REQUIRED"));
        stats.setApprovedCount(requestRepository.countByStatus("APPROVED"));
        stats.setActiveCount(requestRepository.countByStatus("MANAGEMENT_ACTIVE"));
        stats.setCompletedCount(requestRepository.countByStatus("COMPLETED"));
        stats.setRejectedCount(requestRepository.countByStatus("REJECTED"));
        stats.setCancelledCount(requestRepository.countByStatus("CANCELLED"));
        return stats;
    }

    @Transactional
    public AdminPropertyManagementResponseDto updateStatusByAdmin(
            UUID id, UpdateManagementStatusRequestDto dto, UserPrincipal currentUser, String ipAddress) {
        verifyAdmin(currentUser);

        PropertyManagementRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Management request not found with ID: " + id));

        String targetStatus = dto.getStatus().toUpperCase();
        if (!VALID_STATUSES.contains(targetStatus)) {
            throw new IllegalArgumentException("Invalid status: " + dto.getStatus());
        }

        validateStatusTransition(request.getStatus(), targetStatus);

        request.setStatus(targetStatus);

        if (dto.getAssignedManagerId() != null) {
            request.setAssignedManagerId(dto.getAssignedManagerId());
        }
        if (dto.getAssignedManagerName() != null && !dto.getAssignedManagerName().isBlank()) {
            request.setAssignedManagerName(dto.getAssignedManagerName());
        }

        if ("REJECTED".equals(targetStatus) && dto.getRejectionReason() != null) {
            request.setRejectionReason(dto.getRejectionReason());
        }

        PropertyManagementRequest saved = requestRepository.save(request);

        // If an admin note was attached with this status update, record it in internal notes
        if (dto.getInternalNote() != null && !dto.getInternalNote().isBlank()) {
            PropertyManagementInternalNote note = new PropertyManagementInternalNote(
                    id, currentUser.getId(), currentUser.getFullName(), currentUser.getRole(), dto.getInternalNote()
            );
            internalNoteRepository.save(note);
        }

        securityAuditService.logSecurityEvent("PROPERTY_MANAGEMENT_STATUS_UPDATED", currentUser.getId(), ipAddress, "API",
                String.format("{\"requestId\":\"%s\",\"newStatus\":\"%s\"}", id, targetStatus));

        return mapToAdminDto(saved);
    }

    public List<InternalNoteResponseDto> getInternalNotes(UUID requestId, UserPrincipal currentUser) {
        // STRICT PRIVACY: Only Admins can view internal notes. Owners receive 403 Forbidden!
        verifyAdmin(currentUser);

        if (!requestRepository.existsById(requestId)) {
            throw new NoSuchElementException("Management request not found with ID: " + requestId);
        }

        return internalNoteRepository.findByManagementRequestIdOrderByCreatedAtAsc(requestId)
                .stream()
                .map(this::mapNoteToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public InternalNoteResponseDto addInternalNote(UUID requestId, CreateInternalNoteRequestDto dto, UserPrincipal currentUser, String ipAddress) {
        // STRICT PRIVACY: Only Admins can add internal notes.
        verifyAdmin(currentUser);

        if (!requestRepository.existsById(requestId)) {
            throw new NoSuchElementException("Management request not found with ID: " + requestId);
        }

        PropertyManagementInternalNote note = new PropertyManagementInternalNote(
                requestId,
                currentUser.getId(),
                currentUser.getFullName(),
                currentUser.getRole(),
                dto.getNote()
        );

        PropertyManagementInternalNote saved = internalNoteRepository.save(note);

        securityAuditService.logSecurityEvent("PROPERTY_MANAGEMENT_NOTE_ADDED", currentUser.getId(), ipAddress, "API",
                String.format("{\"requestId\":\"%s\",\"noteId\":\"%s\"}", requestId, saved.getId()));

        return mapNoteToDto(saved);
    }

    // ==========================================
    // HELPER & MAPPING METHODS
    // ==========================================

    private void verifyAdmin(UserPrincipal currentUser) {
        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            throw new AccessDeniedException("Forbidden: Access restricted strictly to Seedha Administrators");
        }
    }

    private void validateStatusTransition(String currentStatus, String targetStatus) {
        if (currentStatus.equals(targetStatus)) {
            return;
        }

        if (TERMINAL_STATUSES.contains(currentStatus)) {
            throw new IllegalStateException(String.format("Cannot transition from terminal status %s to %s", currentStatus, targetStatus));
        }

        // Enforce valid state progression
        boolean valid = switch (currentStatus) {
            case "SUBMITTED" -> Set.of("UNDER_REVIEW", "CANCELLED", "REJECTED").contains(targetStatus);
            case "UNDER_REVIEW" -> Set.of("APPROVED", "MORE_INFORMATION_REQUIRED", "REJECTED", "CANCELLED").contains(targetStatus);
            case "MORE_INFORMATION_REQUIRED" -> Set.of("UNDER_REVIEW", "CANCELLED", "REJECTED").contains(targetStatus);
            case "APPROVED" -> Set.of("MANAGEMENT_ACTIVE", "CANCELLED", "REJECTED").contains(targetStatus);
            case "MANAGEMENT_ACTIVE" -> Set.of("COMPLETED", "CANCELLED").contains(targetStatus);
            default -> false;
        };

        if (!valid) {
            throw new IllegalStateException(String.format("Invalid status transition from %s to %s", currentStatus, targetStatus));
        }
    }

    private PropertyManagementResponseDto mapToCustomerDto(PropertyManagementRequest entity, Property property) {
        PropertyManagementResponseDto dto = new PropertyManagementResponseDto();
        dto.setId(entity.getId());
        dto.setPropertyId(entity.getPropertyId());
        dto.setOwnerId(entity.getOwnerId());
        dto.setStatus(entity.getStatus());
        dto.setAssignedManagerName(entity.getAssignedManagerName());
        dto.setOwnerContactName(entity.getOwnerContactName());
        dto.setOwnerContactPhone(entity.getOwnerContactPhone());
        dto.setOwnerContactEmail(entity.getOwnerContactEmail());
        dto.setServicesRequested(entity.getServicesRequestedList());
        dto.setOwnerNotes(entity.getOwnerNotes());
        dto.setRejectionReason(entity.getRejectionReason());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (property != null) {
            dto.setPropertyTitle(property.getTitle());
            dto.setPropertyCity(property.getCityName());
        }

        return dto;
    }

    private AdminPropertyManagementResponseDto mapToAdminDto(PropertyManagementRequest entity) {
        AdminPropertyManagementResponseDto dto = new AdminPropertyManagementResponseDto();
        dto.setId(entity.getId());
        dto.setPropertyId(entity.getPropertyId());
        dto.setOwnerId(entity.getOwnerId());
        dto.setStatus(entity.getStatus());
        dto.setAssignedManagerId(entity.getAssignedManagerId());
        dto.setAssignedManagerName(entity.getAssignedManagerName());
        dto.setOwnerContactName(entity.getOwnerContactName());
        dto.setOwnerContactPhone(entity.getOwnerContactPhone());
        dto.setOwnerContactEmail(entity.getOwnerContactEmail());
        dto.setServicesRequested(entity.getServicesRequestedList());
        dto.setOwnerNotes(entity.getOwnerNotes());
        dto.setRejectionReason(entity.getRejectionReason());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        Property property = propertyRepository.findById(entity.getPropertyId()).orElse(null);
        if (property != null) {
            dto.setPropertyTitle(property.getTitle());
            dto.setPropertyCity(property.getCityName());
            dto.setPropertyType(property.getPropertyType());
            dto.setListingType(property.getListingType());
        }

        List<InternalNoteResponseDto> notes = internalNoteRepository
                .findByManagementRequestIdOrderByCreatedAtAsc(entity.getId())
                .stream()
                .map(this::mapNoteToDto)
                .collect(Collectors.toList());
        dto.setInternalNotes(notes);

        return dto;
    }

    private InternalNoteResponseDto mapNoteToDto(PropertyManagementInternalNote note) {
        return new InternalNoteResponseDto(
                note.getId(),
                note.getManagementRequestId(),
                note.getAuthorId(),
                note.getAuthorName(),
                note.getAuthorRole(),
                note.getNote(),
                note.getCreatedAt()
        );
    }
}
