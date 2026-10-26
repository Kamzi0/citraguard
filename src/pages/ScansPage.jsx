import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  useScan,
} from "../context/ScanContext.jsx";


const MINUTES_PER_WEEK =
  7 *
  24 *
  60;


function ScansPage() {
  const navigate =
    useNavigate();


  const {
    completedScans,
  } = useScan();


  const [
    searchQuery,
    setSearchQuery,
  ] = useState(
    ""
  );


  const [
    riskFilter,
    setRiskFilter,
  ] = useState(
    "ALL"
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
      return {
        date:
          "Date unavailable",

        time:
          "",
      };
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
      return {
        date:
          "Date unavailable",

        time:
          "",
      };
    }


    return {
      date:
        date.toLocaleDateString(
          undefined,
          {
            month:
              "short",

            day:
              "numeric",

            year:
              "numeric",
          }
        ),

      time:
        date.toLocaleTimeString(
          undefined,
          {
            hour:
              "numeric",

            minute:
              "2-digit",
          }
        ),
    };
  }


  function formatStorage(
    megabytes
  ) {
    if (
      megabytes ===
        null ||
      megabytes ===
        undefined
    ) {
      return null;
    }


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
      return null;
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


    return `${Number(
      (
        value /
        1000
      ).toFixed(
        2
      )
    )} GB`;
  }


  function getRiskClass(
    riskLevel
  ) {
    if (
      riskLevel ===
      "HIGH"
    ) {
      return "is-high";
    }


    if (
      riskLevel ===
      "CAUTION"
    ) {
      return "is-caution";
    }


    if (
      riskLevel ===
      "LOW"
    ) {
      return "is-low";
    }


    return "is-unknown";
  }


  function getMonitoringType(
    scan
  ) {
    if (
      scan.monitoringMode ===
      "extended"
    ) {
      return "Extended";
    }


    if (
      scan.monitoringMode ===
      "focused"
    ) {
      return "Focused";
    }


    return "Legacy";
  }


  function getWeeklyRate(
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


    const protocolVersion =
      Number(
        scan.protocolVersion
      );


    const duration =
      Number(
        scan.actualDurationMinutes ??
        scan.plannedDurationMinutes
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
      protocolVersion >=
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


  const sortedScans =
    useMemo(
      () =>
        [
          ...completedScans,
        ].sort(
          (
            firstScan,
            secondScan
          ) => {
            const firstTime =
              new Date(
                firstScan.endedAt ??
                  firstScan.createdAt ??
                  firstScan.startedAt ??
                  0
              ).getTime();


            const secondTime =
              new Date(
                secondScan.endedAt ??
                  secondScan.createdAt ??
                  secondScan.startedAt ??
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
      ]
    );


  const filteredScans =
    useMemo(() => {
      const cleanedQuery =
        searchQuery
          .trim()
          .toLowerCase();


      return sortedScans.filter(
        (scan) => {
          const matchesRisk =
            riskFilter ===
              "ALL" ||
            scan.riskLevel ===
              riskFilter;


          if (
            !matchesRisk
          ) {
            return false;
          }


          if (
            !cleanedQuery
          ) {
            return true;
          }


          return [
            scan.scanId,
            scan.scanName,
            scan.observationId,
          ]
            .filter(
              Boolean
            )
            .some(
              (value) =>
                String(
                  value
                )
                  .toLowerCase()
                  .includes(
                    cleanedQuery
                  )
            );
        }
      );
    }, [
      sortedScans,
      searchQuery,
      riskFilter,
    ]);


  const riskCounts =
    useMemo(() => {
      return completedScans.reduce(
        (
          counts,
          scan
        ) => {
          if (
            scan.riskLevel ===
            "LOW"
          ) {
            counts.LOW +=
              1;
          } else if (
            scan.riskLevel ===
            "CAUTION"
          ) {
            counts.CAUTION +=
              1;
          } else if (
            scan.riskLevel ===
            "HIGH"
          ) {
            counts.HIGH +=
              1;
          } else {
            counts.UNKNOWN +=
              1;
          }


          return counts;
        },
        {
          LOW: 0,
          CAUTION: 0,
          HIGH: 0,
          UNKNOWN: 0,
        }
      );
    }, [
      completedScans,
    ]);


  return (
    <div className="scan-history-v2-page">

      <div className="scan-history-v2-header">

        <div>

          <div className="page-eyebrow">
            MONITORING HISTORY
          </div>

          <h1>
            Scan History
          </h1>

          <p>
            Review saved CitraGuard
            monitoring observations and
            open any record for complete
            deployment details.
          </p>

        </div>


        <div className="scan-history-v2-count">

          <strong>
            {completedScans.length}
          </strong>

          <span>
            completed scan
            {completedScans.length ===
            1
              ? ""
              : "s"}
          </span>

        </div>

      </div>


      {completedScans.length ===
      0 ? (

        <section className="scan-history-v2-empty">

          <div className="scan-history-v2-empty-icon">
            ○
          </div>

          <h2>
            No scans yet
          </h2>

          <p>
            Select a location on the
            monitoring map to begin your
            first CitraGuard observation.
          </p>

          <button
            type="button"
            className="scan-history-v2-primary"
            onClick={() =>
              navigate(
                "/"
              )
            }
          >
            Go to Map
          </button>

        </section>

      ) : (

        <>

          <section className="scan-history-v2-toolbar">

            <div className="scan-history-v2-search">

              <label
                htmlFor="scan-history-search"
              >
                Search history
              </label>

              <input
                id="scan-history-search"
                type="search"
                placeholder="Search scan ID or name"
                value={
                  searchQuery
                }
                onChange={(
                  event
                ) =>
                  setSearchQuery(
                    event.target
                      .value
                  )
                }
              />

            </div>


            <div className="scan-history-v2-filters">

              {[
                {
                  value:
                    "ALL",

                  label:
                    "All",

                  count:
                    completedScans.length,
                },

                {
                  value:
                    "LOW",

                  label:
                    "Low",

                  count:
                    riskCounts.LOW,
                },

                {
                  value:
                    "CAUTION",

                  label:
                    "Caution",

                  count:
                    riskCounts.CAUTION,
                },

                {
                  value:
                    "HIGH",

                  label:
                    "High",

                  count:
                    riskCounts.HIGH,
                },
              ].map(
                (filter) => (

                  <button
                    key={
                      filter.value
                    }
                    type="button"
                    className={
                      riskFilter ===
                      filter.value
                        ? "scan-history-v2-filter is-selected"
                        : "scan-history-v2-filter"
                    }
                    onClick={() =>
                      setRiskFilter(
                        filter.value
                      )
                    }
                  >
                    {filter.label}

                    <span>
                      {filter.count}
                    </span>
                  </button>

                )
              )}

            </div>

          </section>


          <div className="scan-history-v2-results-line">

            <span>
              {filteredScans.length}{" "}
              record
              {filteredScans.length ===
              1
                ? ""
                : "s"}
            </span>

            <span>
              Newest first
            </span>

          </div>


          {filteredScans.length ===
          0 ? (

            <section className="scan-history-v2-no-results">

              <strong>
                No matching scans
              </strong>

              <span>
                Change the search term
                or risk filter to see
                additional records.
              </span>

            </section>

          ) : (

            <div className="scan-history-v2-grid">

              {filteredScans.map(
                (scan) => {
                  const timestamp =
                    formatDate(
                      scan.endedAt ??
                        scan.createdAt ??
                        scan.startedAt
                    );


                  const actualDuration =
                    scan.actualDurationMinutes ??
                    scan.plannedDurationMinutes;


                  const weeklyRate =
                    getWeeklyRate(
                      scan
                    );


                  const storageLabel =
                    formatStorage(
                      scan.estimatedStorageMB
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


                  return (
                    <button
                      key={
                        scan.scanId
                      }
                      type="button"
                      className="scan-history-v2-card"
                      onClick={() =>
                        navigate(
                          `/scan-detail/${scan.scanId}`
                        )
                      }
                    >

                      <div className="scan-history-v2-card-top">

                        <div
                          className={`scan-history-v2-risk ${getRiskClass(
                            scan.riskLevel
                          )}`}
                        >
                          <span />

                          {scan.riskLevel ??
                            "UNCLASSIFIED"}
                        </div>


                        <div className="scan-history-v2-date">

                          <strong>
                            {timestamp.date}
                          </strong>

                          <span>
                            {timestamp.time}
                          </span>

                        </div>

                      </div>


                      <div className="scan-history-v2-name">

                        <span>
                          OBSERVATION
                        </span>

                        <strong>
                          {scan.scanName ??
                            "Unnamed observation"}
                        </strong>

                        <small>
                          {scan.scanId}
                        </small>

                      </div>


                      <div className="scan-history-v2-primary-metric">

                        <strong>
                          {count ??
                            "—"}
                        </strong>

                        <div>

                          <span>
                            ACP observation count
                          </span>

                          {Number.isFinite(
                            weeklyRate
                          ) ? (

                            <small>
                              {Number(
                                weeklyRate.toFixed(
                                  1
                                )
                              )}{" "}
                              ACP / trap-week
                            </small>

                          ) : (

                            <small>
                              Legacy record
                            </small>

                          )}

                        </div>

                      </div>


                      <div className="scan-history-v2-meta-grid">

                        <div>

                          <span>
                            Type
                          </span>

                          <strong>
                            {getMonitoringType(
                              scan
                            )}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Exposure
                          </span>

                          <strong>
                            {formatDuration(
                              actualDuration
                            )}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Capture
                          </span>

                          <strong>
                            {scan.captureWindow ===
                            "continuous"
                              ? "24-Hour"
                              : scan.captureWindow ===
                                "daylight"
                              ? "Daylight"
                              : "Legacy"}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Storage
                          </span>

                          <strong>
                            {storageLabel ??
                              "Not tracked"}
                          </strong>

                        </div>

                      </div>


                      <div className="scan-history-v2-location">

                        <span>
                          {finiteNumberOrNull(
                            scan.latitude
                          ) !== null
                            ? finiteNumberOrNull(
                                scan.latitude
                              ).toFixed(
                                4
                              )
                            : "—"}
                          ,{" "}
                          {finiteNumberOrNull(
                            scan.longitude
                          ) !== null
                            ? finiteNumberOrNull(
                                scan.longitude
                              ).toFixed(
                                4
                              )
                            : "—"}
                        </span>

                        <strong>
                          View record →
                        </strong>

                      </div>

                    </button>
                  );
                }
              )}

            </div>

          )}


          {riskCounts.UNKNOWN >
            0 && (

            <div className="scan-history-v2-legacy-note">

              <strong>
                Legacy records:
              </strong>{" "}

              {riskCounts.UNKNOWN} saved
              scan
              {riskCounts.UNKNOWN ===
              1
                ? ""
                : "s"}{" "}
              do not contain a current
              LOW, CAUTION, or HIGH
              classification and are shown
              only under All.

            </div>

          )}

        </>

      )}


      <div className="scan-history-v2-prototype-note">

        <strong>
          Prototype interpretation:
        </strong>{" "}

        LOW, CAUTION, and HIGH are
        CitraGuard monitoring
        classifications. They do not
        represent confirmed HLB infection,
        disease probability, or validated
        treatment thresholds. ACP/trap-week
        is an exposure-normalized prototype
        monitoring metric.

      </div>

    </div>
  );
}


export default ScansPage;
