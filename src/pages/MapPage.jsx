import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import {
  useLocation,
  useNavigate,
} from "react-router";

import {
  useScan,
} from "../context/ScanContext.jsx";

import {
  generateRiskFieldPoints,
} from "../utils/riskField.js";

import {
  fetchFieldConditions,
} from "../services/fieldConditions.js";

import "leaflet/dist/leaflet.css";


function createWhiteMarkerIcon(
  visualSize,
  borderWidth = 1
) {
  return L.divIcon({
    className:
      "citraguard-white-marker",

    html: `
      <div
        style="
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <div
          style="
            width: ${visualSize}px;
            height: ${visualSize}px;
            background: white;
            border: ${borderWidth}px solid #222;
            border-radius: 50%;
            box-shadow:
              0 1px 4px rgba(0,0,0,0.35),
              0 0 0 2px rgba(255,255,255,0.18);
          "
        ></div>
      </div>
    `,

    iconSize: [
      24,
      24,
    ],

    iconAnchor: [
      12,
      12,
    ],

    popupAnchor: [
      0,
      -12,
    ],
  });
}


function getCompletedMarkerIcon(
  zoomLevel
) {
  if (
    zoomLevel >= 19
  ) {
    return createWhiteMarkerIcon(
      10,
      2
    );
  }


  if (
    zoomLevel === 18
  ) {
    return createWhiteMarkerIcon(
      8,
      2
    );
  }


  if (
    zoomLevel === 17
  ) {
    return createWhiteMarkerIcon(
      7,
      1
    );
  }


  if (
    zoomLevel === 16
  ) {
    return createWhiteMarkerIcon(
      5,
      1
    );
  }


  return createWhiteMarkerIcon(
    3,
    1
  );
}


const proposedMarkerIcon =
  createWhiteMarkerIcon(
    12,
    2
  );


function getMonitoringRiskColor(
  area
) {
  const level =
    area?.currentRiskLevel;


  if (level === "LOW") {
    return "#2E7D32";
  }


  if (level === "CAUTION") {
    return "#F59E0B";
  }


  if (level === "HIGH") {
    return "#D32F2F";
  }


  const rawValue =
    area?.currentRiskValue;


  if (
    rawValue === null ||
    rawValue === undefined ||
    rawValue === ""
  ) {
    return null;
  }


  const numericValue =
    Number(
      rawValue
    );


  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return null;
  }


  if (numericValue <= 2) {
    return "#2E7D32";
  }


  if (numericValue <= 9) {
    return "#F59E0B";
  }


  return "#D32F2F";
}


