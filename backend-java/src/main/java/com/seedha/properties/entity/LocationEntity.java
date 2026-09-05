package com.seedha.properties.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "locations")
public class LocationEntity {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "parent_id", length = 100)
    private String parentId;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode = "IN";

    @Column(nullable = false, length = 20)
    private String type; // COUNTRY, STATE, UNION_TERRITORY, DISTRICT, CITY, TOWN, LOCALITY, PINCODE

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "normalized_name", nullable = false, length = 150)
    private String normalizedName;

    @Column(name = "state_id", length = 100)
    private String stateId;

    @Column(name = "district_id", length = 100)
    private String districtId;

    @Column(name = "city_id", length = 100)
    private String cityId;

    @Column(name = "state_code", length = 10)
    private String stateCode;

    @Column(name = "district_code", length = 50)
    private String districtCode;

    @Column(name = "city_code", length = 50)
    private String cityCode;

    @Column(length = 10)
    private String pincode;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(nullable = false, length = 50)
    private String source = "LGD_CENSUS_INDIA";

    @Column(name = "source_id", length = 50)
    private String sourceId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public LocationEntity() {}

    public LocationEntity(String id, String parentId, String type, String name, String normalizedName,
                          String stateCode, String districtCode, String cityCode, String pincode,
                          Double latitude, Double longitude) {
        this.id = id;
        this.parentId = parentId;
        this.type = type;
        this.name = name;
        this.normalizedName = normalizedName;
        this.stateCode = stateCode;
        this.districtCode = districtCode;
        this.cityCode = cityCode;
        this.pincode = pincode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = "ACTIVE";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNormalizedName() { return normalizedName; }
    public void setNormalizedName(String normalizedName) { this.normalizedName = normalizedName; }

    public String getStateId() { return stateId; }
    public void setStateId(String stateId) { this.stateId = stateId; }

    public String getDistrictId() { return districtId; }
    public void setDistrictId(String districtId) { this.districtId = districtId; }

    public String getCityId() { return cityId; }
    public void setCityId(String cityId) { this.cityId = cityId; }

    public String getStateCode() { return stateCode; }
    public void setStateCode(String stateCode) { this.stateCode = stateCode; }

    public String getDistrictCode() { return districtCode; }
    public void setDistrictCode(String districtCode) { this.districtCode = districtCode; }

    public String getCityCode() { return cityCode; }
    public void setCityCode(String cityCode) { this.cityCode = cityCode; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
