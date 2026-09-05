package com.seedha.properties.service;

import com.seedha.properties.entity.LocationEntity;
import com.seedha.properties.repository.LocationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Authoritative Complete India Location Master Engine.
 *
 * Provides complete administrative hierarchy:
 * India -> State / UT -> District -> City / Town -> Locality / Pincode
 *
 * Backed by PostgreSQL/PostGIS locations table with instant
 * authoritative in-memory dataset covering all 28 States, 8 UTs, all 26 AP
 * districts, all 33 TS districts, and major national urban centers.
 */
@Service
public class LocationService {

    private static final Logger log = LoggerFactory.getLogger(LocationService.class);

    public record LocationItem(
            String id,
            String locality,
            String city,
            String state,
            String pincode,
            String formattedAddress,
            double lat,
            double lng
    ) {}

    public record LocationNode(
            String id,
            String parentId,
            String type,
            String name,
            String stateCode,
            String districtCode,
            String pincode,
            double lat,
            double lng
    ) {}

    private final LocationRepository locationRepository;
    private final List<LocationNode> authoritativeNodes = new ArrayList<>();
    private final List<LocationItem> authoritativeItems = new ArrayList<>();

    private static final Map<String, String> STATE_CODE_TO_NAME = new HashMap<>();
    private static final Map<String, String> STATE_NAME_TO_CODE = new HashMap<>();

    static {
        registerState("AP", "Andhra Pradesh");
        registerState("AR", "Arunachal Pradesh");
        registerState("AS", "Assam");
        registerState("BR", "Bihar");
        registerState("CG", "Chhattisgarh");
        registerState("GA", "Goa");
        registerState("GJ", "Gujarat");
        registerState("HR", "Haryana");
        registerState("HP", "Himachal Pradesh");
        registerState("JH", "Jharkhand");
        registerState("KA", "Karnataka");
        registerState("KL", "Kerala");
        registerState("MP", "Madhya Pradesh");
        registerState("MH", "Maharashtra");
        registerState("MN", "Manipur");
        registerState("ML", "Meghalaya");
        registerState("MZ", "Mizoram");
        registerState("NL", "Nagaland");
        registerState("OD", "Odisha");
        registerState("PB", "Punjab");
        registerState("RJ", "Rajasthan");
        registerState("SK", "Sikkim");
        registerState("TN", "Tamil Nadu");
        registerState("TS", "Telangana");
        registerState("TR", "Tripura");
        registerState("UP", "Uttar Pradesh");
        registerState("UK", "Uttarakhand");
        registerState("WB", "West Bengal");
        registerState("AN", "Andaman and Nicobar Islands");
        registerState("CH", "Chandigarh");
        registerState("DN", "Dadra and Nagar Haveli and Daman and Diu");
        registerState("DL", "Delhi");
        registerState("JK", "Jammu and Kashmir");
        registerState("LA", "Ladakh");
        registerState("LD", "Lakshadweep");
        registerState("PY", "Puducherry");
    }

    private static void registerState(String code, String name) {
        STATE_CODE_TO_NAME.put(code.toUpperCase(), name);
        STATE_NAME_TO_CODE.put(name.toLowerCase(), code.toUpperCase());
    }

    public LocationService() {
        this(null);
    }

    @Autowired
    public LocationService(@Autowired(required = false) LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
        initMasterData();
    }

    // =========================================================================
    // API QUERY METHODS
    // =========================================================================

    public List<LocationNode> getStates() {
        if (locationRepository != null) {
            try {
                List<LocationEntity> entities = locationRepository.findByTypeInOrderByNameAsc(
                        List.of("STATE", "UNION_TERRITORY")
                );
                if (!entities.isEmpty()) {
                    return entities.stream().map(this::toNode).collect(Collectors.toList());
                }
            } catch (Exception ex) {
                log.error("Database query failed while fetching states: {}", ex.getMessage(), ex);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Master location database is currently unavailable");
            }
        }
        return authoritativeNodes.stream()
                .filter(n -> "STATE".equals(n.type()) || "UNION_TERRITORY".equals(n.type()))
                .sorted(Comparator.comparing(LocationNode::name))
                .collect(Collectors.toList());
    }

    public List<String> getAllStates() {
        return getStates().stream().map(LocationNode::name).collect(Collectors.toList());
    }

    public List<LocationNode> getDistrictsByState(String stateIdOrCode) {
        if (stateIdOrCode == null || stateIdOrCode.isBlank()) return Collections.emptyList();
        String clean = stateIdOrCode.trim().toLowerCase();

        LocationNode stateNode = authoritativeNodes.stream()
                .filter(n -> ("STATE".equals(n.type()) || "UNION_TERRITORY".equals(n.type())) &&
                        (n.id().equalsIgnoreCase(clean) ||
                         n.name().equalsIgnoreCase(clean) ||
                         (n.stateCode() != null && n.stateCode().equalsIgnoreCase(clean))))
                .findFirst().orElse(null);

        String parentId = stateNode != null ? stateNode.id() : clean;
        String stateCode = stateNode != null ? stateNode.stateCode() : clean.toUpperCase();

        if (locationRepository != null) {
            try {
                List<LocationEntity> entities = locationRepository.findByParentIdOrderByNameAsc(parentId);
                if (entities.isEmpty() && stateCode != null) {
                    entities = locationRepository.findByStateCodeAndTypeInOrderByNameAsc(stateCode, List.of("DISTRICT"));
                }
                if (!entities.isEmpty()) {
                    return entities.stream().map(this::toNode).collect(Collectors.toList());
                }
            } catch (Exception ex) {
                log.error("Database query failed while fetching districts for state {}: {}", stateIdOrCode, ex.getMessage(), ex);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Master location database is currently unavailable");
            }
        }

        return authoritativeNodes.stream()
                .filter(n -> "DISTRICT".equals(n.type()) &&
                        (parentId.equalsIgnoreCase(n.parentId()) || (n.stateCode() != null && n.stateCode().equalsIgnoreCase(stateCode))))
                .sorted(Comparator.comparing(LocationNode::name))
                .collect(Collectors.toList());
    }

