package com.seedha.properties;

import com.seedha.properties.entity.Property;
import com.seedha.properties.repository.PropertyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("staging")
class PropertyRepositoryTests {

    @Autowired
    private PropertyRepository propertyRepository;

    @Test
    void testSpatialPropertySearchHyderabad() {
        // Search properties within 5000m of Madhapur (lat: 17.4483, lng: 78.3742)
        Page<Property> results = propertyRepository.searchProperties(
                null,
                "Hyderabad",
                null,
                null,
                null,
                null,
                null,
                17.4483,
                78.3742,
                5000.0,
                PageRequest.of(0, 10)
        );

        assertNotNull(results);
        assertFalse(results.isEmpty(), "Should find at least 1 property near Madhapur/Hitec City in Hyderabad");
        Property prop = results.getContent().get(0);
        assertEquals("Hyderabad", prop.getCityName());
    }

    @Test
    void testSpatialPropertySearchBengaluru() {
        // Search properties within 10000m of MG Road (lat: 12.9716, lng: 77.5946)
        Page<Property> results = propertyRepository.searchProperties(
                null,
                "Bengaluru",
                null,
                null,
                null,
                null,
                null,
                12.9716,
                77.5946,
                10000.0,
                PageRequest.of(0, 10)
        );

        assertNotNull(results);
        assertFalse(results.isEmpty(), "Should find at least 1 property near Indiranagar/MG Road in Bengaluru");
        Property prop = results.getContent().get(0);
        assertEquals("Bengaluru", prop.getCityName());
    }

    @Test
    void testSpatialPropertySearchMumbai() {
        // Search properties within 3000m of Bandra (lat: 19.0600, lng: 72.8300)
        Page<Property> results = propertyRepository.searchProperties(
                null,
                "Mumbai",
                null,
                null,
                null,
                null,
                null,
                19.0600,
                72.8300,
                3000.0,
                PageRequest.of(0, 10)
        );

        assertNotNull(results);
        assertFalse(results.isEmpty(), "Should find at least 1 property near Bandra in Mumbai");
        Property prop = results.getContent().get(0);
        assertEquals("Mumbai", prop.getCityName());
    }
}
