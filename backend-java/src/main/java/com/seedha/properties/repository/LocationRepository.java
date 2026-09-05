package com.seedha.properties.repository;

import com.seedha.properties.entity.LocationEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<LocationEntity, String> {

    List<LocationEntity> findByTypeInOrderByNameAsc(List<String> types);

    List<LocationEntity> findByParentIdOrderByNameAsc(String parentId);

    List<LocationEntity> findByStateCodeAndTypeInOrderByNameAsc(String stateCode, List<String> types);

    List<LocationEntity> findByStateIdAndTypeInOrderByNameAsc(String stateId, List<String> types);

    List<LocationEntity> findByDistrictIdAndTypeInOrderByNameAsc(String districtId, List<String> types);

    List<LocationEntity> findByCityIdAndTypeInOrderByNameAsc(String cityId, List<String> types);

    List<LocationEntity> findByCityIdAndTypeOrderByNameAsc(String cityId, String type);

    Optional<LocationEntity> findByPincode(String pincode);

    Optional<LocationEntity> findByNormalizedName(String normalizedName);

    @Query("""
        SELECT l FROM LocationEntity l
        WHERE l.status = 'ACTIVE'
          AND (:type IS NULL OR l.type = :type)
          AND (:stateCode IS NULL OR l.stateCode = :stateCode)
          AND (
            LOWER(l.normalizedName) LIKE LOWER(CONCAT(:query, '%'))
            OR LOWER(l.name) LIKE LOWER(CONCAT('%', :query, '%'))
            OR (l.pincode IS NOT NULL AND l.pincode LIKE CONCAT(:query, '%'))
          )
        ORDER BY
          CASE
            WHEN LOWER(l.name) = LOWER(:query) THEN 0
            WHEN LOWER(l.name) LIKE LOWER(CONCAT(:query, '%')) THEN 1
            ELSE 2
          END,
          l.name ASC
        """)
    List<LocationEntity> searchLocations(
            @Param("query") String query,
            @Param("type") String type,
            @Param("stateCode") String stateCode,
            Pageable pageable
    );
}