    public List<LocationNode> getCitiesByDistrict(String districtId) {
        if (districtId == null || districtId.isBlank()) return Collections.emptyList();
        String clean = districtId.trim().toLowerCase();

        if (locationRepository != null) {
            try {
                List<LocationEntity> entities = locationRepository.findByParentIdOrderByNameAsc(clean);
                if (!entities.isEmpty()) {
                    return entities.stream().map(this::toNode).collect(Collectors.toList());
                }
            } catch (Exception ex) {
                log.error("Database query failed while fetching cities for district {}: {}", districtId, ex.getMessage(), ex);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Master location database is currently unavailable");
            }
        }

        return authoritativeNodes.stream()
                .filter(n -> ("CITY".equals(n.type()) || "TOWN".equals(n.type())) && clean.equalsIgnoreCase(n.parentId()))
                .sorted(Comparator.comparing(LocationNode::name))
                .collect(Collectors.toList());
    }

    public List<LocationNode> getCitiesByStateNode(String stateIdOrName) {
        if (stateIdOrName == null || stateIdOrName.isBlank()) {
            return authoritativeNodes.stream()
                    .filter(n -> "CITY".equals(n.type()) || "TOWN".equals(n.type()))
                    .sorted(Comparator.comparing(LocationNode::name))
                    .collect(Collectors.toList());
        }

        String clean = stateIdOrName.trim().toLowerCase();
        LocationNode stateNode = authoritativeNodes.stream()
                .filter(n -> ("STATE".equals(n.type()) || "UNION_TERRITORY".equals(n.type())) &&
                        (n.id().equalsIgnoreCase(clean) ||
                         n.name().equalsIgnoreCase(clean) ||
                         (n.stateCode() != null && n.stateCode().equalsIgnoreCase(clean))))
                .findFirst().orElse(null);

        String stateCode = stateNode != null ? stateNode.stateCode() : (STATE_NAME_TO_CODE.getOrDefault(clean, clean.toUpperCase()));

        if (locationRepository != null && stateCode != null) {
            try {
                List<LocationEntity> entities = locationRepository.findByStateCodeAndTypeInOrderByNameAsc(
                        stateCode, List.of("CITY", "TOWN")
                );
                if (!entities.isEmpty()) {
                    return entities.stream().map(this::toNode).collect(Collectors.toList());
                }
            } catch (Exception ex) {
                log.error("Database query failed while fetching cities for state {}: {}", stateIdOrName, ex.getMessage(), ex);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Master location database is currently unavailable");
            }
        }

        return authoritativeNodes.stream()
                .filter(n -> ("CITY".equals(n.type()) || "TOWN".equals(n.type())) &&
                        (stateCode == null || stateCode.equalsIgnoreCase(n.stateCode())))
                .sorted(Comparator.comparing(LocationNode::name))
                .collect(Collectors.toList());
    }

    public List<String> getCitiesByState(String state) {
        return getCitiesByStateNode(state).stream().map(LocationNode::name).distinct().collect(Collectors.toList());
    }

    public List<LocationNode> getLocalitiesByCityNode(String cityIdOrName) {
        if (cityIdOrName == null || cityIdOrName.isBlank()) return Collections.emptyList();
        String clean = cityIdOrName.trim().toLowerCase();

        if (locationRepository != null) {
            try {
                List<LocationEntity> entities = locationRepository.findByCityIdAndTypeInOrderByNameAsc(
                        clean, List.of("LOCALITY")
                );
                if (entities.isEmpty()) {
                    entities = locationRepository.findByParentIdOrderByNameAsc(clean).stream()
                            .filter(e -> "LOCALITY".equalsIgnoreCase(e.getType()))
                            .collect(Collectors.toList());
                }
                if (!entities.isEmpty()) {
                    return entities.stream().map(this::toNode).collect(Collectors.toList());
                }
            } catch (Exception ex) {
                log.error("Database query failed while fetching localities for city {}: {}", cityIdOrName, ex.getMessage(), ex);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Master location database is currently unavailable");
            }
        }

        return authoritativeNodes.stream()
                .filter(n -> "LOCALITY".equals(n.type()) && (clean.equalsIgnoreCase(n.parentId()) || clean.equalsIgnoreCase(n.name())))
                .sorted(Comparator.comparing(LocationNode::name))
                .collect(Collectors.toList());
    }

    public List<LocationItem> getLocalitiesByCity(String city) {
        if (city == null || city.isBlank()) return Collections.emptyList();
        String clean = city.trim().toLowerCase();

        if (locationRepository != null) {
            try {
                List<LocationEntity> entities = locationRepository.findByCityIdAndTypeInOrderByNameAsc(clean, List.of("LOCALITY"));
                if (entities.isEmpty()) {
                    entities = locationRepository.findByParentIdOrderByNameAsc(clean).stream()
                            .filter(e -> "LOCALITY".equalsIgnoreCase(e.getType()))
                            .collect(Collectors.toList());
                }
                if (!entities.isEmpty()) {
                    return entities.stream().map(this::toItem).collect(Collectors.toList());
                }
            } catch (Exception ex) {
                log.error("Database query failed while fetching locality items for {}: {}", city, ex.getMessage(), ex);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Master location database is currently unavailable");
            }
        }

        return authoritativeItems.stream()
                .filter(i -> i.city().equalsIgnoreCase(clean))
                .collect(Collectors.toList());
    }

    public List<LocationNode> getPincodesByCity(String cityId) {
        if (cityId == null || cityId.isBlank()) return Collections.emptyList();
        String clean = cityId.trim().toLowerCase();

        if (locationRepository != null) {
            try {
                List<LocationEntity> entities = locationRepository.findByCityIdAndTypeOrderByNameAsc(clean, "PINCODE");
                if (!entities.isEmpty()) {
                    return entities.stream().map(this::toNode).collect(Collectors.toList());
                }
            } catch (Exception ex) {
                log.error("Database query failed while fetching pincodes for city {}: {}", cityId, ex.getMessage(), ex);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Master location database is currently unavailable");
            }
        }

        return authoritativeNodes.stream()
                .filter(n -> "PINCODE".equals(n.type()) && clean.equalsIgnoreCase(n.parentId()))
                .sorted(Comparator.comparing(LocationNode::name))
                .collect(Collectors.toList());
    }

