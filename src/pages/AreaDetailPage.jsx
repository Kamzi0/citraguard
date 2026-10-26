import {
  useMemo,
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


function AreaDetailPage() {
  const {
    areaId,
  } = useParams();


  const navigate =
    useNavigate();


  const {
    completedScans,
    getAreaById,
    selectExistingArea,
  } = useScan();


  const area =
    getAreaById(
      areaId
    );


  const areaScans =
    useMemo(
      () =>
        completedScans
          .filter(
            (scan) =>
              scan.areaId ===
              areaId
          )
          .sort(
            (
              first,
              second
            ) => {
              const firstTime =
                new Date(
                  first.endedAt ??
                    first.createdAt ??
                    first.startedAt ??
                    0
                ).getTime();


              const secondTime =
                new Date(
                  second.endedAt ??
                    second.createdAt ??
                    second.startedAt ??
                    0
                ).getTime();


              return (
                secondTime -
                firstTime
              );
            }
          ),
      [
        completedScans,
        areaId,
      ]
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


  function formatRate(
    value
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "Not recorded";
    }


    const numericValue =
      Number(
        value
      );


    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return "Not recorded";
    }


    return `${Number(
      numericValue.toFixed(
        1
      )
    )} ACP / trap-week`;
  }


  function getRiskClass(
    riskLevel
  ) {
    if (
      riskLevel ===
      "HIGH"
    ) {
      return "area-detail-risk-high";
    }


    if (
      riskLevel ===
      "CAUTION"
    ) {
      return "area-detail-risk-caution";
    }


    if (
      riskLevel ===
      "LOW"
    ) {
      return "area-detail-risk-low";
    }


    return "area-detail-risk-unknown";
  }


  function getEvidenceLabel(
    evidence
  ) {
    if (
      !evidence
    ) {
      return "Not recorded";
    }


    if (
      evidence ===
      "PRELIMINARY"
    ) {
      return "Preliminary";
    }


    if (
      evidence ===
      "LIMITED"
    ) {
      return "Limited";
    }


    if (
      evidence ===
      "STANDARD"
    ) {
      return "Standard";
    }


    if (
      evidence ===
      "LEGACY"
    ) {
      return "Legacy";
    }


    return String(
      evidence
    )
      .replace(
        /_/g,
        " "
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }


  function getScanDuration(
    scan
  ) {
    const duration =
      Number(
        scan.actualDurationMinutes ??
        scan.plannedDurationMinutes
      );


    return Number.isFinite(
      duration
    )
      ? duration
      : null;
  }


  function getObservedRate(
    scan
  ) {
    if (
      scan.captureRatePerWeek !==
        null &&
      scan.captureRatePerWeek !==
        undefined &&
      Number.isFinite(
        Number(
          scan.captureRatePerWeek
        )
      )
    ) {
      return Number(
        scan.captureRatePerWeek
      );
    }


    const duration =
      getScanDuration(
        scan
      );


    const count =
      scan.psyllidCount !==
        null &&
      scan.psyllidCount !==
        undefined
        ? Number(
            scan.psyllidCount
          )
        : NaN;


    if (
      Number(
        scan.protocolVersion
      ) >=
        2 &&
      Number.isFinite(
        duration
      ) &&
      duration >
        0 &&
      Number.isFinite(
        count
      )
    ) {
      return (
        count *
        MINUTES_PER_WEEK
      ) /
        duration;
    }


    return null;
  }


  function handleAddObservation() {
    if (
      !area
    ) {
      return;
    }


    selectExistingArea(
      area,
      area.centerLatitude,
      area.centerLongitude
    );


    navigate(
      "/new-scan"
    );
  }


  if (!area) {
    return (
      <div className="area-detail-v2-page">

        <section className="area-detail-v2-empty">

          <div className="page-eyebrow">
            MONITORING AREA
          </div>

          <h1>
            Area not found
          </h1>

          <p>
            CitraGuard could not find
            this monitoring area in the
            saved surveillance history.
          </p>

          <button
            type="button"
            className="area-detail-v2-primary-button"
            onClick={() =>
              navigate(
                "/"
              )
            }
          >
            Return to Map
          </button>

        </section>

      </div>
    );
  }


  const totalExposureMinutes =
    finiteNumberOrNull(
      area.totalExposureMinutes ??
      area.totalMonitoringMinutes
    );


  const totalPsyllidCount =
    finiteNumberOrNull(
      area.totalPsyllidCount
    );


  const observedRate =
    area.observedRatePerWeek !==
      null &&
    area.observedRatePerWeek !==
      undefined &&
    Number.isFinite(
      Number(
        area.observedRatePerWeek
      )
    )
      ? Number(
          area.observedRatePerWeek
        )
      : (
          Number.isFinite(
            totalPsyllidCount
          ) &&
          totalPsyllidCount >=
            0 &&
          Number.isFinite(
            totalExposureMinutes
          ) &&
          totalExposureMinutes >
            0 &&
          area.currentRiskMetric !==
            "LEGACY_COUNT"
            ? (
                totalPsyllidCount *
                MINUTES_PER_WEEK
              ) /
                totalExposureMinutes
            : null
        );


  const classificationRate =
    area.classificationRatePerWeek !==
      null &&
    area.classificationRatePerWeek !==
      undefined &&
    Number.isFinite(
      Number(
        area.classificationRatePerWeek
      )
    )
      ? Number(
          area.classificationRatePerWeek
        )
      : (
          area.currentRiskMetric !==
            "LEGACY_COUNT" &&
          Number.isFinite(
            Number(
              area.currentRiskValue
            )
          )
            ? Number(
                area.currentRiskValue
              )
            : null
        );


  const riskLevel =
    area.currentRiskLevel ??
    "UNCLASSIFIED";


  return (
    <div className="area-detail-v2-page">

      <div className="area-detail-v2-header">

        <div>

          <button
            type="button"
            className="area-detail-v2-back"
            onClick={() =>
              navigate(
                -1
              )
            }
          >
            ← Back
          </button>

          <div className="page-eyebrow">
            MONITORING AREA
          </div>

          <h1>
            {area.areaName ??
              "Monitoring Area"}
          </h1>

          <p>
            Combined surveillance history
            for one CitraGuard monitoring
            location.
          </p>

        </div>


        <button
          type="button"
          className="area-detail-v2-primary-button"
          onClick={
            handleAddObservation
          }
        >
          Update This Area
        </button>

      </div>


      <section
        className={`area-detail-v2-hero ${getRiskClass(
          riskLevel
        )}`}
      >

        <div className="area-detail-v2-classification">

          <span>
            CURRENT PROTOTYPE CLASSIFICATION
          </span>

          <strong>
            {riskLevel}
          </strong>

          <small>
            {getEvidenceLabel(
              area.riskEvidenceLevel
            )}{" "}
            evidence
          </small>

        </div>


        <div className="area-detail-v2-location">

          <div>

            <span>
              CENTER
            </span>

            <strong>
              {finiteNumberOrNull(
                area.centerLatitude
              ) !== null
                ? finiteNumberOrNull(
                    area.centerLatitude
                  ).toFixed(
                    5
                  )
                : "—"}
              ,{" "}
              {finiteNumberOrNull(
                area.centerLongitude
              ) !== null
                ? finiteNumberOrNull(
                    area.centerLongitude
                  ).toFixed(
                    5
                  )
                : "—"}
            </strong>

          </div>


          <div>

            <span>
              VISUALIZATION RADIUS
            </span>

            <strong>
              {finiteNumberOrNull(
                area.radiusMeters
              ) !== null
                ? `${finiteNumberOrNull(
                    area.radiusMeters
                  )} m`
                : "Not recorded"}
            </strong>

          </div>


          <div>

            <span>
              LAST UPDATED
            </span>

            <strong>
              {formatDate(
                area.lastUpdated
              )}
            </strong>

          </div>

        </div>

      </section>


      <div className="area-detail-v2-summary-grid">

        <section className="area-detail-v2-summary-card">

          <span>
            Observations
          </span>

          <strong>
            {areaScans.length}
          </strong>

          <small>
            Saved scans contributing to
            this area
          </small>

        </section>


        <section className="area-detail-v2-summary-card">

          <span>
            Total ACP
          </span>

          <strong>
            {Number.isFinite(
              totalPsyllidCount
            )
              ? totalPsyllidCount
              : "—"}
          </strong>

          <small>
            Combined observation count
          </small>

        </section>


        <section className="area-detail-v2-summary-card">

          <span>
            Total Exposure
          </span>

          <strong>
            {formatDuration(
              totalExposureMinutes
            )}
          </strong>

          <small>
            Combined represented trap
            exposure
          </small>

        </section>


        <section className="area-detail-v2-summary-card">

          <span>
            Evidence
          </span>

          <strong>
            {getEvidenceLabel(
              area.riskEvidenceLevel
            )}
          </strong>

          <small>
            Based on accumulated exposure
          </small>

        </section>

      </div>


      <div className="area-detail-v2-rate-grid">

        <section className="area-detail-v2-card">

          <div className="area-detail-v2-card-heading">

            <div>

              <span>
                OBSERVED RATE
              </span>

              <h2>
                Raw Exposure-Normalized Rate
              </h2>

            </div>

          </div>


          <div className="area-detail-v2-big-rate">
            {formatRate(
              observedRate
            )}
          </div>


          <p>
            This is the mathematical
            extrapolation from total ACP
            divided by total represented
            exposure, scaled to one
            trap-week.
          </p>

        </section>


        <section className="area-detail-v2-card">

          <div className="area-detail-v2-card-heading">

            <div>

              <span>
                CLASSIFICATION RATE
              </span>

              <h2>
                Heat-Map Classification Input
              </h2>

            </div>

          </div>


          <div className="area-detail-v2-big-rate">
            {formatRate(
              classificationRate
            )}
          </div>


          <p>
            For short Protocol v2
            observations, CitraGuard uses a
            prototype minimum-exposure
            stabilization rule for the
            LOW, CAUTION, or HIGH color.
            The raw observed rate remains
            visible separately.
          </p>

        </section>

      </div>


      <section className="area-detail-v2-card">

        <div className="area-detail-v2-card-heading">

          <div>

            <span>
              HOW THE AREA RESULT WORKS
            </span>

            <h2>
              Exposure-Weighted Aggregation
            </h2>

          </div>

        </div>


        <div className="area-detail-v2-formula">

          <div>
            <strong>
              Total ACP
            </strong>

            <span>
              ÷
            </span>

            <strong>
              Total Exposure Minutes
            </strong>

            <span>
              ×
            </span>

            <strong>
              10,080
            </strong>

            <span>
              =
            </span>

            <strong>
              ACP / trap-week
            </strong>
          </div>

        </div>


        <p>
          CitraGuard does not average the
          colors from individual scans.
          A longer observation contributes
          more exposure time to the area
          calculation, so it naturally has
          more influence than a short
          observation.
        </p>

      </section>


      <section className="area-detail-v2-card">

        <div className="area-detail-v2-card-heading">

          <div>

            <span>
              AREA HISTORY
            </span>

            <h2>
              Contributing Observations
            </h2>

            <p>
              Each saved observation remains
              individually reviewable even
              though the area result combines
              their exposure.
            </p>

          </div>

        </div>


        {areaScans.length ===
        0 ? (

          <div className="area-detail-v2-no-scans">
            No saved observations were
            found for this area.
          </div>

        ) : (

          <div className="area-detail-v2-scan-list">

            {areaScans.map(
              (scan) => {
                const duration =
                  getScanDuration(
                    scan
                  );


                const count =
                  scan.psyllidCount !==
                    null &&
                  scan.psyllidCount !==
                    undefined &&
                  Number.isFinite(
                    Number(
                      scan.psyllidCount
                    )
                  )
                    ? Number(
                        scan.psyllidCount
                      )
                    : null;


                const scanRate =
                  getObservedRate(
                    scan
                  );


                return (
                  <button
                    key={
                      scan.scanId
                    }
                    type="button"
                    className="area-detail-v2-scan-row"
                    onClick={() =>
                      navigate(
                        `/scan-detail/${scan.scanId}`
                      )
                    }
                  >

                    <div
                      className={`area-detail-v2-scan-risk ${getRiskClass(
                        scan.riskLevel
                      )}`}
                    >
                      {scan.riskLevel ??
                        "UNCLASSIFIED"}
                    </div>


                    <div className="area-detail-v2-scan-main">

                      <strong>
                        {scan.scanName ??
                          "Unnamed observation"}
                      </strong>

                      <span>
                        {formatDate(
                          scan.endedAt ??
                            scan.createdAt
                        )}
                      </span>

                    </div>


                    <div className="area-detail-v2-scan-metric">

                      <span>
                        ACP
                      </span>

                      <strong>
                        {count ??
                          "—"}
                      </strong>

                    </div>


                    <div className="area-detail-v2-scan-metric">

                      <span>
                        Exposure
                      </span>

                      <strong>
                        {formatDuration(
                          duration
                        )}
                      </strong>

                    </div>


                    <div className="area-detail-v2-scan-metric">

                      <span>
                        Raw Rate
                      </span>

                      <strong>
                        {scanRate ===
                        null
                          ? "Legacy"
                          : `${Number(
                              scanRate.toFixed(
                                1
                              )
                            )}/wk`}
                      </strong>

                    </div>


                    <div className="area-detail-v2-scan-metric">

                      <span>
                        Evidence
                      </span>

                      <strong>
                        {getEvidenceLabel(
                          scan.riskEvidenceLevel
                        )}
                      </strong>

                    </div>


                    <div className="area-detail-v2-open">
                      View →
                    </div>

                  </button>
                );
              }
            )}

          </div>

        )}

      </section>


      <details className="area-detail-v2-technical">

        <summary>
          Technical Details
        </summary>


        <div className="area-detail-v2-technical-grid">

          <div>

            <span>
              Area ID
            </span>

            <strong>
              {area.areaId}
            </strong>

          </div>


          <div>

            <span>
              Latest Scan ID
            </span>

            <strong>
              {area.latestScanId ??
                "—"}
            </strong>

          </div>


          <div>

            <span>
              Risk Metric
            </span>

            <strong>
              {area.currentRiskMetric ??
                "Legacy / not recorded"}
            </strong>

          </div>


          <div>

            <span>
              Created
            </span>

            <strong>
              {formatDate(
                area.createdAt
              )}
            </strong>

          </div>


          <div>

            <span>
              Center Latitude
            </span>

            <strong>
              {finiteNumberOrNull(
                area.centerLatitude
              ) !== null
                ? finiteNumberOrNull(
                    area.centerLatitude
                  ).toFixed(
                    6
                  )
                : "—"}
            </strong>

          </div>


          <div>

            <span>
              Center Longitude
            </span>

            <strong>
              {finiteNumberOrNull(
                area.centerLongitude
              ) !== null
                ? finiteNumberOrNull(
                    area.centerLongitude
                  ).toFixed(
                    6
                  )
                : "—"}
            </strong>

          </div>

        </div>

      </details>


      <div className="area-detail-v2-actions">

        <button
          type="button"
          className="area-detail-v2-secondary-button"
          onClick={() =>
            navigate(
              "/"
            )
          }
        >
          Return to Map
        </button>


        <button
          type="button"
          className="area-detail-v2-primary-button"
          onClick={
            handleAddObservation
          }
        >
          Add Observation
        </button>

      </div>


      <div className="area-detail-v2-prototype-note">

        <strong>
          Prototype interpretation:
        </strong>{" "}

        The 15-meter area is a
        visualization radius, not a
        validated ACP movement or HLB
        disease radius. LOW, CAUTION, and
        HIGH are prototype surveillance
        classifications, not disease
        probabilities or validated
        intervention thresholds.

      </div>

    </div>
  );
}


export default AreaDetailPage;
