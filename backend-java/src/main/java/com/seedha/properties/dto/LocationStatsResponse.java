package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class LocationStatsResponse {

    private String state;
    private String city;

    @JsonProperty("total_listings")
    private long totalListings;

    @JsonProperty("buy_count")
    private long buyCount;

    @JsonProperty("rent_count")
    private long rentCount;

    @JsonProperty("commercial_count")
    private long commercialCount;

    @JsonProperty("verified_count")
    private long verifiedCount;

    @JsonProperty("top_localities")
    private List<LocalityCountDto> topLocalities;

    public LocationStatsResponse() {}

    public LocationStatsResponse(String state, String city, long totalListings, long buyCount, long rentCount,
                                 long commercialCount, long verifiedCount, List<LocalityCountDto> topLocalities) {
        this.state = state;
        this.city = city;
        this.totalListings = totalListings;
        this.buyCount = buyCount;
        this.rentCount = rentCount;
        this.commercialCount = commercialCount;
        this.verifiedCount = verifiedCount;
        this.topLocalities = topLocalities;
    }

    public String getState() { return state; }
    public String getCity() { return city; }
    public long getTotalListings() { return totalListings; }
    public long getBuyCount() { return buyCount; }
    public long getRentCount() { return rentCount; }
    public long getCommercialCount() { return commercialCount; }
    public long getVerifiedCount() { return verifiedCount; }
    public List<LocalityCountDto> getTopLocalities() { return topLocalities; }

    public static class LocalityCountDto {
        private String locality;
        private long count;

        public LocalityCountDto(String locality, long count) {
            this.locality = locality;
            this.count = count;
        }

        public String getLocality() { return locality; }
        public long getCount() { return count; }
    }
}