function MapClickHandler({
  onLocationSelected,
}) {
  useMapEvents({
    click(event) {
      onLocationSelected(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });


  return null;
}


function MapZoomTracker({
  onZoomChange,
}) {
  const map =
    useMap();


  useEffect(() => {
    onZoomChange(
      map.getZoom()
    );
  }, [
    map,
    onZoomChange,
  ]);


  useMapEvents({
    zoomend() {
      onZoomChange(
        map.getZoom()
      );
    },
  });


  return null;
}


function UserLocationController({
  userLocation,
  shouldCenter = true,
}) {
  const map =
    useMap();


  useEffect(() => {
    if (
      !userLocation ||
      !shouldCenter
    ) {
      return;
    }


    map.setView(
      [
        userLocation.latitude,
        userLocation.longitude,
      ],
      18
    );
  }, [
    map,
    userLocation,
    shouldCenter,
  ]);


  return null;
}


function FocusLocationController({
  focusRequest,
}) {
  const map =
    useMap();


  useEffect(() => {
    if (
      !focusRequest
    ) {
      return;
    }


    map.setView(
      [
        focusRequest.latitude,
        focusRequest.longitude,
      ],
      19,
      {
        animate: true,
      }
    );
  }, [
    map,
    focusRequest,
  ]);


  return null;
}


function MapPage() {
  const navigate =
    useNavigate();


  const location =
    useLocation();


  const {
    currentScan,
    monitoringAreas,

    resetScan,

    findMonitoringAreaAtLocation,
    selectExistingArea,
    createNewMonitoringPoint,
  } = useScan();


  const focusRequest =
    useMemo(() => {
      const latitude =
        Number(
          location.state
            ?.focusLatitude
        );


      const longitude =
        Number(
          location.state
            ?.focusLongitude
        );


      if (
        location.state
          ?.focusLatitude ===
          null ||
        location.state
          ?.focusLatitude ===
          undefined ||
        location.state
          ?.focusLongitude ===
          null ||
        location.state
          ?.focusLongitude ===
          undefined ||
        !Number.isFinite(
          latitude
        ) ||
        !Number.isFinite(
          longitude
        )
      ) {
        return null;
      }


      return {
        latitude,
        longitude,

        scanId:
          location.state
            ?.focusScanId ??
          null,
      };
    }, [
      location.state,
    ]);


  const [
    userLocation,
    setUserLocation,
  ] = useState(
    null
  );


  const [
    locationStatus,
    setLocationStatus,
  ] = useState(
    "Requesting your location..."
  );


  const [
    mapZoom,
    setMapZoom,
  ] = useState(
    18
  );


  const [
    areaChoice,
    setAreaChoice,
  ] = useState(
    null
  );


  const [
    basemapMode,
    setBasemapMode,
  ] = useState(
    "satellite"
  );


  const [
    showMonitoringPoints,
    setShowMonitoringPoints,
  ] = useState(
    true
  );


  const [
    mapFieldConditions,
    setMapFieldConditions,
  ] = useState(
    null
  );


  const [
    mapFieldConditionsStatus,
    setMapFieldConditionsStatus,
  ] = useState(
    "idle"
  );


  const [
    mapFieldConditionsError,
    setMapFieldConditionsError,
  ] = useState(
    null
  );


  const riskFieldPoints =
    useMemo(
      () =>
        generateRiskFieldPoints(
          monitoringAreas
        ),
      [
        monitoringAreas,
      ]
    );


  const totalObservations =
    useMemo(
      () =>
        monitoringAreas.reduce(
          (
            total,
            area
          ) =>
            total +
            (
              Number(
                area.scanCount
              ) ||
              0
            ),
          0
        ),
      [
        monitoringAreas,
      ]
    );


  const highRiskAreas =
    useMemo(
      () =>
        monitoringAreas.filter(
          (area) =>
            area.currentRiskLevel ===
            "HIGH"
        ).length,
      [
        monitoringAreas,
      ]
    );


  const hasProposedLocation =
    currentScan.status ===
      "idle" &&
    currentScan.latitude !==
      null &&
    currentScan.longitude !==
      null;


  const weatherTarget =
    useMemo(() => {
      if (
        areaChoice
      ) {
        return {
          latitude:
            areaChoice.latitude,

          longitude:
            areaChoice.longitude,
        };
      }


      if (
        hasProposedLocation
      ) {
        return {
          latitude:
            currentScan.latitude,

          longitude:
            currentScan.longitude,
        };
      }


      return null;
    }, [
      areaChoice,
      hasProposedLocation,
      currentScan.latitude,
      currentScan.longitude,
    ]);


  useEffect(() => {
    if (
      !weatherTarget
    ) {
      setMapFieldConditions(
        null
      );

      setMapFieldConditionsStatus(
        "idle"
      );

      setMapFieldConditionsError(
        null
      );

      return;
    }


    let cancelled =
      false;


    async function loadMapFieldConditions() {
      setMapFieldConditionsStatus(
        "loading"
      );

      setMapFieldConditionsError(
        null
      );


      try {
        const result =
          await fetchFieldConditions(
            weatherTarget.latitude,
            weatherTarget.longitude
          );


        if (
          cancelled
        ) {
          return;
        }


        setMapFieldConditions(
          result
        );

        setMapFieldConditionsStatus(
          "ready"
        );
      } catch (error) {
        if (
          cancelled
        ) {
          return;
        }


        console.error(
          "CitraGuard could not load map field conditions:",
          error
        );


        setMapFieldConditions(
          null
        );

        setMapFieldConditionsError(
          error instanceof Error
            ? error.message
            : "Weather request failed."
        );

        setMapFieldConditionsStatus(
          "error"
        );
      }
    }


    loadMapFieldConditions();


    return () => {
      cancelled =
        true;
    };
  }, [
    weatherTarget
      ?.latitude,
    weatherTarget
      ?.longitude,
  ]);


  useEffect(() => {
    if (
      !navigator.geolocation
    ) {
      setLocationStatus(
        "Location services are not supported by this browser. You can still move around the map manually."
      );

      return;
    }


    navigator.geolocation
      .getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude:
              position.coords
                .latitude,

            longitude:
              position.coords
                .longitude,
          });


          setLocationStatus(
            "Map centered near your current location."
          );
        },


        () => {
          setLocationStatus(
            "Location access was not provided. You can still move around the map manually."
          );
        },


        {
          enableHighAccuracy:
            true,

          timeout:
            10000,

          maximumAge:
            60000,
        }
      );
  }, []);


  function handleLocationSelected(
    latitude,
    longitude
  ) {
    const areaMatch =
      findMonitoringAreaAtLocation(
        latitude,
        longitude
      );


    if (
      areaMatch
    ) {
      resetScan();


      setAreaChoice({
        area:
          areaMatch.area,

        distanceMeters:
          areaMatch.distanceMeters,

        latitude,

        longitude,
      });


      return;
    }


    setAreaChoice(
      null
    );


    createNewMonitoringPoint(
      latitude,
      longitude
    );
  }


  function handleUpdateExistingArea() {
    if (
      !areaChoice
    ) {
      return;
    }


    selectExistingArea(
      areaChoice.area,
      areaChoice.latitude,
      areaChoice.longitude
    );


    setAreaChoice(
      null
    );
  }


  function handleCreateNewPoint() {
    if (
      !areaChoice
    ) {
      return;
    }


    createNewMonitoringPoint(
      areaChoice.latitude,
      areaChoice.longitude
    );


    setAreaChoice(
      null
    );
  }


  function handleCancelAreaChoice() {
    setAreaChoice(
      null
    );
  }


  function handleConfigureScan() {
    navigate(
      "/new-scan"
    );
  }


  function handleClearSelection() {
    resetScan();


    setAreaChoice(
      null
    );
  }


  function handleZoomChange(
    zoomLevel
  ) {
    setMapZoom(
      zoomLevel
    );
  }


  const completedMarkerIcon =
    getCompletedMarkerIcon(
      mapZoom
    );


  return (
    <div className="map-page">

      <div className="map-page-header">

        <div>

          <div className="page-eyebrow">
            FIELD SURVEILLANCE
          </div>

          <h1 className="map-page-title">
            Monitoring Map
          </h1>

          <p className="map-page-description">
            Select a location to begin a
            CitraGuard Sentinel monitoring
            observation and review existing
            geographic detection activity.
          </p>

        </div>


        <div className="location-status-card">

          <span
            className={
              userLocation
                ? "location-status-dot location-status-dot-active"
                : "location-status-dot"
            }
          />

          <div>

            <div className="location-status-label">
              LOCATION
            </div>

            <div className="location-status-text">
              {locationStatus}
            </div>

          </div>

        </div>

      </div>


      <div className="map-summary-grid">

        <div className="map-summary-card">

          <div className="map-summary-label">
            Monitoring Areas
          </div>

          <div className="map-summary-value">
            {monitoringAreas.length}
          </div>

          <div className="map-summary-detail">
            Active geographic surveillance
            locations
          </div>

        </div>


        <div className="map-summary-card">

          <div className="map-summary-label">
            Observations
          </div>

          <div className="map-summary-value">
            {totalObservations}
          </div>

          <div className="map-summary-detail">
            Completed Sentinel observations
          </div>

        </div>


        <div className="map-summary-card">

          <div className="map-summary-label">
            High-Risk Areas
          </div>

          <div className="map-summary-value">
            {highRiskAreas}
          </div>

          <div className="map-summary-detail">
            Prototype monitoring
            classification
          </div>

        </div>

      </div>


      <section className="map-dashboard-card">

        <div className="map-toolbar">

          <div>

            <div className="map-toolbar-title">
              Surveillance View
            </div>

            <div className="map-toolbar-subtitle">
              Click anywhere on the map to
              place or update a monitoring
              point.
            </div>

          </div>


          <div className="map-toolbar-controls">

            <div
              className="map-segmented-control"
              aria-label="Map style"
            >

              <button
                type="button"
                className={
                  basemapMode ===
                  "satellite"
                    ? "map-segment-button is-active"
                    : "map-segment-button"
                }
                onClick={() =>
                  setBasemapMode(
                    "satellite"
                  )
                }
              >
                Satellite
              </button>


              <button
                type="button"
                className={
                  basemapMode ===
                  "map"
                    ? "map-segment-button is-active"
                    : "map-segment-button"
                }
                onClick={() =>
                  setBasemapMode(
                    "map"
                  )
                }
              >
                Map
              </button>

            </div>


            <button
              type="button"
              className={
                showMonitoringPoints
                  ? "monitoring-toggle is-active"
                  : "monitoring-toggle"
              }
              onClick={() =>
                setShowMonitoringPoints(
                  (
                    previousValue
                  ) =>
                    !previousValue
                )
              }
            >
              <span className="monitoring-toggle-dot" />

              {showMonitoringPoints
                ? "Points On"
                : "Points Off"}
            </button>

          </div>

        </div>


        <div className="map-stage">

          <MapContainer
            center={[
              27.9,
              -82.5,
            ]}
            zoom={
              8
            }
            maxZoom={
              20
            }
            className="monitoring-map"
          >

            {basemapMode ===
            "satellite" ? (
              <TileLayer
                key="satellite"

                attribution="Tiles © Esri — Source: Esri, imagery providers, and the GIS User Community"

                url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

                maxNativeZoom={
                  19
                }

                maxZoom={
                  20
                }
              />
            ) : (
              <TileLayer
                key="map"

                attribution="© OpenStreetMap contributors"

                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"

                maxNativeZoom={
                  19
                }

                maxZoom={
                  20
                }
              />
            )}


            <UserLocationController
              userLocation={
                userLocation
              }
              shouldCenter={
                !focusRequest
              }
            />


            <FocusLocationController
              focusRequest={
                focusRequest
              }
            />


            <MapZoomTracker
              onZoomChange={
                handleZoomChange
              }
            />


            <MapClickHandler
              onLocationSelected={
                handleLocationSelected
              }
            />


            {monitoringAreas.map(
              (area) => {
                const riskColor =
                  getMonitoringRiskColor(
                    area
                  );


                if (!riskColor) {
                  return null;
                }


                return (
                  <Circle
                    key={`risk-zone-${area.areaId}`}

                    center={[
                      area.centerLatitude,
                      area.centerLongitude,
                    ]}

                    radius={
                      Number(
                        area.radiusMeters
                      ) ||
                      15
                    }

                    interactive={
                      false
                    }

                    pathOptions={{
                      stroke:
                        false,

                      fillColor:
                        riskColor,

                      fillOpacity:
                        0.16,
                    }}
                  />
                );
              }
            )}


            {riskFieldPoints.map(
              (point) => (
                <Circle
                  key={`field-${point.id}`}

                  center={[
                    point.latitude,
                    point.longitude,
                  ]}

                  radius={
                    2.2
                  }

                  interactive={
                    false
                  }

                  pathOptions={{
                    stroke:
                      false,

                    fillColor:
                      point.color,

                    fillOpacity:
                      Math.max(
                        Number(
                          point.opacity
                        ) ||
                        0,
                        0.16
                      ),
                  }}
                />
              )
            )}


            {monitoringAreas.map(
              (area) => (
                <Circle
                  key={`boundary-${area.areaId}`}

                  center={[
                    area.centerLatitude,
                    area.centerLongitude,
                  ]}

                  radius={
                    area.radiusMeters
                  }

                  interactive={
                    false
                  }

                  pathOptions={{
                    color:
                      "#ffffff",

                    fillOpacity:
                      0,

                    opacity:
                      0.45,

                    weight:
                      1,

                    dashArray:
                      "3 4",
                  }}
                />
              )
            )}


            {focusRequest && (
              <>
                <Circle
                  center={[
                    focusRequest.latitude,
                    focusRequest.longitude,
                  ]}
                  radius={7}
                  interactive={false}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 3,
                    opacity: 0.95,
                    fillColor: "#1F6B45",
                    fillOpacity: 0.18,
                  }}
                />

                <Circle
                  center={[
                    focusRequest.latitude,
                    focusRequest.longitude,
                  ]}
                  radius={12}
                  interactive={false}
                  pathOptions={{
                    color: "#1F6B45",
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0,
                    dashArray: "4 4",
                  }}
                />
              </>
            )}


            {showMonitoringPoints &&
              monitoringAreas.map(
                (area) => (
                  <Marker
                    key={
                      area.areaId
                    }

                    position={[
                      area.centerLatitude,
                      area.centerLongitude,
                    ]}

                    icon={
                      completedMarkerIcon
                    }
                  >

                    <Popup>

                      <div className="map-popup">

                        <div className="map-popup-label">
                          MONITORING AREA
                        </div>

                        <strong className="map-popup-title">
                          {
                            area.areaName
                          }
                        </strong>


                        <div className="map-popup-stats">

                          <div>
                            <span>
                              Risk
                            </span>

                            <strong>
                              {
                                area.currentRiskLevel ??
                                "—"
                              }
                            </strong>
                          </div>


                          <div>
                            <span>
                              {area.currentRiskMetric ===
                                "ACP_PER_TRAP_WEEK" ||
                              area.currentRiskMetric ===
                                "STABILIZED_ACP_PER_TRAP_WEEK"
                                ? "Map class. rate"
                                : "Prototype value"}
                            </span>

                            <strong>
                              {area.currentRiskValue ??
                                "—"}
                            </strong>
                          </div>


                          <div>
                            <span>
                              Observations
                            </span>

                            <strong>
                              {
                                area.scanCount
                              }
                            </strong>
                          </div>

                        </div>


                        <p className="map-popup-rate-note">
                          {area.currentRiskMetric ===
                            "ACP_PER_TRAP_WEEK" ||
                          area.currentRiskMetric ===
                            "STABILIZED_ACP_PER_TRAP_WEEK"
                            ? `Observed rate: ${
                                area.observedRatePerWeek ??
                                area.currentRiskValue ??
                                "—"
                              } ACP per trap-week. Heat-map classification rate: ${
                                area.classificationRatePerWeek ??
                                area.currentRiskValue ??
                                "—"
                              } ACP per trap-week. ${
                                area.riskEvidenceLevel ===
                                "PRELIMINARY"
                                  ? "Preliminary evidence from a short accumulated exposure window."
                                  : area.riskEvidenceLevel ===
                                    "LIMITED"
                                  ? "Limited accumulated exposure."
                                  : area.riskEvidenceLevel ===
                                    "STANDARD"
                                  ? "Standard prototype evidence window."
                                  : ""
                              }`
                            : "Legacy area using the earlier count-based prototype metric."}
                        </p>


                        <div className="map-popup-actions">

                          <button
                            type="button"
                            className="map-popup-primary"
                            onClick={() =>
                              navigate(
                                `/area/${area.areaId}`
                              )
                            }
                          >
                            Area History
                          </button>


                          <button
                            type="button"
                            className="map-popup-secondary"
                            onClick={() =>
                              navigate(
                                `/scan-detail/${area.latestScanId}`
                              )
                            }
                          >
                            Latest Scan
                          </button>

                        </div>

                      </div>

                    </Popup>

                  </Marker>
                )
              )}


            {hasProposedLocation && (
              <Marker
                position={[
                  currentScan.latitude,
                  currentScan.longitude,
                ]}

                icon={
                  proposedMarkerIcon
                }

                draggable={
                  !currentScan.isAreaUpdate
                }
              >

                <Popup>
                  {currentScan.isAreaUpdate
                    ? "New observation for existing monitoring area"
                    : "Proposed new monitoring point"}
                </Popup>

              </Marker>
            )}

          </MapContainer>


          {weatherTarget && (

            <div className="map-weather-card">

              <div className="map-weather-heading">

                <div>

                  <span>
                    FIELD CONDITIONS
                  </span>

                  <strong>
                    Selected monitoring point
                  </strong>

                </div>


                <div
                  className={
                    mapFieldConditionsStatus ===
                    "ready"
                      ? "map-weather-status is-ready"
                      : "map-weather-status"
                  }
                >
                  <span />

                  {mapFieldConditionsStatus ===
                  "ready"
                    ? "Live"
                    : mapFieldConditionsStatus ===
                      "loading"
                    ? "Loading"
                    : "Unavailable"}
                </div>

              </div>


              {mapFieldConditionsStatus ===
                "loading" && (

                <div className="map-weather-loading">
                  Loading weather for this
                  monitoring point...
                </div>

              )}


              {mapFieldConditionsStatus ===
                "error" && (

                <div className="map-weather-error">

                  <strong>
                    Weather unavailable
                  </strong>

                  <span>
                    No substitute weather
                    values are being shown.
                  </span>

                  {mapFieldConditionsError && (
                    <small>
                      {mapFieldConditionsError}
                    </small>
                  )}

                </div>

              )}


              {mapFieldConditionsStatus ===
                "ready" &&
                mapFieldConditions && (

                <>

                  <div className="map-weather-primary">

                    <strong>
                      {mapFieldConditions
                        .current
                        .temperatureC !==
                      null
                        ? `${Math.round(
                            mapFieldConditions
                              .current
                              .temperatureC
                          )}°C`
                        : "—"}
                    </strong>


                    <div>

                      <span>
                        {mapFieldConditions
                          .current
                          .description}
                      </span>

                      <small>
                        {mapFieldConditions
                          .current
                          .isDay
                          ? "Daylight"
                          : "Night"}
                      </small>

                    </div>

                  </div>


                  <div className="map-weather-metrics">

                    <div>

                      <span>
                        Humidity
                      </span>

                      <strong>
                        {mapFieldConditions
                          .current
                          .relativeHumidityPercent !==
                        null
                          ? `${Math.round(
                              mapFieldConditions
                                .current
                                .relativeHumidityPercent
                            )}%`
                          : "—"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Wind
                      </span>

                      <strong>
                        {mapFieldConditions
                          .current
                          .windSpeedKmh !==
                        null
                          ? `${Math.round(
                              mapFieldConditions
                                .current
                                .windSpeedKmh
                            )} km/h`
                          : "—"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Rain
                      </span>

                      <strong>
                        {mapFieldConditions
                          .current
                          .precipitationMm !==
                        null
                          ? `${mapFieldConditions
                              .current
                              .precipitationMm.toFixed(
                                1
                              )} mm`
                          : "—"}
                      </strong>

                    </div>

                  </div>


                  <div className="map-weather-context-note">
                    Field context only. Weather
                    does not modify the
                    CitraGuard risk
                    classification.
                  </div>

                </>

              )}

            </div>

          )}


          <div className="map-legend">

            <div className="map-legend-title">
              Monitoring Risk
            </div>


            <div className="map-legend-row">

              <span className="legend-color legend-low" />

              <span>
                Low
              </span>

            </div>


            <div className="map-legend-row">

              <span className="legend-color legend-caution" />

              <span>
                Caution
              </span>

            </div>


            <div className="map-legend-row">

              <span className="legend-color legend-high" />

              <span>
                High
              </span>

            </div>


            <div className="map-legend-divider" />


            <div className="map-legend-row">

              <span className="legend-monitoring-point" />

              <span>
                Monitoring point
              </span>

            </div>

          </div>


          <div className="map-radius-note">
            15 m prototype monitoring radius
          </div>

        </div>

      </section>


      {areaChoice && (

        <section className="map-action-panel map-area-panel">

          <div className="map-action-panel-icon">
            !
          </div>


          <div className="map-action-panel-content">

            <div className="map-action-eyebrow">
              EXISTING AREA DETECTED
            </div>

            <h2>
              This location overlaps an
              existing monitoring area.
            </h2>

            <p>
              Your selected point is within
              the prototype 15-meter monitoring
              radius for{" "}
              <strong>
                {
                  areaChoice.area
                    .areaName
                }
              </strong>
              .
            </p>


            <div className="area-choice-details">

              <div>

                <span>
                  Distance from center
                </span>

                <strong>
                  {areaChoice
                    .distanceMeters
                    .toFixed(
                      1
                    )}{" "}
                  m
                </strong>

              </div>


              <div>

                <span>
                  Existing observations
                </span>

                <strong>
                  {
                    areaChoice.area
                      .scanCount
                  }
                </strong>

              </div>


              <div>

                <span>
                  Current risk
                </span>

                <strong>
                  {
                    areaChoice.area
                      .currentRiskLevel ??
                    "—"
                  }
                </strong>

              </div>

            </div>


            <div className="map-action-buttons">

              <button
                type="button"
                className="map-button map-button-secondary"
                onClick={() =>
                  navigate(
                    `/area/${areaChoice.area.areaId}`
                  )
                }
              >
                View Area History
              </button>


              <button
                type="button"
                className="map-button map-button-primary"
                onClick={
                  handleUpdateExistingArea
                }
              >
                Update Existing Area
              </button>


              <button
                type="button"
                className="map-button map-button-secondary"
                onClick={
                  handleCreateNewPoint
                }
              >
                Create New Point
              </button>


              <button
                type="button"
                className="map-button map-button-quiet"
                onClick={
                  handleCancelAreaChoice
                }
              >
                Cancel
              </button>

            </div>

          </div>

        </section>

      )}


      {!areaChoice &&
        hasProposedLocation && (

          <section className="map-action-panel">

            <div className="map-action-panel-icon map-action-panel-icon-green">
              +
            </div>


            <div className="map-action-panel-content">

              <div className="map-action-eyebrow">
                MONITORING LOCATION SELECTED
              </div>


              <h2>
                {currentScan
                  .isAreaUpdate
                  ? "Add a new observation to this area"
                  : "Create a new monitoring observation"}
              </h2>


              <p>
                {currentScan
                  .isAreaUpdate
                  ? `This observation will update ${currentScan.scanName}.`
                  : "Configure the Sentinel monitoring duration before beginning the prototype scan."}
              </p>


              <div className="selected-coordinate-grid">

                <div>

                  <span>
                    Latitude
                  </span>

                  <strong>
                    {currentScan
                      .latitude
                      .toFixed(
                        5
                      )}
                  </strong>

                </div>


                <div>

                  <span>
                    Longitude
                  </span>

                  <strong>
                    {currentScan
                      .longitude
                      .toFixed(
                        5
                      )}
                  </strong>

                </div>


                <div>

                  <span>
                    Area type
                  </span>

                  <strong>
                    {currentScan
                      .isAreaUpdate
                      ? "Existing"
                      : "New"}
                  </strong>

                </div>

              </div>


              <div className="map-action-buttons">

                <button
                  type="button"
                  className="map-button map-button-primary"
                  onClick={
                    handleConfigureScan
                  }
                >
                  Configure Scan
                </button>


                <button
                  type="button"
                  className="map-button map-button-secondary"
                  onClick={
                    handleClearSelection
                  }
                >
                  Clear Selection
                </button>

              </div>

            </div>

          </section>

        )}


      {!areaChoice &&
        !hasProposedLocation && (

          <div className="map-empty-hint">

            <div className="map-empty-hint-marker" />

            <div>

              <strong>
                Select a monitoring location
              </strong>

              <span>
                Click anywhere on the map to
                begin a new Sentinel
                observation.
              </span>

            </div>

          </div>

        )}


      <div className="map-prototype-note">

        <strong>
          Prototype interpretation:
        </strong>{" "}

        Risk colors represent CitraGuard
        monitoring classifications based on
        observed psyllid detections. They do
        not represent confirmed HLB infection
        or disease probability. The 15-meter
        area is a prototype visualization
        radius.

      </div>

    </div>
  );
}


export default MapPage;