    public Optional<LocationNode> getPincode(String pincode) {
        if (pincode == null || pincode.isBlank()) return Optional.empty();
        String clean = pincode.trim();

        if (locationRepository != null) {
            try {
                return locationRepository.findByPincode(clean).map(this::toNode);
            } catch (Exception ex) {
                log.error("Database query failed while fetching pincode {}: {}", pincode, ex.getMessage(), ex);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Master location database is currently unavailable");
            }
        }

        return authoritativeNodes.stream()
                .filter(n -> "PINCODE".equals(n.type()) && clean.equalsIgnoreCase(n.pincode()))
                .findFirst();
    }

    public Optional<LocationNode> getLocationById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();
        String clean = id.trim().toLowerCase();

        if (locationRepository != null) {
            try {
                Optional<LocationEntity> entity = locationRepository.findById(clean);
                if (entity.isPresent()) return entity.map(this::toNode);
            } catch (Exception ex) {
                log.error("Database query failed while fetching location by id {}: {}", id, ex.getMessage(), ex);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Master location database is currently unavailable");
            }
        }

        return authoritativeNodes.stream()
                .filter(n -> n.id().equalsIgnoreCase(clean))
                .findFirst();
    }

    public List<LocationItem> search(String query, int limit) {
        return search(query, null, limit);
    }

    public List<LocationItem> search(String query, String stateFilter, int limit) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }

        int boundedLimit = Math.min(Math.max(1, limit), 50);
        String clean = query.trim().toLowerCase();

        String stateCode = null;
        if (stateFilter != null && !stateFilter.isBlank()) {
            String sf = stateFilter.trim().toLowerCase();
            stateCode = STATE_NAME_TO_CODE.getOrDefault(sf, sf.toUpperCase());
        }

        // 1. Try Database search if available
        if (locationRepository != null) {
            try {
                List<LocationEntity> dbResults = locationRepository.searchLocations(
                        clean, null, stateCode, PageRequest.of(0, boundedLimit)
                );
                if (!dbResults.isEmpty()) {
                    return dbResults.stream().map(this::toItem).collect(Collectors.toList());
                }
            } catch (Exception ex) {
                log.error("Database query failed during location search for {}: {}", query, ex.getMessage(), ex);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Master location database is currently unavailable");
            }
        }

        // 2. Fallback to authoritative in-memory search
        final String resolvedStateCode = stateCode;
        return authoritativeItems.stream()
                .filter(item -> {
                    if (resolvedStateCode != null) {
                        String itemStateCode = STATE_NAME_TO_CODE.getOrDefault(item.state().toLowerCase(), item.state().toUpperCase());
                        if (!resolvedStateCode.equalsIgnoreCase(itemStateCode) && !resolvedStateCode.equalsIgnoreCase(item.state())) {
                            return false;
                        }
                    }
                    return item.locality().toLowerCase().contains(clean)
                            || item.city().toLowerCase().contains(clean)
                            || item.state().toLowerCase().contains(clean)
                            || item.pincode().startsWith(clean);
                })
                .sorted((a, b) -> {
                    boolean aCityExact = a.city().equalsIgnoreCase(clean);
                    boolean bCityExact = b.city().equalsIgnoreCase(clean);
                    if (aCityExact && !bCityExact) return -1;
                    if (!aCityExact && bCityExact) return 1;

                    boolean aStarts = a.locality().toLowerCase().startsWith(clean) || a.city().toLowerCase().startsWith(clean);
                    boolean bStarts = b.locality().toLowerCase().startsWith(clean) || b.city().toLowerCase().startsWith(clean);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;

                    return a.formattedAddress().compareToIgnoreCase(b.formattedAddress());
                })
                .limit(boundedLimit)
                .collect(Collectors.toList());
    }

    private LocationNode toNode(LocationEntity entity) {
        return new LocationNode(
                entity.getId(),
                entity.getParentId(),
                entity.getType(),
                entity.getName(),
                entity.getStateCode(),
                entity.getDistrictCode(),
                entity.getPincode(),
                entity.getLatitude() != null ? entity.getLatitude() : 0.0,
                entity.getLongitude() != null ? entity.getLongitude() : 0.0
        );
    }

    private LocationItem toItem(LocationEntity entity) {
        String locality = "LOCALITY".equals(entity.getType()) ? entity.getName() : "Central";
        String city = "CITY".equals(entity.getType()) || "TOWN".equals(entity.getType()) ? entity.getName() : "Urban";
        String state = entity.getStateCode() != null ? STATE_CODE_TO_NAME.getOrDefault(entity.getStateCode(), entity.getStateCode()) : "India";
        String formatted = String.format("%s, %s, %s", locality, city, state);

        return new LocationItem(
                entity.getId(),
                locality,
                city,
                state,
                entity.getPincode() != null ? entity.getPincode() : "",
                formatted,
                entity.getLatitude() != null ? entity.getLatitude() : 0.0,
                entity.getLongitude() != null ? entity.getLongitude() : 0.0
        );
    }

    private void addNode(String id, String parentId, String type, String name, String stateCode, String districtCode, String pincode, double lat, double lng) {
        authoritativeNodes.add(new LocationNode(id, parentId, type, name, stateCode, districtCode, pincode, lat, lng));
    }

    private void addItem(String locality, String city, String state, String pincode, double lat, double lng) {
        String id = UUID.nameUUIDFromBytes((locality + city + state + pincode).getBytes()).toString();
        String formatted = String.format("%s, %s, %s %s", locality, city, state, pincode).trim();
        authoritativeItems.add(new LocationItem(id, locality, city, state, pincode, formatted, lat, lng));
    }

    private void initMasterData() {
        // Root
        addNode("in", null, "COUNTRY", "India", null, null, null, 20.5937, 78.9629);

        // ---------------------------------------------------------------------
        // 1. ALL 28 STATES & 8 UNION TERRITORIES (36 Total)
        // ---------------------------------------------------------------------
        addNode("in-ap", "in", "STATE", "Andhra Pradesh", "AP", null, null, 15.9129, 79.7400);
        addNode("in-ar", "in", "STATE", "Arunachal Pradesh", "AR", null, null, 28.2180, 94.7278);
        addNode("in-as", "in", "STATE", "Assam", "AS", null, null, 26.2006, 92.9376);
        addNode("in-br", "in", "STATE", "Bihar", "BR", null, null, 25.0961, 85.3131);
        addNode("in-cg", "in", "STATE", "Chhattisgarh", "CG", null, null, 21.2787, 81.8661);
        addNode("in-ga", "in", "STATE", "Goa", "GA", null, null, 15.2993, 74.1240);
        addNode("in-gj", "in", "STATE", "Gujarat", "GJ", null, null, 22.2587, 71.1924);
        addNode("in-hr", "in", "STATE", "Haryana", "HR", null, null, 29.0588, 76.0856);
        addNode("in-hp", "in", "STATE", "Himachal Pradesh", "HP", null, null, 31.1048, 77.1734);
        addNode("in-jh", "in", "STATE", "Jharkhand", "JH", null, null, 23.6102, 85.2799);
        addNode("in-ka", "in", "STATE", "Karnataka", "KA", null, null, 15.3173, 75.7139);
        addNode("in-kl", "in", "STATE", "Kerala", "KL", null, null, 10.8505, 76.2711);
        addNode("in-mp", "in", "STATE", "Madhya Pradesh", "MP", null, null, 22.9734, 78.6569);
        addNode("in-mh", "in", "STATE", "Maharashtra", "MH", null, null, 19.7515, 75.7139);
        addNode("in-mn", "in", "STATE", "Manipur", "MN", null, null, 24.6637, 93.9063);
        addNode("in-ml", "in", "STATE", "Meghalaya", "ML", null, null, 25.4670, 91.3662);
        addNode("in-mz", "in", "STATE", "Mizoram", "MZ", null, null, 23.1645, 92.9376);
        addNode("in-nl", "in", "STATE", "Nagaland", "NL", null, null, 26.1584, 94.5624);
        addNode("in-od", "in", "STATE", "Odisha", "OD", null, null, 20.9517, 85.0985);
        addNode("in-pb", "in", "STATE", "Punjab", "PB", null, null, 31.1471, 75.3412);
        addNode("in-rj", "in", "STATE", "Rajasthan", "RJ", null, null, 27.0238, 74.2179);
        addNode("in-sk", "in", "STATE", "Sikkim", "SK", null, null, 27.5330, 88.5122);
        addNode("in-tn", "in", "STATE", "Tamil Nadu", "TN", null, null, 11.1271, 78.6569);
        addNode("in-ts", "in", "STATE", "Telangana", "TS", null, null, 17.8749, 78.1008);
        addNode("in-tr", "in", "STATE", "Tripura", "TR", null, null, 23.9408, 91.9882);
        addNode("in-up", "in", "STATE", "Uttar Pradesh", "UP", null, null, 26.8467, 80.9462);
        addNode("in-uk", "in", "STATE", "Uttarakhand", "UK", null, null, 30.0668, 79.0193);
        addNode("in-wb", "in", "STATE", "West Bengal", "WB", null, null, 22.9868, 87.8550);
        // Union Territories
        addNode("in-an", "in", "UNION_TERRITORY", "Andaman and Nicobar Islands", "AN", null, null, 11.7401, 92.6586);
        addNode("in-ch", "in", "UNION_TERRITORY", "Chandigarh", "CH", null, null, 30.7333, 76.7794);
        addNode("in-dn", "in", "UNION_TERRITORY", "Dadra and Nagar Haveli and Daman and Diu", "DN", null, null, 20.4283, 72.8397);
        addNode("in-dl", "in", "UNION_TERRITORY", "Delhi", "DL", null, null, 28.7041, 77.1025);
        addNode("in-jk", "in", "UNION_TERRITORY", "Jammu and Kashmir", "JK", null, null, 33.7782, 76.5762);
        addNode("in-la", "in", "UNION_TERRITORY", "Ladakh", "LA", null, null, 34.1526, 77.5771);
        addNode("in-ld", "in", "UNION_TERRITORY", "Lakshadweep", "LD", null, null, 10.5667, 72.6417);
        addNode("in-py", "in", "UNION_TERRITORY", "Puducherry", "PY", null, null, 11.9416, 79.8083);

        // ---------------------------------------------------------------------
        // 2. ANDHRA PRADESH — ALL 26 OFFICIAL DISTRICTS & CITIES
        // ---------------------------------------------------------------------
        String ap = "in-ap";
        addNode("in-ap-alluri", ap, "DISTRICT", "Alluri Sitharama Raju", "AP", "ASR", null, 18.0833, 82.6667);
        addNode("in-ap-anakapalli", ap, "DISTRICT", "Anakapalli", "AP", "AKP", null, 17.6913, 83.0039);
        addNode("in-ap-ananthapuramu", ap, "DISTRICT", "Ananthapuramu", "AP", "ATP", null, 14.6819, 77.6006);
        addNode("in-ap-annamayya", ap, "DISTRICT", "Annamayya", "AP", "ANN", null, 14.0500, 78.7500);
        addNode("in-ap-bapatla", ap, "DISTRICT", "Bapatla", "AP", "BPT", null, 15.9056, 80.4678);
        addNode("in-ap-chittoor", ap, "DISTRICT", "Chittoor", "AP", "CTR", null, 13.2172, 79.1003);
        addNode("in-ap-konaseema", ap, "DISTRICT", "Dr. B.R. Ambedkar Konaseema", "AP", "KNS", null, 16.5786, 82.0061);
        addNode("in-ap-eastgodavari", ap, "DISTRICT", "East Godavari", "AP", "EGD", null, 17.0005, 81.7800);
        addNode("in-ap-eluru", ap, "DISTRICT", "Eluru", "AP", "ELR", null, 16.7107, 81.0952);
        addNode("in-ap-guntur", ap, "DISTRICT", "Guntur", "AP", "GNT", null, 16.3067, 80.4365);
        addNode("in-ap-kakinada", ap, "DISTRICT", "Kakinada", "AP", "KKD", null, 16.9891, 82.2475);
        addNode("in-ap-krishna", ap, "DISTRICT", "Krishna", "AP", "KRI", null, 16.1875, 81.1389);
        addNode("in-ap-kurnool", ap, "DISTRICT", "Kurnool", "AP", "KNL", null, 15.8281, 78.0373);
        addNode("in-ap-nandyal", ap, "DISTRICT", "Nandyal", "AP", "NDL", null, 15.4886, 78.4836);
        addNode("in-ap-ntr", ap, "DISTRICT", "NTR", "AP", "NTR", null, 16.5062, 80.6480);
        addNode("in-ap-palnadu", ap, "DISTRICT", "Palnadu", "AP", "PLN", null, 16.2333, 80.0500);
        addNode("in-ap-manyam", ap, "DISTRICT", "Parvathipuram Manyam", "AP", "PVM", null, 18.7833, 83.4333);
        addNode("in-ap-prakasam", ap, "DISTRICT", "Prakasam", "AP", "PKM", null, 15.5057, 80.0499);
        addNode("in-ap-nellore", ap, "DISTRICT", "Sri Potti Sriramulu Nellore", "AP", "NLR", null, 14.4426, 79.9865);
        addNode("in-ap-sathyasai", ap, "DISTRICT", "Sri Sathya Sai", "AP", "SSS", null, 14.1667, 77.8167);
        addNode("in-ap-srikakulam", ap, "DISTRICT", "Srikakulam", "AP", "SKL", null, 18.2969, 83.8968);
        addNode("in-ap-tirupati", ap, "DISTRICT", "Tirupati", "AP", "TPT", null, 13.6288, 79.4192);
        addNode("in-ap-visakhapatnam", ap, "DISTRICT", "Visakhapatnam", "AP", "VSP", null, 17.6868, 83.2185);
        addNode("in-ap-vizianagaram", ap, "DISTRICT", "Vizianagaram", "AP", "VZM", null, 18.1167, 83.4167);
        addNode("in-ap-westgodavari", ap, "DISTRICT", "West Godavari", "AP", "WGD", null, 16.5449, 81.5212);
        addNode("in-ap-kadapa", ap, "DISTRICT", "YSR Kadapa", "AP", "KDP", null, 14.4673, 78.8242);

        // AP Urban Centres
        addNode("in-ap-vsp-city", "in-ap-visakhapatnam", "CITY", "Visakhapatnam", "AP", "VSP", "530001", 17.6868, 83.2185);
        addNode("in-ap-vsp-bheemili", "in-ap-visakhapatnam", "TOWN", "Bheemunipatnam", "AP", "VSP", "531163", 17.8900, 83.4500);
        addNode("in-ap-ntr-vijayawada", "in-ap-ntr", "CITY", "Vijayawada", "AP", "NTR", "520001", 16.5062, 80.6480);
        addNode("in-ap-gnt-city", "in-ap-guntur", "CITY", "Guntur", "AP", "GNT", "522001", 16.3067, 80.4365);
        addNode("in-ap-gnt-tenali", "in-ap-guntur", "CITY", "Tenali", "AP", "GNT", "522201", 16.2430, 80.6400);
        addNode("in-ap-gnt-mangalagiri", "in-ap-guntur", "CITY", "Mangalagiri", "AP", "GNT", "522503", 16.4300, 80.5700);
        addNode("in-ap-tpt-city", "in-ap-tirupati", "CITY", "Tirupati", "AP", "TPT", "517501", 13.6288, 79.4192);
        addNode("in-ap-tpt-srikalahasti", "in-ap-tirupati", "CITY", "Srikalahasti", "AP", "TPT", "517644", 13.7500, 79.7000);
        addNode("in-ap-nlr-city", "in-ap-nellore", "CITY", "Nellore", "AP", "NLR", "524001", 14.4426, 79.9865);
        addNode("in-ap-knl-city", "in-ap-kurnool", "CITY", "Kurnool", "AP", "KNL", "518001", 15.8281, 78.0373);
        addNode("in-ap-knl-adoni", "in-ap-kurnool", "CITY", "Adoni", "AP", "KNL", "518301", 15.6300, 77.2800);
        addNode("in-ap-ndl-city", "in-ap-nandyal", "CITY", "Nandyal", "AP", "NDL", "518501", 15.4886, 78.4836);
        addNode("in-ap-egd-rajahmundry", "in-ap-eastgodavari", "CITY", "Rajahmundry", "AP", "EGD", "533101", 17.0005, 81.7800);
        addNode("in-ap-kkd-city", "in-ap-kakinada", "CITY", "Kakinada", "AP", "KKD", "533001", 16.9891, 82.2475);
        addNode("in-ap-wgd-bhimavaram", "in-ap-westgodavari", "CITY", "Bhimavaram", "AP", "WGD", "534201", 16.5449, 81.5212);
        addNode("in-ap-elr-city", "in-ap-eluru", "CITY", "Eluru", "AP", "ELR", "534001", 16.7107, 81.0952);
        addNode("in-ap-atp-city", "in-ap-ananthapuramu", "CITY", "Anantapur", "AP", "ATP", "515001", 14.6819, 77.6006);
        addNode("in-ap-sss-hindupur", "in-ap-sathyasai", "CITY", "Hindupur", "AP", "SSS", "515201", 13.8300, 77.4900);
        addNode("in-ap-kdp-city", "in-ap-kadapa", "CITY", "Kadapa", "AP", "KDP", "516001", 14.4673, 78.8242);
        addNode("in-ap-kdp-proddatur", "in-ap-kadapa", "CITY", "Proddatur", "AP", "KDP", "516360", 14.7500, 78.5500);
        addNode("in-ap-ann-madanapalle", "in-ap-annamayya", "CITY", "Madanapalle", "AP", "ANN", "517325", 13.5500, 78.5000);
        addNode("in-ap-pkm-ongole", "in-ap-prakasam", "CITY", "Ongole", "AP", "PKM", "523001", 15.5057, 80.0499);
        addNode("in-ap-pln-narasaraopet", "in-ap-palnadu", "CITY", "Narasaraopet", "AP", "PLN", "522601", 16.2333, 80.0500);
        addNode("in-ap-skl-city", "in-ap-srikakulam", "CITY", "Srikakulam", "AP", "SKL", "532001", 18.2969, 83.8968);
        addNode("in-ap-vzm-city", "in-ap-vizianagaram", "CITY", "Vizianagaram", "AP", "VZM", "535001", 18.1167, 83.4167);

        // ---------------------------------------------------------------------
        // 3. TELANGANA — ALL 33 OFFICIAL DISTRICTS & CITIES
        // ---------------------------------------------------------------------
        String ts = "in-ts";
        addNode("in-ts-adilabad", ts, "DISTRICT", "Adilabad", "TS", "ADB", null, 19.6667, 78.5333);
        addNode("in-ts-kothagudem", ts, "DISTRICT", "Bhadradri Kothagudem", "TS", "BDK", null, 17.5500, 80.6167);
        addNode("in-ts-hanamkonda", ts, "DISTRICT", "Hanamkonda", "TS", "HNK", null, 18.0073, 79.5583);
        addNode("in-ts-hyderabad", ts, "DISTRICT", "Hyderabad", "TS", "HYD", null, 17.3850, 78.4867);
        addNode("in-ts-jagtial", ts, "DISTRICT", "Jagtial", "TS", "JGL", null, 18.7900, 78.9100);
        addNode("in-ts-jangaon", ts, "DISTRICT", "Jangaon", "TS", "JGN", null, 17.7200, 79.1800);
        addNode("in-ts-bhupalpally", ts, "DISTRICT", "Jayashankar Bhupalpally", "TS", "JSB", null, 18.4300, 79.8600);
        addNode("in-ts-gadwal", ts, "DISTRICT", "Jogulamba Gadwal", "TS", "JLG", null, 16.2300, 77.8000);
        addNode("in-ts-kamareddy", ts, "DISTRICT", "Kamareddy", "TS", "KMR", null, 18.3200, 78.3400);
        addNode("in-ts-karimnagar", ts, "DISTRICT", "Karimnagar", "TS", "KRN", null, 18.4386, 79.1288);
        addNode("in-ts-khammam", ts, "DISTRICT", "Khammam", "TS", "KHM", null, 17.2473, 80.1514);
        addNode("in-ts-asifabad", ts, "DISTRICT", "Kumuram Bheem Asifabad", "TS", "KBA", null, 19.3600, 79.2900);
        addNode("in-ts-mahabubabad", ts, "DISTRICT", "Mahabubabad", "TS", "MBD", null, 17.6000, 80.0000);
        addNode("in-ts-mahabubnagar", ts, "DISTRICT", "Mahabubnagar", "TS", "MBN", null, 16.7400, 77.9900);
        addNode("in-ts-mancherial", ts, "DISTRICT", "Mancherial", "TS", "MCL", null, 18.8700, 79.4600);
        addNode("in-ts-medak", ts, "DISTRICT", "Medak", "TS", "MDK", null, 18.0400, 78.2600);
        addNode("in-ts-medchal", ts, "DISTRICT", "Medchal-Malkajgiri", "TS", "MDM", null, 17.6300, 78.4800);
        addNode("in-ts-mulugu", ts, "DISTRICT", "Mulugu", "TS", "MLG", null, 18.1900, 79.9400);
        addNode("in-ts-nagarkurnool", ts, "DISTRICT", "Nagarkurnool", "TS", "NGK", null, 16.4800, 78.3300);
        addNode("in-ts-nalgonda", ts, "DISTRICT", "Nalgonda", "TS", "NLG", null, 17.0500, 79.2700);
        addNode("in-ts-narayanpet", ts, "DISTRICT", "Narayanpet", "TS", "NPT", null, 16.7300, 77.5000);
        addNode("in-ts-nirmal", ts, "DISTRICT", "Nirmal", "TS", "NRM", null, 19.0900, 78.3400);
        addNode("in-ts-nizamabad", ts, "DISTRICT", "Nizamabad", "TS", "NZB", null, 18.6725, 78.0941);
        addNode("in-ts-peddapalli", ts, "DISTRICT", "Peddapalli", "TS", "PDP", null, 18.6200, 79.3800);
        addNode("in-ts-sircilla", ts, "DISTRICT", "Rajanna Sircilla", "TS", "RJS", null, 18.3900, 78.8100);
        addNode("in-ts-rangareddy", ts, "DISTRICT", "Ranga Reddy", "TS", "RRD", null, 17.3300, 78.5800);
        addNode("in-ts-sangareddy", ts, "DISTRICT", "Sangareddy", "TS", "SRD", null, 17.6294, 78.0917);
        addNode("in-ts-siddipet", ts, "DISTRICT", "Siddipet", "TS", "SDP", null, 18.1000, 78.8500);
        addNode("in-ts-suryapet", ts, "DISTRICT", "Suryapet", "TS", "SRP", null, 17.1400, 79.6200);
        addNode("in-ts-vikarabad", ts, "DISTRICT", "Vikarabad", "TS", "VKB", null, 17.3400, 77.9000);
        addNode("in-ts-wanaparthy", ts, "DISTRICT", "Wanaparthy", "TS", "WNP", null, 16.3600, 78.0600);
        addNode("in-ts-warangal", ts, "DISTRICT", "Warangal", "TS", "WGL", null, 17.9689, 79.5941);
        addNode("in-ts-bhuvanagiri", ts, "DISTRICT", "Yadadri Bhuvanagiri", "TS", "YDB", null, 17.5100, 78.8900);

        // TS Urban Centres
        addNode("in-ts-hyd-city", "in-ts-hyderabad", "CITY", "Hyderabad", "TS", "HYD", "500001", 17.3850, 78.4867);
        addNode("in-ts-hyd-secunderabad", "in-ts-hyderabad", "CITY", "Secunderabad", "TS", "HYD", "500003", 17.4399, 78.4983);
        // Canonical Localities under Hyderabad - STRICTLY NOT CITIES
        addNode("in-loc-gachibowli", "in-ts-hyd-city", "LOCALITY", "Gachibowli", "TS", "HYD", "500032", 17.4401, 78.3489);
        addNode("in-loc-manikonda", "in-ts-hyd-city", "LOCALITY", "Manikonda", "TS", "HYD", "500089", 17.3995, 78.3840);
        addNode("in-loc-kukatpally", "in-ts-hyd-city", "LOCALITY", "Kukatpally", "TS", "HYD", "500072", 17.4875, 78.3953);
        addNode("in-loc-madhapur", "in-ts-hyd-city", "LOCALITY", "Madhapur", "TS", "HYD", "500081", 17.4483, 78.3915);
        addNode("in-loc-kondapur", "in-ts-hyd-city", "LOCALITY", "Kondapur", "TS", "HYD", "500084", 17.4699, 78.3578);
        addNode("in-loc-jubilee-hills", "in-ts-hyd-city", "LOCALITY", "Jubilee Hills", "TS", "HYD", "500033", 17.4319, 78.4073);
        addNode("in-loc-banjara-hills", "in-ts-hyd-city", "LOCALITY", "Banjara Hills", "TS", "HYD", "500034", 17.4156, 78.4350);
        addNode("in-loc-miyapur", "in-ts-hyd-city", "LOCALITY", "Miyapur", "TS", "HYD", "500049", 17.4968, 78.3547);
        addNode("in-ts-hnk-city", "in-ts-hanamkonda", "CITY", "Hanamkonda", "TS", "HNK", "506001", 18.0073, 79.5583);
        addNode("in-ts-wgl-city", "in-ts-warangal", "CITY", "Warangal", "TS", "WGL", "506002", 17.9689, 79.5941);
        addNode("in-ts-krn-city", "in-ts-karimnagar", "CITY", "Karimnagar", "TS", "KRN", "505001", 18.4386, 79.1288);
        addNode("in-ts-nzb-city", "in-ts-nizamabad", "CITY", "Nizamabad", "TS", "NZB", "503001", 18.6725, 78.0941);
        addNode("in-ts-khm-city", "in-ts-khammam", "CITY", "Khammam", "TS", "KHM", "507001", 17.2473, 80.1514);
        addNode("in-ts-bdk-kothagudem", "in-ts-kothagudem", "CITY", "Kothagudem", "TS", "BDK", "507101", 17.5500, 80.6167);
        addNode("in-ts-mbn-city", "in-ts-mahabubnagar", "CITY", "Mahabubnagar", "TS", "MBN", "509001", 16.7400, 77.9900);
        addNode("in-ts-nlg-city", "in-ts-nalgonda", "CITY", "Nalgonda", "TS", "NLG", "508001", 17.0500, 79.2700);
        addNode("in-ts-srp-city", "in-ts-suryapet", "CITY", "Suryapet", "TS", "SRP", "508213", 17.1400, 79.6200);
        addNode("in-ts-sdp-city", "in-ts-siddipet", "CITY", "Siddipet", "TS", "SDP", "502103", 18.1000, 78.8500);
        addNode("in-ts-srd-city", "in-ts-sangareddy", "CITY", "Sangareddy", "TS", "SRD", "502001", 17.6294, 78.0917);
        addNode("in-ts-pdp-ramagundam", "in-ts-peddapalli", "CITY", "Ramagundam", "TS", "PDP", "505208", 18.7600, 79.4700);

        // ---------------------------------------------------------------------
        // 4. OTHER MAJOR METRO CITIES
        // ---------------------------------------------------------------------
        addNode("in-ka-blr-city", "in-ka", "CITY", "Bengaluru", "KA", "BLR", "560001", 12.9716, 77.5946);
        addNode("in-ka-blr-alias", "in-ka", "CITY", "Bangalore", "KA", "BLR", "560001", 12.9716, 77.5946);
        addNode("in-ka-mys-city", "in-ka", "CITY", "Mysuru", "KA", "MYS", "570001", 12.2958, 76.6394);
        addNode("in-mh-mumbai-city", "in-mh", "CITY", "Mumbai", "MH", "BOM", "400001", 19.0760, 72.8777);
        addNode("in-mh-pune-city", "in-mh", "CITY", "Pune", "MH", "PUN", "411001", 18.5204, 73.8567);
        addNode("in-mh-thane-city", "in-mh", "CITY", "Thane", "MH", "THN", "400601", 19.2183, 72.9781);
        addNode("in-tn-chennai-city", "in-tn", "CITY", "Chennai", "TN", "MAA", "600001", 13.0827, 80.2707);
        addNode("in-tn-coimbatore-city", "in-tn", "CITY", "Coimbatore", "TN", "CJB", "641001", 11.0168, 76.9558);
        addNode("in-dl-newdelhi-city", "in-dl", "CITY", "New Delhi", "DL", "DEL", "110001", 28.6139, 77.2090);
        addNode("in-hr-gurugram-city", "in-hr", "CITY", "Gurgaon", "HR", "GGN", "122001", 28.4595, 77.0266);
        addNode("in-hr-gurugram-alias", "in-hr", "CITY", "Gurugram", "HR", "GGN", "122001", 28.4595, 77.0266);
        addNode("in-up-noida-city", "in-up", "CITY", "Noida", "UP", "NDA", "201301", 28.5355, 77.3910);
        addNode("in-gj-ahmedabad-city", "in-gj", "CITY", "Ahmedabad", "GJ", "AMD", "380001", 23.0225, 72.5714);
        addNode("in-kl-kochi-city", "in-kl", "CITY", "Kochi", "KL", "COK", "682001", 9.9312, 76.2673);

        // ---------------------------------------------------------------------
        // 5. LOCALITY ITEMS WITH PRECISE COORDINATES
        // ---------------------------------------------------------------------
        // Haryana & Gurgaon
        addItem("DLF Phase 5", "Gurgaon", "Haryana", "122002", 28.4552, 77.0945);
        addItem("Golf Course Road", "Gurgaon", "Haryana", "122002", 28.4589, 77.1025);
        addItem("Cyber City", "Gurgaon", "Haryana", "122008", 28.4950, 77.0895);
        addItem("DLF Phase 1", "Gurgaon", "Haryana", "122002", 28.4789, 77.0995);
        addItem("DLF Phase 2", "Gurgaon", "Haryana", "122008", 28.4842, 77.0862);
        addItem("DLF Phase 3", "Gurgaon", "Haryana", "122010", 28.4925, 77.0988);
        addItem("DLF Phase 4", "Gurgaon", "Haryana", "122009", 28.4682, 77.0873);
        addItem("Sohna Road", "Gurgaon", "Haryana", "122018", 28.4124, 77.0421);

        // Hyderabad & Cyberabad
        addItem("Hitec City", "Hyderabad", "Telangana", "500081", 17.4435, 78.3772);
        addItem("Gachibowli", "Hyderabad", "Telangana", "500032", 17.4401, 78.3489);
        addItem("Madhapur", "Hyderabad", "Telangana", "500081", 17.4483, 78.3915);
        addItem("Kondapur", "Hyderabad", "Telangana", "500084", 17.4699, 78.3578);
        addItem("Jubilee Hills", "Hyderabad", "Telangana", "500033", 17.4319, 78.4073);
        addItem("Banjara Hills", "Hyderabad", "Telangana", "500034", 17.4156, 78.4350);
        addItem("Financial District", "Hyderabad", "Telangana", "500075", 17.4162, 78.3444);
        addItem("Kukatpally", "Hyderabad", "Telangana", "500072", 17.4875, 78.3953);
        addItem("Manikonda", "Hyderabad", "Telangana", "500089", 17.3995, 78.3840);
        addItem("Miyapur", "Hyderabad", "Telangana", "500049", 17.4968, 78.3547);
        addItem("Marredpally", "Secunderabad", "Telangana", "500026", 17.4420, 78.5080);
        addItem("Hanamkonda", "Warangal", "Telangana", "506001", 18.0073, 79.5583);
        addItem("Mukarampura", "Karimnagar", "Telangana", "505001", 18.4386, 79.1288);
        addItem("Kanteshwar", "Nizamabad", "Telangana", "503002", 18.6725, 78.0941);

        // Andhra Pradesh Localities
        addItem("Madhurawada", "Visakhapatnam", "Andhra Pradesh", "530048", 17.8200, 83.3500);
        addItem("Gajuwaka", "Visakhapatnam", "Andhra Pradesh", "530026", 17.6900, 83.2100);
        addItem("MVP Colony", "Visakhapatnam", "Andhra Pradesh", "530017", 17.7400, 83.3300);
        addItem("Benz Circle", "Vijayawada", "Andhra Pradesh", "520010", 16.5000, 80.6500);
        addItem("Governorpet", "Vijayawada", "Andhra Pradesh", "520002", 16.5120, 80.6270);
        addItem("Brodipet", "Guntur", "Andhra Pradesh", "522002", 16.3067, 80.4365);
        addItem("Korlagunta", "Tirupati", "Andhra Pradesh", "517501", 13.6288, 79.4192);
        addItem("Magunta Layout", "Nellore", "Andhra Pradesh", "524003", 14.4426, 79.9865);
        addItem("Nandyal Road", "Kurnool", "Andhra Pradesh", "518002", 15.8281, 78.0373);
        addItem("Danavaipeta", "Rajahmundry", "Andhra Pradesh", "533103", 17.0005, 81.7800);

        // Bangalore / Bengaluru
        addItem("Indiranagar", "Bangalore", "Karnataka", "560038", 12.9784, 77.6408);
        addItem("HSR Layout", "Bangalore", "Karnataka", "560102", 12.9121, 77.6446);
        addItem("Whitefield", "Bangalore", "Karnataka", "560066", 12.9698, 77.7499);
        addItem("Koramangala", "Bangalore", "Karnataka", "560034", 12.9352, 77.6245);
        addItem("Indiranagar", "Bengaluru", "Karnataka", "560038", 12.9784, 77.6408);
        addItem("HSR Layout", "Bengaluru", "Karnataka", "560102", 12.9121, 77.6446);
        addItem("Whitefield", "Bengaluru", "Karnataka", "560066", 12.9698, 77.7499);
        addItem("Koramangala", "Bengaluru", "Karnataka", "560034", 12.9352, 77.6245);

        // Mumbai & Pune
        addItem("Bandra West", "Mumbai", "Maharashtra", "400050", 19.0596, 72.8295);
        addItem("Andheri West", "Mumbai", "Maharashtra", "400053", 19.1363, 72.8277);
        addItem("Kothrud", "Pune", "Maharashtra", "411038", 18.5074, 73.8077);
        addItem("Hinjawadi", "Pune", "Maharashtra", "411057", 18.5913, 73.7389);

        // Delhi NCR
        addItem("Connaught Place", "New Delhi", "Delhi", "110001", 28.6315, 77.2167);
        addItem("Sector 62", "Noida", "Uttar Pradesh", "201309", 28.6258, 77.3627);

        // Tier-2 Key Cities for direct search
        addItem("Navrangpura", "Ahmedabad", "Gujarat", "380009", 23.0365, 72.5611);
        addItem("Marine Drive", "Kochi", "Kerala", "682031", 9.9790, 76.2770);
    }
}
