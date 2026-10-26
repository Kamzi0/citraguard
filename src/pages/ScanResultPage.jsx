import {
  Link,
  useNavigate,
} from "react-router";

import {
  useScan,
} from "../context/ScanContext.jsx";


const MINUTES_PER_WEEK =
  7 *
  24 *
  60;


function ScanResultPage() {
  const navigate =
    useNavigate();


  const {
    currentScan,
    resetScan,
  } = useScan();


  function formatDuration(
    minutes
  ) {
    if (
      minutes === null ||
      minutes === undefined ||
      minutes === ""
    ) {
      return "Not available";
    }


    const value =
      Number(
        minutes
      );


    if (
      !Number.isFinite(
        value
      ) ||
      value < 0
    ) {
      return "Not available";
    }


    if (
      value <
      60
    ) {
      return `${Number(
        value.toFixed(
          1
        )
      )} ${
        value === 1
          ? "minute"
          : "minutes"
      }`;
    }


    if (
      value <
      1440
    ) {
      const hours =
        value /
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
      value /
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
    const value =
      Number(
        minutes
      );


    if (
      !Number.isFinite(
        value
      ) ||
      value <= 0
    ) {
      return "Not available";
    }


    if (
      value <
      60
    ) {
      return `Every ${Number(
        value.toFixed(
          1
        )
      )} min`;
    }


    const hours =
      value /
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
    const value =
      Number(
        megabytes
      );


    if (
      !Number.isFinite(
        value
      ) ||
      value < 0
    ) {
      return "Not available";
    }


    if (
      value <
      1000
    ) {
      return `${Number(
        value.toFixed(
          value < 10
            ? 1
            : 0
        )
      )} MB`;
    }


    const gigabytes =
      value /
      1000;


    return `${Number(
      gigabytes.toFixed(
        gigabytes >= 10
          ? 1
          : 2
      )
    )} GB`;
  }


  function formatDate(
    dateString
  ) {
    if (
      !dateString
    ) {
      return "Not available";
    }


    const date =
      new Date(
        dateString
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not available";
    }


    return date.toLocaleString(
      undefined,
      {
        month:
          "short",

        day:
          "numeric",

        year:
          "numeric",

        hour:
          "numeric",

        minute:
          "2-digit",
      }
    );
  }


  function getRiskClass(
    riskLevel
  ) {
    if (
      riskLevel ===
      "HIGH"
    ) {
      return "result-risk-high";
    }


    if (
      riskLevel ===
      "CAUTION"
    ) {
      return "result-risk-caution";
    }


    return "result-risk-low";
  }


  function getMonitoringModeLabel(
    mode
  ) {
    if (
      mode ===
      "extended"
    ) {
      return "Extended Monitoring";
    }


    if (
      mode ===
      "focused"
    ) {
      return "Focused Survey";
    }


    return "Legacy / not recorded";
  }


  function getCaptureWindowLabel(
    captureWindow
  ) {
    if (
      captureWindow ===
      "continuous"
    ) {
      return "24-Hour Monitoring";
    }


    if (
      captureWindow ===
      "daylight"
    ) {
      return "Daylight Only";
    }


    return "Not recorded";
  }


  function getEvidenceLabel(
    evidence
  ) {
    if (
      !evidence
    ) {
      return "Not recorded";
    }


    return String(
      evidence
    )
      .replace(
        /_/g,
        " "
      )
      .toUpperCase();
  }


  function finiteNumberOrNull(
    value
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }


    const numericValue =
      Number(
        value
      );


    return Number.isFinite(
      numericValue
    )
      ? numericValue
      : null;
  }


  function handleStartAnotherScan() {
    resetScan();


    navigate(
      "/"
    );
  }


  const endedEarly =
    currentScan.completionType ===
    "ended-early";


  const actualDuration =
    finiteNumberOrNull(
      currentScan
        .actualDurationMinutes ??
      currentScan
        .plannedDurationMinutes
    );


  const psyllidCount =
    finiteNumberOrNull(
      currentScan
        .psyllidCount
    );


  const hasValidCount =
    psyllidCount !==
    null;


  const savedWeeklyRate =
    finiteNumberOrNull(
      currentScan
        .captureRatePerWeek
    );


  const derivedWeeklyRate =
    hasValidCount &&
    actualDuration !==
      null &&
    actualDuration >
      0
      ? (
          psyllidCount *
          MINUTES_PER_WEEK
        ) /
        actualDuration
      : null;


  const weeklyRate =
    savedWeeklyRate !==
    null
      ? savedWeeklyRate
      : finiteNumberOrNull(
          currentScan
            .protocolVersion
        ) >=
          2 &&
        Number.isFinite(
          derivedWeeklyRate
        )
      ? derivedWeeklyRate
      : null;


  const hasWeeklyRate =
    Number.isFinite(
      weeklyRate
    );


  const riskMetricLabel =
    currentScan.riskMetric ===
      "ACP_PER_TRAP_WEEK" ||
    currentScan.riskMetric ===
      "STABILIZED_ACP_PER_TRAP_WEEK" ||
    hasWeeklyRate
      ? "ACP / trap-week"
      : "Legacy prototype classification";


  const riskLevel =
    currentScan.riskLevel ??
    "UNCLASSIFIED";


  const scheduledCaptureCount =
    finiteNumberOrNull(
      currentScan
        .scheduledCaptureCount
    );


  const hasScheduledCaptureCount =
    scheduledCaptureCount !==
      null &&
    scheduledCaptureCount >=
      0;


  const estimatedStorageMB =
    finiteNumberOrNull(
      currentScan
        .estimatedStorageMB
    );


  const hasStorageEstimate =
    estimatedStorageMB !==
      null &&
    estimatedStorageMB >=
      0;


  const protocolVersion =
    finiteNumberOrNull(
      currentScan
        .protocolVersion
    );


  const isProtocolV2 =
    protocolVersion !==
      null &&
    protocolVersion >=
      2;


  if (
    currentScan.status !==
    "complete"
  ) {
    return (
      <div className="scan-result-page">

        <div className="scan-result-empty">

          <div className="scan-result-empty-icon">
            ✓
          </div>

          <div className="page-eyebrow">
            SCAN RESULT
          </div>

          <h1>
            No completed scan
          </h1>

          <p>
            There is currently no
            completed Sentinel
            observation to display.
          </p>

          <Link
            to="/"
            className="scan-result-primary-button"
          >
            Return to Monitoring Map
          </Link>

        </div>

      </div>
    );
  }


  return (
    <div className="scan-result-page">

      <div className="scan-result-header">

        <div>

          <div className="page-eyebrow">
            OBSERVATION COMPLETE
          </div>

          <h1 className="scan-result-title">
            Scan Complete
          </h1>

          <p className="scan-result-description">
            The represented monitoring
            session has finished and this
            prototype observation has
            been saved to CitraGuard.
          </p>

        </div>


        <div className="scan-result-saved-badge">

          <span>
            ✓
          </span>

          Saved

        </div>

      </div>


      <section
        className={`scan-result-hero ${getRiskClass(
          riskLevel
        )}`}
      >

        <div className="scan-result-risk-section">

          <span className="scan-result-risk-label">
            PROTOTYPE MONITORING CLASSIFICATION
          </span>

          <div className="scan-result-risk-badge">
            {riskLevel}
          </div>


          <div className="scan-result-count">

            <strong>
              {psyllidCount ??
                "—"}
            </strong>

            <div>

              <span>
                ACP observation count
              </span>

              <small>
                Prepared sticky-card
                prototype workflow
              </small>

            </div>

          </div>


          {hasWeeklyRate && (

            <div className="scan-result-info-note">

              <strong>
                Normalized monitoring rate:{" "}
                {Number(
                  weeklyRate.toFixed(
                    1
                  )
                )}{" "}
                ACP / trap-week
              </strong>

              <div>
                This rate adjusts the
                observation count for the
                represented trap exposure.
                Short exposures can produce
                unstable extrapolations and
                should be interpreted as
                preliminary.
              </div>

            </div>

          )}

        </div>


        <div className="scan-result-identity">

          <div>

            <span>
              OBSERVATION
            </span>

            <strong>
              {currentScan.scanName ??
                "Unnamed observation"}
            </strong>

          </div>


          <div className="scan-result-location">

            <div>

              <span>
                Latitude
              </span>

              <strong>
                {finiteNumberOrNull(
                  currentScan.latitude
                ) !== null
                  ? finiteNumberOrNull(
                      currentScan.latitude
                    ).toFixed(
                      5
                    )
                  : "—"}
              </strong>

            </div>


            <div>

              <span>
                Longitude
              </span>

              <strong>
                {finiteNumberOrNull(
                  currentScan.longitude
                ) !== null
                  ? finiteNumberOrNull(
                      currentScan.longitude
                    ).toFixed(
                      5
                    )
                  : "—"}
              </strong>

            </div>

          </div>


          {currentScan
            .isAreaUpdate && (

            <div className="scan-result-area-update">
              Added to an existing
              monitoring area
            </div>

          )}

        </div>

      </section>


      <div className="scan-result-grid">

        <section className="scan-result-card">

          <div className="scan-result-section-heading">

            <div>

              <div className="scan-result-section-eyebrow">
                MONITORING SESSION
              </div>

              <h2>
                Deployment Summary
              </h2>

            </div>

          </div>


          <div className="scan-result-summary-grid">

            <div>

              <span>
                Monitoring Type
              </span>

              <strong>
                {getMonitoringModeLabel(
                  currentScan
                    .monitoringMode
                )}
              </strong>

            </div>


            <div>

              <span>
                Planned Duration
              </span>

              <strong>
                {formatDuration(
                  currentScan
                    .plannedDurationMinutes
                )}
              </strong>

            </div>


            <div>

              <span>
                Represented Exposure
              </span>

              <strong>
                {formatDuration(
                  actualDuration
                )}
              </strong>

            </div>


            <div>

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


            <div>

              <span>
                Capture Window
              </span>

              <strong>
                {getCaptureWindowLabel(
                  currentScan
                    .captureWindow
                )}
              </strong>

            </div>


            <div>

              <span>
                Scheduled Captures
              </span>

              <strong>
                {hasScheduledCaptureCount
                  ? scheduledCaptureCount
                  : "Not recorded"}
              </strong>

            </div>


            <div>

              <span>
                Storage Estimate
              </span>

              <strong>
                {hasStorageEstimate
                  ? formatStorage(
                      estimatedStorageMB
                    )
                  : "Not recorded"}
              </strong>

            </div>


            <div>

              <span>
                Completion
              </span>

              <strong>
                {endedEarly
                  ? "Ended early"
                  : "Completed normally"}
              </strong>

            </div>


            <div>

              <span>
                Recorded
              </span>

              <strong>
                {formatDate(
                  currentScan.endedAt ??
                    currentScan.createdAt
                )}
              </strong>

            </div>

          </div>


          {endedEarly && (

            <div className="scan-result-info-note">

              This observation ended
              before the configured
              monitoring period. Any
              exposure-normalized rate
              uses the represented
              duration recorded when the
              session ended.

            </div>

          )}

        </section>


        <section className="scan-result-card">

          <div className="scan-result-section-heading">

            <div>

              <div className="scan-result-section-eyebrow">
                MONITORING METRIC
              </div>

              <h2>
                Exposure Context
              </h2>

              <p>
                CitraGuard separates the
                observed count from the
                exposure-normalized
                monitoring rate.
              </p>

            </div>

          </div>


          <div className="scan-result-summary-grid">

            <div>

              <span>
                Observation Count
              </span>

              <strong>
                {psyllidCount ??
                  "Not available"}
              </strong>

            </div>


            <div>

              <span>
                Risk Metric
              </span>

              <strong>
                {riskMetricLabel}
              </strong>

            </div>


            <div>

              <span>
                Weekly Rate
              </span>

              <strong>
                {hasWeeklyRate
                  ? `${Number(
                      weeklyRate.toFixed(
                        1
                      )
                    )} ACP / trap-week`
                  : "Not recorded"}
              </strong>

            </div>


            <div>

              <span>
                Evidence
              </span>

              <strong>
                {getEvidenceLabel(
                  currentScan
                    .riskEvidenceLevel
                )}
              </strong>

            </div>

          </div>


          <div className="scan-result-risk-note">

            The normalized rate is a
            prototype monitoring metric,
            not a disease probability and
            not a scientifically validated
            treatment threshold. Very
            short observation windows
            should not be treated as
            equivalent in certainty to
            longer trap exposures.

          </div>

        </section>

      </div>


      <section className="scan-result-card">

        <div className="scan-result-section-heading">

          <div>

            <div className="scan-result-section-eyebrow">
              ENVIRONMENT
            </div>

            <h2>
              Environmental Readings
            </h2>

            <p>
              These saved values belong
              to the prototype sensor
              simulation, not the live
              weather service shown
              during scan setup.
            </p>

          </div>


          <span className="scan-result-simulated-badge">
            SIMULATED
          </span>

        </div>


        <div className="scan-result-sensor-grid">

          <div>

            <span>
              Temperature
            </span>

            <strong>
              {currentScan.temperature ??
                "—"}
              {currentScan.temperature !==
                null &&
              currentScan.temperature !==
                undefined
                ? " °C"
                : ""}
            </strong>

          </div>


          <div>

            <span>
              Humidity
            </span>

            <strong>
              {currentScan.humidity ??
                "—"}
              {currentScan.humidity !==
                null &&
              currentScan.humidity !==
                undefined
                ? "%"
                : ""}
            </strong>

          </div>


          <div>

            <span>
              Light
            </span>

            <strong>
              {currentScan.light ??
                "—"}
              {currentScan.light !==
                null &&
              currentScan.light !==
                undefined
                ? " lux"
                : ""}
            </strong>

          </div>


          <div>

            <span>
              Wind Speed
            </span>

            <strong>
              {currentScan.windSpeed ??
                "—"}
              {currentScan.windSpeed !==
                null &&
              currentScan.windSpeed !==
                undefined
                ? " m/s"
                : ""}
            </strong>

          </div>


          <div>

            <span>
              Wind Direction
            </span>

            <strong>
              {currentScan.windDirection ??
                "—"}
            </strong>

          </div>

        </div>

      </section>


      <section className="scan-result-card scan-result-detection-card">

        <div className="scan-result-section-heading">

          <div>

            <div className="scan-result-section-eyebrow">
              OBSERVATION PROCESSING
            </div>

            <h2>
              Detection Source
            </h2>

            <p>
              The record identifies the
              workflow that produced the
              count. CitraGuard does not
              fabricate AI confidence.
            </p>

          </div>

        </div>


        <div className="scan-result-detection-grid">

          <div>

            <span>
              Observation ID
            </span>

            <strong>
              {currentScan.observationId ??
                "Not available"}
            </strong>

          </div>


          <div>

            <span>
              Detection Method
            </span>

            <strong>
              {currentScan.detectionMethod ??
                "Not available"}
            </strong>

          </div>


          <div>

            <span>
              AI Confidence
            </span>

            <strong>
              {currentScan.confidence !==
                null &&
              currentScan.confidence !==
                undefined &&
              currentScan.confidence !==
                "" &&
              Number.isFinite(
                Number(
                  currentScan.confidence
                )
              )
                ? `${Number(
                    currentScan.confidence
                  )}%`
                : "Not available"}
            </strong>

            {!(
              currentScan.confidence !==
                null &&
              currentScan.confidence !==
                undefined &&
              currentScan.confidence !==
                "" &&
              Number.isFinite(
                Number(
                  currentScan.confidence
                )
              )
            ) && (
              <small>
                No model confidence
                produced
              </small>
            )}

          </div>

        </div>


        <div className="scan-result-ai-note">

          Prepared sticky-card labels
          are prototype observation
          data. They are not presented
          as YOLO output. Confidence
          and bounding boxes should
          appear only after a real
          computer-vision model
          generates them.

        </div>

      </section>


      <section className="scan-result-card">

        <div className="scan-result-section-heading">

          <div>

            <div className="scan-result-section-eyebrow">
              CLASSIFICATION
            </div>

            <h2>
              Prototype Monitoring Classification
            </h2>

            <p>
              The displayed classification
              summarizes this monitoring
              record. It does not diagnose
              citrus greening.
            </p>

          </div>


          <span
            className={`scan-result-small-risk ${getRiskClass(
              riskLevel
            )}`}
          >
            {riskLevel}
          </span>

        </div>


        <div className="scan-result-risk-note">

          LOW, CAUTION, and HIGH are
          prototype surveillance labels.
          They are not confirmed HLB
          infection states, disease
          probabilities, regulatory
          action levels, or validated
          treatment thresholds. The app
          keeps the raw observation count
          separate from exposure
          normalization so future
          validation can revise the
          classification method without
          rewriting the underlying scan
          history.

        </div>

      </section>


      <details className="scan-result-technical">

        <summary>
          Technical Details
        </summary>


        <div className="scan-result-technical-grid">

          <div>

            <span>
              Scan ID
            </span>

            <strong>
              {currentScan.scanId ??
                "—"}
            </strong>

          </div>


          <div>

            <span>
              Observation ID
            </span>

            <strong>
              {currentScan.observationId ??
                "—"}
            </strong>

          </div>


          <div>

            <span>
              Protocol
            </span>

            <strong>
              {isProtocolV2
                ? `Version ${protocolVersion}`
                : "Legacy"}
            </strong>

          </div>


          <div>

            <span>
              Area ID
            </span>

            <strong>
              {currentScan.areaId ??
                "—"}
            </strong>

          </div>


          <div>

            <span>
              Latitude
            </span>

            <strong>
              {finiteNumberOrNull(
                currentScan.latitude
              ) !== null
                ? finiteNumberOrNull(
                    currentScan.latitude
                  ).toFixed(
                    6
                  )
                : "—"}
            </strong>

          </div>


          <div>

            <span>
              Longitude
            </span>

            <strong>
              {finiteNumberOrNull(
                currentScan.longitude
              ) !== null
                ? finiteNumberOrNull(
                    currentScan.longitude
                  ).toFixed(
                    6
                  )
                : "—"}
            </strong>

          </div>


          <div>

            <span>
              Detection Method
            </span>

            <strong>
              {currentScan.detectionMethod ??
                "—"}
            </strong>

          </div>


          <div>

            <span>
              Risk Metric
            </span>

            <strong>
              {currentScan.riskMetric ??
                (hasWeeklyRate
                  ? "ACP_PER_TRAP_WEEK"
                  : "LEGACY")}
            </strong>

          </div>


          <div>

            <span>
              Completion Type
            </span>

            <strong>
              {currentScan.completionType ??
                "—"}
            </strong>

          </div>


          <div>

            <span>
              Started
            </span>

            <strong>
              {formatDate(
                currentScan.startedAt
              )}
            </strong>

          </div>


          <div>

            <span>
              Monitoring Ended
            </span>

            <strong>
              {formatDate(
                currentScan.monitoringEndedAt
              )}
            </strong>

          </div>


          <div>

            <span>
              Saved
            </span>

            <strong>
              {formatDate(
                currentScan.endedAt ??
                  currentScan.createdAt
              )}
            </strong>

          </div>

        </div>

      </details>


      <div className="scan-result-actions">

        <Link
          to="/"
          className="scan-result-secondary-button"
        >
          Return to Map
        </Link>


        {currentScan.scanId && (

          <Link
            to={`/scan-detail/${currentScan.scanId}`}
            className="scan-result-secondary-button"
          >
            View Full Record
          </Link>

        )}


        <button
          type="button"
          className="scan-result-primary-button"
          onClick={
            handleStartAnotherScan
          }
        >
          Start Another Scan
        </button>

      </div>


      <div className="scan-result-prototype-note">

        <strong>
          Prototype disclosure:
        </strong>{" "}

        The physical CitraGuard Sentinel
        is not connected. Monitoring time
        is represented in Demo Mode and
        saved environmental sensor values
        are simulated. Prepared observation
        labels are used for the current
        sticky-card workflow. Map selection,
        configuration, persistence,
        geographic history, storage
        forecasting, and application
        navigation are functional software
        features.

      </div>

    </div>
  );
}


export default ScanResultPage;
