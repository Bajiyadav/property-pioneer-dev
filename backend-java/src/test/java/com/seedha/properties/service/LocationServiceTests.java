package com.seedha.properties.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LocationServiceTests {

    private LocationService locationService;

    @BeforeEach
    void setUp() {
        locationService = new LocationService();
    }

    @Test
    void searchFindsLocalitiesByPrefix() {
        List<LocationService.LocationItem> results = locationService.search("DLF", 5);
        assertFalse(results.isEmpty());
        assertTrue(results.stream().anyMatch(r -> r.locality().contains("DLF")));
        assertEquals("Gurgaon", results.get(0).city());
    }

    @Test
    void searchFindsHitecCityInHyderabad() {
        List<LocationService.LocationItem> results = locationService.search("Hitec", 5);
        assertFalse(results.isEmpty());
        assertEquals("Hitec City", results.get(0).locality());
        assertEquals("Hyderabad", results.get(0).city());
        assertEquals("Telangana", results.get(0).state());
        assertEquals("500081", results.get(0).pincode());
    }

    @Test
    void searchByPincodeWorks() {
        List<LocationService.LocationItem> results = locationService.search("560038", 5);
        assertFalse(results.isEmpty());
        assertEquals("Indiranagar", results.get(0).locality());
        assertEquals("Bangalore", results.get(0).city());
    }

    @Test
    void searchReturnsEmptyForBlankOrShortQuery() {
        assertTrue(locationService.search("", 5).isEmpty());
        assertTrue(locationService.search("a", 5).isEmpty());
        assertTrue(locationService.search(null, 5).isEmpty());
    }

    @Test
    void getCitiesByStateReturnsAccurateList() {
        List<String> haryanaCities = locationService.getCitiesByState("Haryana");
        assertTrue(haryanaCities.contains("Gurgaon"));

        List<String> karnatakaCities = locationService.getCitiesByState("Karnataka");
        assertTrue(karnatakaCities.contains("Bangalore"));
    }

    @Test
    void getAllStatesContainsMajorMetros() {
        List<String> states = locationService.getAllStates();
        assertTrue(states.contains("Haryana"));
        assertTrue(states.contains("Karnataka"));
        assertTrue(states.contains("Maharashtra"));
        assertTrue(states.contains("Telangana"));
    }
}
