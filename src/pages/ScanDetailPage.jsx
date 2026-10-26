import {
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router";

import {
  useScan,
} from "../context/ScanContext.jsx";


const MINUTES_PER_WEEK =
  7 *
  24 *
  60;


function ScanDetailPage() {
  const {
    scanId,
  } = useParams();


  const navigate =
    useNavigate();


  const {
    getScanById,
    renameScan,
  } = useScan();


  const scan =
    getScanById(
      scanId
    );


  const [
    renameOpen,
    setRenameOpen,
  ] = useState(
    false
  );


  const [
    renameValue,
    setRenameValue,
  ] = useState(
    scan?.scanName ??
      ""
  );


  function formatDuration(
    minutes
  ) {
    if (
      minutes === null ||
      minutes === undefined ||
      minutes === ""
    ) {
      return "Not recorded";
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
      return "Not recorded";
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
      return "Not recorded";
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
      return "Not recorded";
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
      return "Not recorded";
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
      return "Not recorded";
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


  function handleRenameSave() {
    const cleanedName =
      renameValue.trim();


    if (
      !cleanedName
    ) {
      return;
    }


    renameScan?.(
      scan.scanId,
      cleanedName
    );


    setRenameOpen(
      false
    );
  }


  if (!scan) {
    return (
      <div className="scan-result-page">

        <div className="scan-result-empty">

          <div className="page-eyebrow">
            SAVED OBSERVATION
          </div>

          <h1>
            Scan not found
          </h1>

          <p>
            CitraGuard could not find
            this saved observation in
            the current scan history.
          </p>

          <button
            type="button"
            className="scan-result-primary-button"
            onClick={() =>
              navigate(
                "/scans"
              )
            }
          >
            Return to Scan History
          </button>

        </div>

      </div>
    );
  }


  const actualDuration =
    finiteNumberOrNull(
      scan.actualDurationMinutes ??
      scan.plannedDurationMinutes
    );


  const hasValidCount =
    scan.psyllidCount !==
      null &&
    scan.psyllidCount !==
      undefined &&
    Number.isFinite(
      Number(
        scan.psyllidCount
      )
    );


  const psyllidCount =
    hasValidCount
      ? Number(
          scan.psyllidCount
        )
      : null;


  const savedWeeklyRate =
    scan.captureRatePerWeek !==
      null &&
    scan.captureRatePerWeek !==
      undefined &&
    Number.isFinite(
      Number(
        scan.captureRatePerWeek
      )
    )
      ? Number(
          scan.captureRatePerWeek
        )
      : null;


  const derivedWeeklyRate =
    hasValidCount &&
    Number.isFinite(
      actualDuration
    ) &&
    actualDuration >
      0
      ? (
          psyllidCount *
          MINUTES_PER_WEEK
        ) /
        actualDuration
      : null;


  const weeklyRate =
    savedWeeklyRate ??
    (
      finiteNumberOrNull(
        scan.protocolVersion
      ) !== null &&
      finiteNumberOrNull(
        scan.protocolVersion
      ) >=
        2 &&
      Number.isFinite(
        derivedWeeklyRate
      )
        ? derivedWeeklyRate
        : null
    );


  const hasWeeklyRate =
    Number.isFinite(
      weeklyRate
    );


  const scheduledCaptureCount =
    scan.scheduledCaptureCount !==
      null &&
    scan.scheduledCaptureCount !==
      undefined &&
    Number.isFinite(
      Number(
        scan.scheduledCaptureCount
      )
    )
      ? Number(
          scan.scheduledCaptureCount
        )
      : null;


  const estimatedStorageMB =
    scan.estimatedStorageMB !==
      null &&
    scan.estimatedStorageMB !==
      undefined &&
    Number.isFinite(
      Number(
        scan.estimatedStorageMB
      )
    )
      ? Number(
          scan.estimatedStorageMB
        )
      : null;


  const hasConfidence =
    scan.confidence !==
      null &&
    scan.confidence !==
      undefined &&
    scan.confidence !==
      "" &&
    Number.isFinite(
      Number(
        scan.confidence
      )
    );


  const riskLevel =
    scan.riskLevel ??
    "UNCLASSIFIED";


  return (
    <div className="scan-result-page">

      <div className="scan-result-header">

        <div>

          <button
            type="button"
            className="scan-config-v2-back"
            onClick={() =>
              navigate(
                -1
              )
            }
          >
            ← Back
          </button>

          <div className="page-eyebrow">
            SAVED OBSERVATION
          </div>

          <h1 className="scan-result-title">
            {scan.scanName ??
              "Saved Scan"}
          </h1>

          <p className="scan-result-description">
            Archived CitraGuard
            monitoring record.
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
                Saved observation
              </small>

            </div>

          </div>


          {hasWeeklyRate && (

            <div className="scan-result-info-note">

              <strong>
                {Number(
                  weeklyRate.toFixed(
                    1
                  )
                )}{" "}
                ACP / trap-week
              </strong>

              <div>
                Prototype
                exposure-normalized
                monitoring rate.
              </div>

            </div>

          )}

        </div>


        <div className="scan-result-identity">

          <div>

            <span>
              SCAN ID
            </span>

            <strong>
              {scan.scanId}
            </strong>

          </div>


          <div className="scan-result-location">

            <div>

              <span>
                Latitude
              </span>

              <strong>
                {finiteNumberOrNull(
                  scan.latitude
                ) !== null
                  ? finiteNumberOrNull(
                      scan.latitude
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
                  scan.longitude
                ) !== null
                  ? finiteNumberOrNull(
                      scan.longitude
                    ).toFixed(
                      5
                    )
                  : "—"}
              </strong>

            </div>

          </div>


          {renameOpen ? (

            <div>

              <input
                type="text"
                className="scan-config-v2-input"
                value={
                  renameValue
                }
                onChange={(
                  event
                ) =>
                  setRenameValue(
                    event.target
                      .value
                  )
                }
              />

              <div className="scan-result-actions">

                <button
                  type="button"
                  className="scan-result-primary-button"
                  onClick={
                    handleRenameSave
                  }
                >
                  Save Name
                </button>

                <button
                  type="button"
                  className="scan-result-secondary-button"
                  onClick={() => {
                    setRenameValue(
                      scan.scanName ??
                        ""
                    );

                    setRenameOpen(
                      false
                    );
                  }}
                >
                  Cancel
                </button>

              </div>

            </div>

          ) : (

            <button
              type="button"
              className="scan-result-secondary-button"
              onClick={() =>
                setRenameOpen(
                  true
                )
              }
            >
              Rename Observation
            </button>

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
                Deployment Record
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
                  scan.monitoringMode
                )}
              </strong>

            </div>


            <div>

              <span>
                Planned Duration
              </span>

              <strong>
                {formatDuration(
                  scan.plannedDurationMinutes
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
                  scan.captureIntervalMinutes
                )}
              </strong>

            </div>


            <div>

              <span>
                Capture Window
              </span>

              <strong>
                {getCaptureWindowLabel(
                  scan.captureWindow
                )}
              </strong>

            </div>


            <div>

              <span>
                Scheduled Captures
              </span>

              <strong>
                {scheduledCaptureCount ??
                  "Not recorded"}
              </strong>

            </div>


            <div>

              <span>
                Storage Estimate
              </span>

              <strong>
                {estimatedStorageMB !==
                null
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
                {scan.completionType ===
                "ended-early"
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
                  scan.endedAt ??
                    scan.createdAt
                )}
              </strong>

            </div>

          </div>

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

            </div>

          </div>


          <div className="scan-result-summary-grid">

            <div>

              <span>
                Observation Count
              </span>

              <strong>
                {psyllidCount ??
                  "Not recorded"}
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
                Risk Metric
              </span>

              <strong>
                {scan.riskMetric ??
                  (hasWeeklyRate
                    ? "ACP_PER_TRAP_WEEK"
                    : "LEGACY")}
              </strong>

            </div>


            <div>

              <span>
                Evidence
              </span>

              <strong>
                {getEvidenceLabel(
                  scan.riskEvidenceLevel
                )}
              </strong>

            </div>

          </div>


          <div className="scan-result-risk-note">

            Exposure-normalized values
            are prototype surveillance
            metrics. They do not indicate
            HLB infection probability or
            a validated treatment
            threshold. Short exposures can
            produce unstable weekly
            extrapolations.

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
              Saved Sensor Readings
            </h2>

            <p>
              Values in prototype scan
              records are simulated unless
              explicitly identified
              otherwise.
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
              {scan.temperature ??
                "—"}
              {scan.temperature !==
                null &&
              scan.temperature !==
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
              {scan.humidity ??
                "—"}
              {scan.humidity !==
                null &&
              scan.humidity !==
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
              {scan.light ??
                "—"}
              {scan.light !==
                null &&
              scan.light !==
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
              {scan.windSpeed ??
                "—"}
              {scan.windSpeed !==
                null &&
              scan.windSpeed !==
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
              {scan.windDirection ??
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
              Detection Record
            </h2>

          </div>

        </div>


        <div className="scan-result-detection-grid">

          <div>

            <span>
              Observation ID
            </span>

            <strong>
              {scan.observationId ??
                "Not recorded"}
            </strong>

          </div>


          <div>

            <span>
              Detection Method
            </span>

            <strong>
              {scan.detectionMethod ??
                "Not recorded"}
            </strong>

          </div>


          <div>

            <span>
              AI Confidence
            </span>

            <strong>
              {hasConfidence
                ? `${Number(
                    scan.confidence
                  )}%`
                : "Not available"}
            </strong>

            {!hasConfidence && (
              <small>
                No real model confidence
                was produced
              </small>
            )}

          </div>

        </div>


        <div className="scan-result-ai-note">

          Prepared observation labels
          are prototype data. They are
          not presented as AI detections.
          Confidence and bounding boxes
          should appear only when the
          connected computer-vision model
          actually returns them.

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
              {scan.scanId ??
                "—"}
            </strong>

          </div>


          <div>

            <span>
              Area ID
            </span>

            <strong>
              {scan.areaId ??
                "—"}
            </strong>

          </div>


          <div>

            <span>
              Observation ID
            </span>

            <strong>
              {scan.observationId ??
                "—"}
            </strong>

          </div>


          <div>

            <span>
              Protocol Version
            </span>

            <strong>
              {Number.isFinite(
                Number(
                  scan.protocolVersion
                )
              )
                ? `Version ${Number(
                    scan.protocolVersion
                  )}`
                : "Legacy"}
            </strong>

          </div>


          <div>

            <span>
              Latitude
            </span>

            <strong>
              {finiteNumberOrNull(
                scan.latitude
              ) !== null
                ? finiteNumberOrNull(
                    scan.latitude
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
                scan.longitude
              ) !== null
                ? finiteNumberOrNull(
                    scan.longitude
                  ).toFixed(
                    6
                  )
                : "—"}
            </strong>

          </div>


          <div>

            <span>
              Started
            </span>

            <strong>
              {formatDate(
                scan.startedAt
              )}
            </strong>

          </div>


          <div>

            <span>
              Monitoring Ended
            </span>

            <strong>
              {formatDate(
                scan.monitoringEndedAt
              )}
            </strong>

          </div>


          <div>

            <span>
              Saved
            </span>

            <strong>
              {formatDate(
                scan.endedAt ??
                  scan.createdAt
              )}
            </strong>

          </div>


          <div>

            <span>
              Completion Type
            </span>

            <strong>
              {scan.completionType ??
                "—"}
            </strong>

          </div>


          <div>

            <span>
              Area Update
            </span>

            <strong>
              {scan.isAreaUpdate
                ? "Yes"
                : "No"}
            </strong>

          </div>


          <div>

            <span>
              Updated Area
            </span>

            <strong>
              {scan.updatesAreaId ??
                "—"}
            </strong>

          </div>

        </div>

      </details>


      <div className="scan-result-actions">

        <button
          type="button"
          className="scan-result-secondary-button"
          onClick={() =>
            navigate(
              -1
            )
          }
        >
          Back
        </button>


        <button
          type="button"
          className="scan-result-secondary-button"
          onClick={() =>
            navigate(
              "/",
              {
                state: {
                  focusScanId:
                    scan.scanId,

                  focusLatitude:
                    scan.latitude,

                  focusLongitude:
                    scan.longitude,
                },
              }
            )
          }
        >
          View on Map
        </button>


        <button
          type="button"
          className="scan-result-primary-button"
          onClick={() =>
            navigate(
              "/scans"
            )
          }
        >
          Scan History
        </button>

      </div>


      <div className="scan-result-prototype-note">

        <strong>
          Prototype disclosure:
        </strong>{" "}

        The archived record preserves
        the values saved when this scan
        completed. Physical Sentinel
        communication is not active.
        Prepared sticky-card labels and
        simulated sensor readings remain
        clearly separated from future
        AI-generated detections and live
        hardware telemetry.

      </div>

    </div>
  );
}


export default ScanDetailPage;
