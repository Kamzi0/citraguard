import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  useScan,
} from "../context/ScanContext.jsx";

import {
  calculateCaptureSchedule,
  fetchFieldConditions,
} from "../services/fieldConditions.js";


const CAPTURE_INTERVALS = [
  20,
  30,
  60,
  120,
  240,
];


/*
  Prototype storage assumption for
  full-resolution 5 MP JPEG captures.

  The OV5640 supports 2592 x 1944
  output and JPEG compression.

  Actual file size varies with scene
  detail, compression settings, and
  the final capture pipeline.

  These values are deliberately shown
  as an estimate range until the real
  camera output is measured.
*/
const STORAGE_ASSUMPTION = {
  lowMBPerImage: 1.5,
  typicalMBPerImage: 2.0,
  highMBPerImage: 2.5,
  resolution: "2592 × 1944",
  format: "JPEG",
};


function NewScanPage() {
  const navigate =
    useNavigate();


  const {
    currentScan,

    setDuration,
    setMonitoringMode,
    setCaptureInterval,
    setCaptureWindow,
    setDeploymentForecast,

    startScan,
    resetScan,
  } = useScan();


  const [
    scanNameInput,
    setScanNameInput,
  ] = useState(
    currentScan.scanName ??
      ""
  );


  const [
    customIntervalEnabled,
    setCustomIntervalEnabled,
  ] = useState(
    !CAPTURE_INTERVALS.includes(
      currentScan.captureIntervalMinutes
    )
  );


  const [
    customInterval,
    setCustomInterval,
  ] = useState(
    currentScan.captureIntervalMinutes ??
      20
  );


  const [
    fieldConditions,
    setFieldConditions,
  ] = useState(
    null
  );


  const [
    fieldConditionsStatus,
    setFieldConditionsStatus,
  ] = useState(
    "idle"
  );


  const [
    fieldConditionsError,
    setFieldConditionsError,
  ] = useState(
    null
  );


  const hasLocation =
    currentScan.latitude !==
      null &&
    currentScan.longitude !==
      null;


  useEffect(() => {
    if (
      currentScan
        .plannedDurationMinutes
    ) {
      return;
    }


    if (
      currentScan.monitoringMode ===
      "extended"
    ) {
      setDuration(
        7 *
          24 *
          60
      );

      return;
    }


    setDuration(
      120
    );
  }, [
    currentScan.monitoringMode,
    currentScan.plannedDurationMinutes,
  ]);


  useEffect(() => {
    if (!hasLocation) {
      setFieldConditions(
        null
      );

      setFieldConditionsStatus(
        "idle"
      );

      return;
    }


    let cancelled =
      false;


    async function loadFieldConditions() {
      setFieldConditionsStatus(
        "loading"
      );

      setFieldConditionsError(
        null
      );


      try {
        const result =
          await fetchFieldConditions(
            currentScan.latitude,
            currentScan.longitude
          );


        if (cancelled) {
          return;
        }


        setFieldConditions(
          result
        );

        setFieldConditionsStatus(
          "ready"
        );
      } catch (error) {
        if (cancelled) {
          return;
        }


        console.error(
          "CitraGuard could not load field conditions:",
          error
        );


        setFieldConditions(
          null
        );

        setFieldConditionsError(
          error instanceof Error
            ? error.message
            : "Weather request failed."
        );

        setFieldConditionsStatus(
          "error"
        );
      }
    }


    loadFieldConditions();


    return () => {
      cancelled =
        true;
    };
  }, [
    hasLocation,
    currentScan.latitude,
    currentScan.longitude,
  ]);


  function handleModeChange(
    mode
  ) {
    setMonitoringMode(
      mode
    );


    if (
      mode ===
      "extended"
    ) {
      setDuration(
        7 *
          24 *
          60
      );

      return;
    }


    setDuration(
      120
    );
  }


  function handleCaptureInterval(
    minutes
  ) {
    setCustomIntervalEnabled(
      false
    );


    setCaptureInterval(
      minutes
    );
  }


  function handleCustomIntervalChange(
    event
  ) {
    const value =
      Number(
        event.target.value
      );


    setCustomInterval(
      value
    );


    if (
      Number.isFinite(
        value
      ) &&
      value >= 5
    ) {
      setCaptureInterval(
        value
      );
    }
  }


  function formatDuration(
    minutes
  ) {
    const numericMinutes =
      Number(
        minutes
      );


    if (
      !Number.isFinite(
        numericMinutes
      ) ||
      numericMinutes < 0
    ) {
      return "Not selected";
    }


    if (
      numericMinutes <
      60
    ) {
      return `${Number(
        numericMinutes.toFixed(
          1
        )
      )} ${
        numericMinutes === 1
          ? "minute"
          : "minutes"
      }`;
    }


    if (
      numericMinutes <
      1440
    ) {
      const hours =
        numericMinutes /
        60;


      return `${Number(
        hours.toFixed(
          1
        )
      )} ${
        hours === 1
          ? "hour"
          : "hours"
      }`;
    }


    const days =
      numericMinutes /
      1440;


    return `${Number(
      days.toFixed(
        1
      )
    )} ${
      days === 1
        ? "day"
        : "days"
    }`;
  }


  function formatInterval(
    minutes
  ) {
    const numericMinutes =
      Number(
        minutes
      );


    if (
      !Number.isFinite(
        numericMinutes
      ) ||
      numericMinutes <= 0
    ) {
      return "Not selected";
    }


    if (
      numericMinutes <
      60
    ) {
      return `Every ${numericMinutes} min`;
    }


    const hours =
      numericMinutes /
      60;


    return `Every ${Number(
      hours.toFixed(
        1
      )
    )} ${
      hours === 1
        ? "hour"
        : "hours"
    }`;
  }


  function formatStorage(
    megabytes
  ) {
    const numericMegabytes =
      Number(
        megabytes
      );


    if (
      !Number.isFinite(
        numericMegabytes
      ) ||
      numericMegabytes < 0
    ) {
      return "—";
    }


    if (
      numericMegabytes <
      1000
    ) {
      return `${Math.round(
        numericMegabytes
      )} MB`;
    }


    const gigabytes =
      numericMegabytes /
      1000;


    return `${Number(
      gigabytes.toFixed(
        gigabytes >= 10
          ? 1
          : 2
      )
    )} GB`;
  }


  function getRecommendedInterval() {
    const duration =
      Number(
        currentScan
          .plannedDurationMinutes
      );


    if (
      !Number.isFinite(
        duration
      ) ||
      duration <= 0
    ) {
      return 20;
    }


    if (
      currentScan.monitoringMode ===
      "focused"
    ) {
      if (
        duration <= 120
      ) {
        return 20;
      }


      if (
        duration <= 360
      ) {
        return 30;
      }


      return 60;
    }


    const days =
      duration /
      1440;


    if (
      days <= 7
    ) {
      return 60;
    }


    if (
      days <= 14
    ) {
      return 120;
    }


    return 240;
  }


  const recommendedInterval =
    getRecommendedInterval();


  const solarSchedule =
    useMemo(() => {
      const duration =
        Number(
          currentScan
            .plannedDurationMinutes
        );


      const interval =
        Number(
          currentScan
            .captureIntervalMinutes
        );


      if (
        !hasLocation ||
        !fieldConditions?.timezone ||
        !Number.isFinite(
          duration
        ) ||
        duration <= 0 ||
        !Number.isFinite(
          interval
        ) ||
        interval <= 0
      ) {
        return null;
      }


      return calculateCaptureSchedule({
        latitude:
          currentScan.latitude,

        longitude:
          currentScan.longitude,

        timeZone:
          fieldConditions.timezone,

        startDate:
          new Date(),

        durationMinutes:
          duration,

        captureIntervalMinutes:
          interval,

        captureWindow:
          "daylight",
      });
    }, [
      hasLocation,
      currentScan.latitude,
      currentScan.longitude,
      currentScan
        .plannedDurationMinutes,
      currentScan
        .captureIntervalMinutes,
      fieldConditions?.timezone,
    ]);


  const captureSchedule =
    useMemo(() => {
      const duration =
        Number(
          currentScan
            .plannedDurationMinutes
        );


      const interval =
        Number(
          currentScan
            .captureIntervalMinutes
        );


      if (
        !hasLocation ||
        !Number.isFinite(
          duration
        ) ||
        duration <= 0 ||
        !Number.isFinite(
          interval
        ) ||
        interval <= 0
      ) {
        return null;
      }


      if (
        currentScan.captureWindow ===
        "daylight"
      ) {
        return solarSchedule;
      }


      return calculateCaptureSchedule({
        latitude:
          currentScan.latitude,

        longitude:
          currentScan.longitude,

        timeZone:
          fieldConditions?.timezone,

        startDate:
          new Date(),

        durationMinutes:
          duration,

        captureIntervalMinutes:
          interval,

        captureWindow:
          "continuous",
      });
    }, [
      hasLocation,
      currentScan.latitude,
      currentScan.longitude,
      currentScan
        .plannedDurationMinutes,
      currentScan
        .captureIntervalMinutes,
      currentScan
        .captureWindow,
      fieldConditions?.timezone,
      solarSchedule,
    ]);


  const scheduledCaptureCount =
    captureSchedule
      ?.totalCaptures ??
    null;


  const storageForecast =
    useMemo(() => {
      if (
        !Number.isFinite(
          scheduledCaptureCount
        ) ||
        scheduledCaptureCount <= 0
      ) {
        return null;
      }


      return {
        lowMB:
          scheduledCaptureCount *
          STORAGE_ASSUMPTION
            .lowMBPerImage,

        typicalMB:
          scheduledCaptureCount *
          STORAGE_ASSUMPTION
            .typicalMBPerImage,

        highMB:
          scheduledCaptureCount *
          STORAGE_ASSUMPTION
            .highMBPerImage,
      };
    }, [
      scheduledCaptureCount,
    ]);


  useEffect(() => {
    setDeploymentForecast({
      scheduledCaptureCount,

      estimatedStorageMB:
        storageForecast
          ?.typicalMB ??
        null,

      estimatedPowerUsePercent:
        null,
    });
  }, [
    scheduledCaptureCount,
    storageForecast
      ?.typicalMB,
  ]);


  function handleStartScan() {
    const cleanedName =
      scanNameInput.trim();


    if (
      !cleanedName ||
      !scanReady
    ) {
      return;
    }


    startScan(
      cleanedName
    );


    navigate(
      "/active-scan"
    );
  }


  function handleCancel() {
    resetScan();


    navigate(
      "/"
    );
  }


  const daylightScheduleReady =
    currentScan.captureWindow !==
      "daylight" ||
    (
      fieldConditionsStatus ===
        "ready" &&
      scheduledCaptureCount !==
        null &&
      scheduledCaptureCount >
        0
    );


  const scanReady =
    hasLocation &&
    scanNameInput.trim().length >
      0 &&
    Boolean(
      currentScan
        .plannedDurationMinutes
    ) &&
    Boolean(
      currentScan
        .captureIntervalMinutes
    ) &&
    Boolean(
      currentScan
        .captureWindow
    ) &&
    daylightScheduleReady;


  const focusedHours =
    Number(
      currentScan
        .plannedDurationMinutes
    ) /
    60;


  const extendedDays =
    Number(
      currentScan
        .plannedDurationMinutes
    ) /
    1440;


  const weatherLooksWet =
    fieldConditionsStatus ===
      "ready" &&
    fieldConditions &&
    (
      (
        fieldConditions
          .current
          .precipitationMm ??
        0
      ) >
        0 ||
      [
        "Rain",
        "Rain showers",
        "Drizzle",
        "Thunderstorms",
      ].includes(
        fieldConditions
          .current
          .description
      )
    );


  if (!hasLocation) {
    return (
      <div className="scan-config-v2-page">

        <div className="scan-config-v2-empty">

          <div className="page-eyebrow">
            MONITORING SETUP
          </div>

          <h1>
            Select a monitoring
            location first
          </h1>

          <p>
            Choose a location from
            the CitraGuard map before
            configuring a Sentinel
            monitoring session.
          </p>

          <button
            type="button"
            className="scan-config-v2-primary"
            onClick={() =>
              navigate("/")
            }
          >
            Return to Map
          </button>

        </div>

      </div>
    );
  }


  return (
    <div className="scan-config-v2-page">

      <div className="scan-config-v2-header">

        <div>

          <button
            type="button"
            className="scan-config-v2-back"
            onClick={() =>
              navigate("/")
            }
          >
            ← Monitoring Map
          </button>

          <div className="page-eyebrow">
            SENTINEL CONFIGURATION
          </div>

          <h1>
            Configure Monitoring
          </h1>

          <p>
            Define how long CitraGuard
            should monitor this sticky
            trap, how frequently the
            Sentinel should photograph
            it, and when captures should
            occur.
          </p>

        </div>


        <div className="scan-config-v2-demo-badge">
          PROTOTYPE
        </div>

      </div>


      <div className="scan-config-v2-layout">

        <main className="scan-config-v2-main">

          <section className="scan-config-v2-card">

            <div className="scan-config-v2-section-heading">

              <span>
                1
              </span>

              <div>

                <div className="scan-config-v2-eyebrow">
                  LOCATION
                </div>

                <h2>
                  Monitoring Point
                </h2>

              </div>

            </div>


            <div className="scan-config-v2-location">

              <div>

                <span>
                  Latitude
                </span>

                <strong>
                  {Number(
                    currentScan.latitude
                  ).toFixed(
                    5
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Longitude
                </span>

                <strong>
                  {Number(
                    currentScan.longitude
                  ).toFixed(
                    5
                  )}
                </strong>

              </div>


              <button
                type="button"
                onClick={() =>
                  navigate("/")
                }
              >
                Change Location
              </button>

            </div>

          </section>


          <section className="scan-config-v2-card">

            <div className="scan-config-v2-section-heading">

              <span>
                2
              </span>

              <div>

                <div className="scan-config-v2-eyebrow">
                  RECORD
                </div>

                <h2>
                  Observation Name
                </h2>

              </div>

            </div>


            <label
              className="scan-config-v2-label"
              htmlFor="scan-name-v2"
            >
              Scan name
            </label>

            <input
              id="scan-name-v2"
              className="scan-config-v2-input"
              type="text"
              value={
                scanNameInput
              }
              onChange={(
                event
              ) =>
                setScanNameInput(
                  event.target.value
                )
              }
              autoComplete="off"
            />

          </section>


          <section className="scan-config-v2-card">

            <div className="scan-config-v2-section-heading">

              <span>
                3
              </span>

              <div>

                <div className="scan-config-v2-eyebrow">
                  SURVEY TYPE
                </div>

                <h2>
                  Monitoring Duration
                </h2>

                <p>
                  Choose a short field
                  survey or a longer
                  unattended deployment.
                </p>

              </div>

            </div>


            <div className="scan-config-v2-mode-grid">

              <button
                type="button"
                className={
                  currentScan.monitoringMode ===
                  "focused"
                    ? "scan-config-v2-mode is-selected"
                    : "scan-config-v2-mode"
                }
                onClick={() =>
                  handleModeChange(
                    "focused"
                  )
                }
              >
                <strong>
                  Focused Survey
                </strong>

                <span>
                  30 minutes to
                  12 hours
                </span>

                <small>
                  Short-term field
                  observation
                </small>
              </button>


              <button
                type="button"
                className={
                  currentScan.monitoringMode ===
                  "extended"
                    ? "scan-config-v2-mode is-selected"
                    : "scan-config-v2-mode"
                }
                onClick={() =>
                  handleModeChange(
                    "extended"
                  )
                }
              >
                <strong>
                  Extended Monitoring
                </strong>

                <span>
                  1 to 28 days
                </span>

                <small>
                  Longer unattended
                  surveillance
                </small>
              </button>

            </div>


            <div className="scan-config-v2-slider-panel">

              <div className="scan-config-v2-slider-top">

                <div>

                  <span>
                    MONITORING DURATION
                  </span>

                  <strong>
                    {formatDuration(
                      currentScan
                        .plannedDurationMinutes
                    )}
                  </strong>

                </div>

              </div>


              {currentScan.monitoringMode ===
              "focused" ? (

                <>
                  <input
                    className="scan-config-v2-slider"
                    type="range"
                    min="0.5"
                    max="12"
                    step="0.5"
                    value={
                      Math.max(
                        0.5,
                        Math.min(
                          12,
                          focusedHours ||
                            2
                        )
                      )
                    }
                    onChange={(
                      event
                    ) =>
                      setDuration(
                        Number(
                          event.target
                            .value
                        ) *
                          60
                      )
                    }
                  />

                  <div className="scan-config-v2-slider-scale">
                    <span>
                      30 min
                    </span>

                    <span>
                      6 hr
                    </span>

                    <span>
                      12 hr
                    </span>
                  </div>
                </>

              ) : (

                <>
                  <input
                    className="scan-config-v2-slider"
                    type="range"
                    min="1"
                    max="28"
                    step="1"
                    value={
                      Math.max(
                        1,
                        Math.min(
                          28,
                          extendedDays ||
                            7
                        )
                      )
                    }
                    onChange={(
                      event
                    ) =>
                      setDuration(
                        Number(
                          event.target
                            .value
                        ) *
                          1440
                      )
                    }
                  />

                  <div className="scan-config-v2-slider-scale">
                    <span>
                      1 day
                    </span>

                    <span>
                      14 days
                    </span>

                    <span>
                      28 days
                    </span>
                  </div>
                </>

              )}

            </div>


            {currentScan.monitoringMode ===
              "focused" &&
              Number(
                currentScan
                  .plannedDurationMinutes
              ) <=
                60 && (

                <div className="scan-config-v2-neutral-note">
                  Short surveys provide
                  a limited observation
                  window. A zero count
                  should not be interpreted
                  as confirmation that ACP
                  is absent.
                </div>

              )}

          </section>


          <section className="scan-config-v2-card">

            <div className="scan-config-v2-section-heading">

              <span>
                4
              </span>

              <div>

                <div className="scan-config-v2-eyebrow">
                  IMAGE SCHEDULE
                </div>

                <h2>
                  Capture Interval
                </h2>

                <p>
                  Choose how frequently
                  the Sentinel photographs
                  the sticky trap.
                </p>

              </div>

            </div>


            <div className="scan-config-v2-interval-grid">

              {CAPTURE_INTERVALS.map(
                (
                  minutes
                ) => (

                  <button
                    key={
                      minutes
                    }
                    type="button"
                    className={
                      !customIntervalEnabled &&
                      currentScan
                        .captureIntervalMinutes ===
                        minutes
                        ? "scan-config-v2-interval is-selected"
                        : "scan-config-v2-interval"
                    }
                    onClick={() =>
                      handleCaptureInterval(
                        minutes
                      )
                    }
                  >
                    <strong>
                      {minutes < 60
                        ? `${minutes} min`
                        : `${minutes / 60} hr`}
                    </strong>

                    {minutes ===
                      recommendedInterval && (
                      <small>
                        Recommended
                      </small>
                    )}
                  </button>

                )
              )}


              <button
                type="button"
                className={
                  customIntervalEnabled
                    ? "scan-config-v2-interval is-selected"
                    : "scan-config-v2-interval"
                }
                onClick={() =>
                  setCustomIntervalEnabled(
                    true
                  )
                }
              >
                <strong>
                  Custom
                </strong>
              </button>

            </div>


            {customIntervalEnabled && (

              <div className="scan-config-v2-custom-interval">

                <label
                  htmlFor="custom-capture-interval"
                >
                  Minutes between
                  scheduled images
                </label>

                <input
                  id="custom-capture-interval"
                  type="number"
                  min="5"
                  step="5"
                  value={
                    customInterval
                  }
                  onChange={
                    handleCustomIntervalChange
                  }
                />

              </div>

            )}


            <div className="scan-config-v2-explanation">

              <strong>
                {formatInterval(
                  currentScan
                    .captureIntervalMinutes
                )}
              </strong>

              <span>
                More frequent captures
                improve temporal
                resolution but increase
                storage and power use.
                They do not themselves
                cause more insects to be
                trapped.
              </span>

            </div>

          </section>


          <section className="scan-config-v2-card">

            <div className="scan-config-v2-section-heading">

              <span>
                5
              </span>

              <div>

                <div className="scan-config-v2-eyebrow">
                  CAPTURE WINDOW
                </div>

                <h2>
                  When Should CitraGuard
                  Capture?
                </h2>

              </div>

            </div>


            <div className="scan-config-v2-window-grid">

              <button
                type="button"
                className={
                  currentScan.captureWindow ===
                  "daylight"
                    ? "scan-config-v2-window is-selected"
                    : "scan-config-v2-window"
                }
                onClick={() =>
                  setCaptureWindow(
                    "daylight"
                  )
                }
              >

                <div className="scan-config-v2-window-icon">

                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />

                    <path
                      d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>

                </div>

                <strong>
                  Daylight Only
                </strong>

                <span>
                  Capture between local
                  sunrise and sunset.
                </span>

                <small>
                  Recommended
                </small>

              </button>


              <button
                type="button"
                className={
                  currentScan.captureWindow ===
                  "continuous"
                    ? "scan-config-v2-window is-selected"
                    : "scan-config-v2-window"
                }
                onClick={() =>
                  setCaptureWindow(
                    "continuous"
                  )
                }
              >

                <div className="scan-config-v2-dual-icon">

                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M9.5 4.4A7.7 7.7 0 1 0 19.6 14.5 8.2 8.2 0 0 1 9.5 4.4Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />

                    <circle
                      cx="18"
                      cy="6"
                      r="2.3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>

                </div>

                <strong>
                  24-Hour Monitoring
                </strong>

                <span>
                  Continue scheduled
                  captures day and night.
                </span>

                <small>
                  Experimental
                </small>

              </button>

            </div>


            <div className="scan-config-v2-neutral-note">
              Daylight Only is the
              recommended monitoring
              mode. Overnight capture is
              retained as an experimental
              option because artificial
              illumination may affect ACP
              attraction and increases
              power and storage use.
            </div>

          </section>

        </main>


        <aside className="scan-config-v2-sidebar">

          <section className="scan-config-v2-forecast">

            <div className="scan-config-v2-forecast-heading">

              <span>
                DEPLOYMENT FORECAST
              </span>

              <strong>
                Configuration Summary
              </strong>

            </div>


            <div className="scan-config-v2-forecast-row">

              <span>
                Survey Type
              </span>

              <strong>
                {currentScan.monitoringMode ===
                "extended"
                  ? "Extended Monitoring"
                  : "Focused Survey"}
              </strong>

            </div>


            <div className="scan-config-v2-forecast-row">

              <span>
                Duration
              </span>

              <strong>
                {formatDuration(
                  currentScan
                    .plannedDurationMinutes
                )}
              </strong>

            </div>


            <div className="scan-config-v2-forecast-row">

              <span>
                Capture Interval
              </span>

              <strong>
                {formatInterval(
                  currentScan
                    .captureIntervalMinutes
                )}
              </strong>

            </div>


            <div className="scan-config-v2-forecast-row">

              <span>
                Capture Window
              </span>

              <strong>
                {currentScan.captureWindow ===
                "continuous"
                  ? "24 Hours"
                  : "Daylight Only"}
              </strong>

            </div>


            <div className="scan-config-v2-forecast-highlight">

              <span>
                SCHEDULED CAPTURES
              </span>

              <strong>
                {scheduledCaptureCount ??
                  "—"}
              </strong>

              <small>
                Scheduled camera
                checkpoints only.
              </small>

            </div>


            {currentScan.captureWindow ===
              "daylight" &&
              captureSchedule && (

              <div className="scan-config-v2-estimate-note">
                Calculated from local
                sunrise and sunset at the
                selected monitoring point.
                Active daylight:{" "}
                {formatDuration(
                  captureSchedule
                    .activeMinutes
                )}.
              </div>

            )}


            {currentScan.captureWindow ===
              "daylight" &&
              fieldConditionsStatus ===
                "loading" && (

              <div className="scan-config-v2-estimate-note">
                Loading the selected
                location's timezone and
                daylight schedule...
              </div>

            )}


            <div className="scan-config-v2-forecast-row">

              <span>
                Estimated Storage
              </span>

              <strong>
                {storageForecast
                  ? formatStorage(
                      storageForecast
                        .typicalMB
                    )
                  : "—"}
              </strong>

            </div>


            {storageForecast && (

              <div className="scan-config-v2-estimate-note">
                Estimated range:{" "}
                <strong>
                  {formatStorage(
                    storageForecast
                      .lowMB
                  )}
                  {" – "}
                  {formatStorage(
                    storageForecast
                      .highMB
                  )}
                </strong>
                . Assumption:{" "}
                {STORAGE_ASSUMPTION
                  .resolution}{" "}
                {STORAGE_ASSUMPTION
                  .format},{" "}
                approximately{" "}
                {STORAGE_ASSUMPTION
                  .lowMBPerImage}
                {"–"}
                {STORAGE_ASSUMPTION
                  .highMBPerImage}{" "}
                MB per image. Replace
                this estimate after
                measuring the actual
                OV5640 capture files.
              </div>

            )}


            <div className="scan-config-v2-forecast-row">

              <span>
                Power Requirement
              </span>

              <strong>
                Calibration pending
              </strong>

            </div>


            <div className="scan-config-v2-forecast-row">

              <span>
                Trap Service
              </span>

              <strong>
                Protocol dependent
              </strong>

            </div>

          </section>


          <section className="scan-config-v2-weather-card">

            <div className="scan-config-v2-weather-icon">

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M7 17h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 10.5 3.3 3.3 0 0 0 7 17Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>

            </div>


            <div className="scan-config-v2-weather-content">

              <strong>
                Field Conditions
              </strong>


              {fieldConditionsStatus ===
                "loading" && (

                <div className="field-weather-loading">
                  Loading conditions for
                  this monitoring point...
                </div>

              )}


              {fieldConditionsStatus ===
                "error" && (

                <div className="field-weather-error">

                  <span>
                    Weather unavailable
                  </span>

                  <p>
                    CitraGuard could not
                    retrieve current field
                    conditions. No weather
                    values were substituted
                    or simulated.
                  </p>

                  {fieldConditionsError && (
                    <p>
                      {fieldConditionsError}
                    </p>
                  )}

                </div>

              )}


              {fieldConditionsStatus ===
                "ready" &&
                fieldConditions && (

                <>

                  <div className="field-weather-primary">

                    <div>

                      <span>
                        CURRENT
                      </span>

                      <strong>
                        {fieldConditions
                          .current
                          .temperatureC !==
                        null
                          ? `${Math.round(
                              fieldConditions
                                .current
                                .temperatureC
                            )}°C`
                          : "—"}
                      </strong>

                    </div>


                    <div className="field-weather-condition">

                      <strong>
                        {fieldConditions
                          .current
                          .description}
                      </strong>

                      <span>
                        {fieldConditions
                          .current
                          .isDay
                          ? "Daylight"
                          : "Night"}
                      </span>

                    </div>

                  </div>


                  <div className="field-weather-grid">

                    <div>

                      <span>
                        Humidity
                      </span>

                      <strong>
                        {fieldConditions
                          .current
                          .relativeHumidityPercent !==
                        null
                          ? `${Math.round(
                              fieldConditions
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
                        {fieldConditions
                          .current
                          .windSpeedKmh !==
                        null
                          ? `${Math.round(
                              fieldConditions
                                .current
                                .windSpeedKmh
                            )} km/h`
                          : "—"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Rain chance
                      </span>

                      <strong>
                        {fieldConditions
                          .today
                          .precipitationProbabilityMax !==
                        null
                          ? `${Math.round(
                              fieldConditions
                                .today
                                .precipitationProbabilityMax
                            )}%`
                          : "—"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Precipitation
                      </span>

                      <strong>
                        {fieldConditions
                          .current
                          .precipitationMm !==
                        null
                          ? `${fieldConditions
                              .current
                              .precipitationMm.toFixed(
                                1
                              )} mm`
                          : "—"}
                      </strong>

                    </div>

                  </div>


                  <div className="field-daylight-panel">

                    <div>

                      <span>
                        Sunrise
                      </span>

                      <strong>
                        {solarSchedule
                          ?.todaySunriseLabel ??
                          "Unavailable"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Sunset
                      </span>

                      <strong>
                        {solarSchedule
                          ?.todaySunsetLabel ??
                          "Unavailable"}
                      </strong>

                    </div>

                  </div>


                  {currentScan.captureWindow ===
                    "daylight" &&
                    solarSchedule && (

                    <div className="field-daylight-summary">

                      <strong>
                        Actual daylight schedule
                      </strong>

                      <span>
                        {solarSchedule
                          .totalCaptures}{" "}
                        scheduled captures
                        across{" "}
                        {formatDuration(
                          solarSchedule
                            .activeMinutes
                        )}{" "}
                        of active daylight.
                      </span>

                    </div>

                  )}


                  {currentScan.captureWindow ===
                    "daylight" &&
                    solarSchedule
                      ?.isDaylightNow ===
                      false && (

                    <div className="field-condition-advisory">

                      <strong>
                        Outside daylight
                        capture window
                      </strong>

                      <span>
                        The selected
                        monitoring point is
                        currently outside its
                        daylight window. A
                        longer deployment can
                        resume at sunrise;
                        otherwise choose
                        24-Hour Monitoring.
                      </span>

                    </div>

                  )}


                  {weatherLooksWet && (

                    <div className="field-condition-advisory">

                      <strong>
                        Precipitation advisory
                      </strong>

                      <span>
                        Wet conditions may
                        affect image clarity.
                        Confirm that the
                        prototype camera hood
                        and enclosure are
                        protected before
                        outdoor deployment.
                      </span>

                    </div>

                  )}


                  <div className="field-weather-source">
                    Weather is field
                    context only and does
                    not modify the
                    CitraGuard risk
                    classification.
                  </div>

                </>

              )}

            </div>

          </section>


          <section className="scan-config-v2-actions">

            {!scanReady &&
              currentScan.captureWindow ===
                "daylight" &&
              fieldConditionsStatus ===
                "error" && (

                <div className="scan-config-v2-neutral-note">
                  Daylight scheduling
                  needs the monitoring
                  point's timezone. Switch
                  to 24-Hour Monitoring
                  if you need to continue
                  while weather data is
                  unavailable.
                </div>

              )}


            <button
              type="button"
              className="scan-config-v2-start"
              disabled={
                !scanReady
              }
              onClick={
                handleStartScan
              }
            >
              Begin Monitoring
            </button>


            <button
              type="button"
              className="scan-config-v2-cancel"
              onClick={
                handleCancel
              }
            >
              Cancel
            </button>

          </section>

        </aside>

      </div>

    </div>
  );
}


export default NewScanPage;
