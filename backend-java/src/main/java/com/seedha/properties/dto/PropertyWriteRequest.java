package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * The only property fields a client may set.
 *
 * The controller used to bind the {@code Property} entity straight from the
 * request body, so a listing owner could POST {@code isVerified},
 * {@code isFeatured}, {@code status} or {@code viewCount} and publish, verify
 * and promote their own listing without moderation. Trust state is owned by the
 * server and is deliberately absent from this DTO — there is no field to send.
 */
public class PropertyWriteRequest {

    /** Present on an update, absent on a create. Ownership is checked against it. */
    private UUID id;

    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 5000)
    private String description;

    @NotBlank
    @JsonProperty("listing_type")
    private String listingType;

    @NotBlank
    @JsonProperty("property_type")
    private String propertyType;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal price;

    @JsonProperty("security_deposit")
    private BigDecimal securityDeposit;

    @JsonProperty("maintenance_charges")
    private BigDecimal maintenanceCharges;

    @Min(0) @Max(50)
    private Integer bhk;

    @Min(0) @Max(50)
    private Integer bathrooms;

    @Min(1) @Max(1_000_000)
    @JsonProperty("builtup_area_sqft")
    private Integer builtupAreaSqft;

    @JsonProperty("furnishing_status")
    private String furnishingStatus;

    @NotBlank
    @JsonProperty("state_name")
    private String stateName;

    @NotBlank
    @JsonProperty("city_name")
    private String cityName;

    @Size(max = 200)
    private String locality;

    @Size(max = 500)
    private String address;

    @Size(max = 12)
    private String pincode;

    @JsonProperty("latitude")
    private Double latitude;

    @JsonProperty("longitude")
    private Double longitude;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getListingType() { return listingType; }
    public void setListingType(String listingType) { this.listingType = listingType; }
    public String getPropertyType() { return propertyType; }
    public void setPropertyType(String propertyType) { this.propertyType = propertyType; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getSecurityDeposit() { return securityDeposit; }
    public void setSecurityDeposit(BigDecimal securityDeposit) { this.securityDeposit = securityDeposit; }
    public BigDecimal getMaintenanceCharges() { return maintenanceCharges; }
    public void setMaintenanceCharges(BigDecimal maintenanceCharges) { this.maintenanceCharges = maintenanceCharges; }
    public Integer getBhk() { return bhk; }
    public void setBhk(Integer bhk) { this.bhk = bhk; }
    public Integer getBathrooms() { return bathrooms; }
    public void setBathrooms(Integer bathrooms) { this.bathrooms = bathrooms; }
    public Integer getBuiltupAreaSqft() { return builtupAreaSqft; }
    public void setBuiltupAreaSqft(Integer builtupAreaSqft) { this.builtupAreaSqft = builtupAreaSqft; }
    public String getFurnishingStatus() { return furnishingStatus; }
    public void setFurnishingStatus(String furnishingStatus) { this.furnishingStatus = furnishingStatus; }
    public String getStateName() { return stateName; }
    public void setStateName(String stateName) { this.stateName = stateName; }
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }
    public String getLocality() { return locality; }
    public void setLocality(String locality) { this.locality = locality; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
