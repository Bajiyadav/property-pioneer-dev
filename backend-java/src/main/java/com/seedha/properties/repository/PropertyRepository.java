package com.seedha.properties.repository;

import com.seedha.properties.entity.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID> {

    List<Property> findByOwnerId(UUID ownerId);

    /**
     * Public catalogue search.
     *
     * {@code is_approved} is part of the predicate, not an afterthought: without
     * it every listing awaiting moderation — including rejected ones — was served
     * to anonymous callers on /api/v2/properties.
     *
     * The count query repeats the spatial predicate. It previously omitted it, so
     * a radius search reported the unfiltered total and paginated past the end of
     * its own result set.
     */
    @Query(value = """
        SELECT * FROM properties p
        WHERE p.is_approved = TRUE
          AND (:stateName IS NULL OR LOWER(p.state_name) = LOWER(:stateName))
          AND (:cityName IS NULL OR LOWER(p.city_name) = LOWER(:cityName))
          AND (:listingType IS NULL OR LOWER(p.listing_type) = LOWER(:listingType))
          AND (:propertyType IS NULL OR LOWER(p.property_type) = LOWER(:propertyType))
          AND (:minPrice IS NULL OR p.price >= :minPrice)
          AND (:maxPrice IS NULL OR p.price <= :maxPrice)
          AND (:bhk IS NULL OR p.bhk = :bhk)
          AND (:lat IS NULL OR :lng IS NULL OR (
                ST_DWithin(
                    p.location,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :radiusMeters
                )
          ))
        ORDER BY p.is_featured DESC, p.created_at DESC
        """,
        countQuery = """
        SELECT count(*) FROM properties p
        WHERE p.is_approved = TRUE
          AND (:stateName IS NULL OR LOWER(p.state_name) = LOWER(:stateName))
          AND (:cityName IS NULL OR LOWER(p.city_name) = LOWER(:cityName))
          AND (:listingType IS NULL OR LOWER(p.listing_type) = LOWER(:listingType))
          AND (:propertyType IS NULL OR LOWER(p.property_type) = LOWER(:propertyType))
          AND (:minPrice IS NULL OR p.price >= :minPrice)
          AND (:maxPrice IS NULL OR p.price <= :maxPrice)
          AND (:bhk IS NULL OR p.bhk = :bhk)
          AND (:lat IS NULL OR :lng IS NULL OR (
                ST_DWithin(
                    p.location,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :radiusMeters
                )
          ))
        """,
        nativeQuery = true)
    Page<Property> searchProperties(
            @Param("stateName") String stateName,
            @Param("cityName") String cityName,
            @Param("listingType") String listingType,
            @Param("propertyType") String propertyType,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("bhk") Integer bhk,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radiusMeters") Double radiusMeters,
            Pageable pageable
    );
}
