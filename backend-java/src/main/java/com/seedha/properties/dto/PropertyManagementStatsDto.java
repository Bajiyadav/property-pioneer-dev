package com.seedha.properties.dto;

public class PropertyManagementStatsDto {

    private long totalRequests;
    private long submittedCount;
    private long underReviewCount;
    private long moreInformationCount;
    private long approvedCount;
    private long activeCount;
    private long completedCount;
    private long rejectedCount;
    private long cancelledCount;

    public PropertyManagementStatsDto() {}

    public long getTotalRequests() { return totalRequests; }
    public void setTotalRequests(long totalRequests) { this.totalRequests = totalRequests; }

    public long getSubmittedCount() { return submittedCount; }
    public void setSubmittedCount(long submittedCount) { this.submittedCount = submittedCount; }

    public long getUnderReviewCount() { return underReviewCount; }
    public void setUnderReviewCount(long underReviewCount) { this.underReviewCount = underReviewCount; }

    public long getMoreInformationCount() { return moreInformationCount; }
    public void setMoreInformationCount(long moreInformationCount) { this.moreInformationCount = moreInformationCount; }

    public long getApprovedCount() { return approvedCount; }
    public void setApprovedCount(long approvedCount) { this.approvedCount = approvedCount; }

    public long getActiveCount() { return activeCount; }
    public void setActiveCount(long activeCount) { this.activeCount = activeCount; }

    public long getCompletedCount() { return completedCount; }
    public void setCompletedCount(long completedCount) { this.completedCount = completedCount; }

    public long getRejectedCount() { return rejectedCount; }
    public void setRejectedCount(long rejectedCount) { this.rejectedCount = rejectedCount; }

    public long getCancelledCount() { return cancelledCount; }
    public void setCancelledCount(long cancelledCount) { this.cancelledCount = cancelledCount; }
}
