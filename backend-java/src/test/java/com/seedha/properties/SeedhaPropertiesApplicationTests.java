package com.seedha.properties;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("staging")
class SeedhaPropertiesApplicationTests {

    @Autowired
    private DataSource dataSource;

    @Test
    void contextLoads() {
        assertNotNull(dataSource, "DataSource should be initialized by Spring Boot");
    }

    @Test
    void testNeonDatabaseConnection() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT 1")) {
            assertTrue(rs.next(), "Database query should return at least one row");
            assertEquals(1, rs.getInt(1), "SELECT 1 should return 1");
        }
    }

    @Test
    void testPostGisExtensionLoaded() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT PostGIS_Version()")) {
            assertTrue(rs.next(), "PostGIS should be loaded and return version string");
            String version = rs.getString(1);
            assertNotNull(version, "PostGIS version should not be null");
            assertTrue(version.startsWith("3."), "PostGIS version should be 3.x");
        }
    }
}
