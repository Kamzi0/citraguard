import {
  useMemo,
} from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useScan,
} from "../context/ScanContext.jsx";


const MINUTES_PER_WEEK =
  7 *
  24 *
  60;


const CHART_GREEN =
  "#1F6B45";


const CHART_GREEN_LIGHT =
  "#6F9D7F";


const CHART_GRID =
  "#D9E2DB";


const CHART_TEXT =
  "#627168";


const RISK_CHART_COLORS = {
  Low:
    "#5F936F",

  Caution:
    "#D7A53D",

  High:
    "#C86458",
};


const EVIDENCE_CHART_COLORS = {
  Preliminary:
    "#D3B15A",

  Limited:
    "#819B79",

  Standard:
    "#1F6B45",
};


const TOOLTIP_STYLE = {
  border:
    "1px solid #D9E2DB",

  borderRadius:
    "8px",

  background:
    "#FFFFFF",

  boxShadow:
    "0 8px 24px rgba(23, 59, 44, 0.08)",

  color:
    "#173B2C",

  fontSize:
    "11px",
};


function AnalyticsPage() {
  const {
    completedScans,
    monitoringAreas,
  } = useScan();


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
    ) &&
    duration > 0
      ? duration
      : null;
  }


  function getScanCount(
    scan
  ) {
    if (
      scan.psyllidCount ===
        null ||
      scan.psyllidCount ===
        undefined
    ) {
      return null;
    }


    const count =
      Number(
        scan.psyllidCount
      );


    return Number.isFinite(
      count
    ) &&
    count >= 0
      ? count
      : null;
  }


  function isProtocolV2Scan(
    scan
  ) {
    return (
      scan.protocolVersion ===
        2 ||
      scan.monitoringMode ===
        "focused" ||
      scan.monitoringMode ===
        "extended"
    );
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
      getScanCount(
        scan
      );


    if (
      !isProtocolV2Scan(
        scan
      ) ||
      duration === null ||
      count === null
    ) {
      return null;
    }


    return (
      count *
      MINUTES_PER_WEEK
    ) /
      duration;
  }


  function getAreaObservedRate(
    area
  ) {
    if (
      area.observedRatePerWeek !==
        null &&
      area.observedRatePerWeek !==
        undefined &&
      Number.isFinite(
        Number(
          area.observedRatePerWeek
        )
      )
    ) {
      return Number(
        area.observedRatePerWeek
      );
    }


    const totalCount =
      Number(
        area.totalPsyllidCount
      );


    const totalExposure =
      Number(
        area.totalExposureMinutes ??
        area.totalMonitoringMinutes
      );


    if (
      area.currentRiskMetric ===
        "LEGACY_COUNT" ||
      !Number.isFinite(
        totalCount
      ) ||
      totalCount < 0 ||
      !Number.isFinite(
        totalExposure
      ) ||
      totalExposure <= 0
    ) {
      return null;
    }


    return (
      totalCount *
      MINUTES_PER_WEEK
    ) /
      totalExposure;
  }


  function formatMonitoringTime(
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
      value < 0
    ) {
      return "Not available";
    }


    if (
      value < 60
    ) {
      return `${Number(
        value.toFixed(
          1
        )
      )} min`;
    }


    if (
      value < 1440
    ) {
      return `${Number(
        (
          value /
          60
        ).toFixed(
          1
        )
      )} hr`;
    }


    return `${Number(
      (
        value /
        1440
      ).toFixed(
        1
      )
    )} days`;
  }


  function formatRate(
    rate
  ) {
    if (
      rate === null ||
      rate === undefined ||
      !Number.isFinite(
        Number(
          rate
        )
      )
    ) {
      return "—";
    }


    return Number(
      Number(
        rate
      ).toFixed(
        1
      )
    );
  }


  function formatDate(
    value
  ) {
    if (!value) {
      return "Not recorded";
    }


    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not recorded";
    }


    return date.toLocaleDateString(
      undefined,
      {
        month:
          "short",

        day:
          "numeric",

        year:
          "numeric",
      }
    );
  }


  const analytics =
    useMemo(() => {
      const protocolV2Scans =
        completedScans.filter(
          (scan) =>
            isProtocolV2Scan(
              scan
            ) &&
            getScanDuration(
              scan
            ) !==
              null &&
            getScanCount(
              scan
            ) !==
              null
        );


      const legacyScans =
        completedScans.filter(
          (scan) =>
            !isProtocolV2Scan(
              scan
            )
        );


      const totalProtocolV2Detections =
        protocolV2Scans.reduce(
          (
            total,
            scan
          ) =>
            total +
            getScanCount(
              scan
            ),
          0
        );


      const totalProtocolV2ExposureMinutes =
        protocolV2Scans.reduce(
          (
            total,
            scan
          ) =>
            total +
            getScanDuration(
              scan
            ),
          0
        );


      const overallObservedRate =
        totalProtocolV2ExposureMinutes >
        0
          ? (
              totalProtocolV2Detections *
              MINUTES_PER_WEEK
            ) /
              totalProtocolV2ExposureMinutes
          : null;


      const validAllCounts =
        completedScans
          .map(
            getScanCount
          )
          .filter(
            (count) =>
              count !==
              null
          );


      const totalAllDetections =
        validAllCounts.reduce(
          (
            total,
            count
          ) =>
            total +
            count,
          0
        );


      const averageCount =
        validAllCounts.length >
        0
          ? totalAllDetections /
            validAllCounts.length
          : null;


      const sortedCounts =
        [
          ...validAllCounts,
        ].sort(
          (
            first,
            second
          ) =>
            first -
            second
        );


      let medianCount =
        null;


      if (
        sortedCounts.length >
        0
      ) {
        const middle =
          Math.floor(
            sortedCounts.length /
            2
          );


        medianCount =
          sortedCounts.length %
            2 ===
          0
            ? (
                sortedCounts[
                  middle -
                    1
                ] +
                sortedCounts[
                  middle
                ]
              ) /
                2
            : sortedCounts[
                middle
              ];
      }


      const repeatMonitoredAreas =
        monitoringAreas.filter(
          (area) =>
            Number(
              area.scanCount
            ) >
            1
        ).length;


      const evidenceCounts = {
        PRELIMINARY: 0,
        LIMITED: 0,
        STANDARD: 0,
        LEGACY: 0,
        UNKNOWN: 0,
      };


      monitoringAreas.forEach(
        (area) => {
          const evidence =
            area.riskEvidenceLevel;


          if (
            evidenceCounts[
              evidence
            ] !==
            undefined
          ) {
            evidenceCounts[
              evidence
            ] +=
              1;
          } else {
            evidenceCounts.UNKNOWN +=
              1;
          }
        }
      );


      const riskCounts = {
        LOW: 0,
        CAUTION: 0,
        HIGH: 0,
        UNCLASSIFIED: 0,
      };


      monitoringAreas.forEach(
        (area) => {
          const risk =
            area.currentRiskLevel;


          if (
            risk ===
              "LOW" ||
            risk ===
              "CAUTION" ||
            risk ===
              "HIGH"
          ) {
            riskCounts[
              risk
            ] +=
              1;
          } else {
            riskCounts.UNCLASSIFIED +=
              1;
          }
        }
      );


      const areaNameById =
        new Map(
          monitoringAreas.map(
            (area) => [
              area.areaId,
              area.areaName ??
                "Unnamed Area",
            ]
          )
        );


      const chronologicalProtocolScans =
        [
          ...protocolV2Scans,
        ].sort(
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
              firstTime -
              secondTime
            );
          }
        );


      const trendData =
        chronologicalProtocolScans
          .map(
            (
              scan,
              index
            ) => {
              const rate =
                getObservedRate(
                  scan
                );


              return {
                observation:
                  index +
                  1,

                dateLabel:
                  formatDate(
                    scan.endedAt ??
                      scan.createdAt ??
                      scan.startedAt
                  ),

                rate:
                  rate ===
                  null
                    ? null
                    : Number(
                        rate.toFixed(
                          1
                        )
                      ),

                count:
                  getScanCount(
                    scan
                  ),

                exposureMinutes:
                  getScanDuration(
                    scan
                  ),

                scanName:
                  scan.scanName ??
                  "Unnamed observation",

                areaName:
                  areaNameById.get(
                    scan.areaId
                  ) ??
                  "Unknown Area",

                evidence:
                  scan.riskEvidenceLevel ??
                  "Not recorded",
              };
            }
          )
          .filter(
            (item) =>
              Number.isFinite(
                item.rate
              )
          );


      const areaRateData =
        monitoringAreas
          .map(
            (area) => {
              const rate =
                getAreaObservedRate(
                  area
                );


              return {
                areaId:
                  area.areaId,

                areaName:
                  area.areaName ??
                  "Unnamed Area",

                rate:
                  rate ===
                  null
                    ? null
                    : Number(
                        rate.toFixed(
                          1
                        )
                      ),

                classificationRate:
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
                      ),

                observations:
                  Number(
                    area.scanCount
                  ) ||
                  0,

                exposureMinutes:
                  Number(
                    area.totalExposureMinutes ??
                      area.totalMonitoringMinutes
                  ) ||
                  0,

                evidence:
                  area.riskEvidenceLevel ??
                  "Not recorded",

                riskLevel:
                  area.currentRiskLevel ??
                  "UNCLASSIFIED",
              };
            }
          )
          .filter(
            (area) =>
              Number.isFinite(
                area.rate
              )
          )
          .sort(
            (
              first,
              second
            ) =>
              second.rate -
              first.rate
          );


      const highestObservedRateArea =
        areaRateData[0] ??
        null;


      const mostMonitoredArea =
        [
          ...monitoringAreas,
        ].sort(
          (
            first,
            second
          ) =>
            (
              Number(
                second.scanCount
              ) ||
              0
            ) -
            (
              Number(
                first.scanCount
              ) ||
              0
            )
        )[0] ??
        null;


      const recentScans =
        [
          ...completedScans,
        ]
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
          )
          .slice(
            0,
            8
          )
          .map(
            (scan) => ({
              ...scan,

              duration:
                getScanDuration(
                  scan
                ),

              count:
                getScanCount(
                  scan
                ),

              observedRate:
                getObservedRate(
                  scan
                ),

              areaName:
                areaNameById.get(
                  scan.areaId
                ) ??
                "Unknown Area",
            })
          );


      return {
        protocolV2Scans,
        legacyScans,

        totalAllDetections,
        totalProtocolV2Detections,
        totalProtocolV2ExposureMinutes,

        overallObservedRate,
        averageCount,
        medianCount,

        repeatMonitoredAreas,
        riskCounts,
        evidenceCounts,

        trendData,
        areaRateData,
        highestObservedRateArea,
        mostMonitoredArea,
        recentScans,
      };
    }, [
      completedScans,
      monitoringAreas,
    ]);


  const riskDistributionData = [
    {
      name:
        "Low",
      value:
        analytics.riskCounts.LOW,
    },
    {
      name:
        "Caution",
      value:
        analytics.riskCounts.CAUTION,
    },
    {
      name:
        "High",
      value:
        analytics.riskCounts.HIGH,
    },
  ];


  const evidenceData = [
    {
      name:
        "Preliminary",
      value:
        analytics.evidenceCounts.PRELIMINARY,
    },
    {
      name:
        "Limited",
      value:
        analytics.evidenceCounts.LIMITED,
    },
    {
      name:
        "Standard",
      value:
        analytics.evidenceCounts.STANDARD,
    },
  ];


  return (
    <div className="analytics-v2-page">

      <div className="analytics-v2-header">

        <div>

          <div className="page-eyebrow">
            SURVEILLANCE ANALYTICS
          </div>

          <h1>
            Monitoring Analytics
          </h1>

          <p>
            Observed patterns within the
            current CitraGuard dataset.
            These charts summarize
            monitoring records and do not
            establish biological causation
            or disease probability.
          </p>

        </div>

      </div>


      <div className="analytics-v2-summary-grid">

        <section className="analytics-v2-summary-card">

          <span>
            Completed Observations
          </span>

          <strong>
            {completedScans.length}
          </strong>

          <small>
            {analytics.protocolV2Scans.length}{" "}
            Protocol v2
          </small>

        </section>


        <section className="analytics-v2-summary-card">

          <span>
            Monitoring Areas
          </span>

          <strong>
            {monitoringAreas.length}
          </strong>

          <small>
            {analytics.repeatMonitoredAreas}{" "}
            repeat monitored
          </small>

        </section>


        <section className="analytics-v2-summary-card">

          <span>
            Total ACP Observed
          </span>

          <strong>
            {analytics.totalAllDetections}
          </strong>

          <small>
            Across saved records
          </small>

        </section>


        <section className="analytics-v2-summary-card">

          <span>
            Protocol v2 Exposure
          </span>

          <strong>
            {formatMonitoringTime(
              analytics
                .totalProtocolV2ExposureMinutes
            )}
          </strong>

          <small>
            Combined represented exposure
          </small>

        </section>


        <section className="analytics-v2-summary-card analytics-v2-summary-card-emphasis">

          <span>
            Overall Observed Rate
          </span>

          <strong>
            {formatRate(
              analytics.overallObservedRate
            )}
          </strong>

          <small>
            ACP / trap-week
          </small>

        </section>


        <section className="analytics-v2-summary-card">

          <span>
            Average ACP / Observation
          </span>

          <strong>
            {analytics.averageCount ===
              null
              ? "—"
              : Number(
                  analytics.averageCount.toFixed(
                    1
                  )
                )}
          </strong>

          <small>
            Raw count statistic
          </small>

        </section>


        <section className="analytics-v2-summary-card">

          <span>
            Median ACP / Observation
          </span>

          <strong>
            {analytics.medianCount ===
              null
              ? "—"
              : Number(
                  analytics.medianCount.toFixed(
                    1
                  )
                )}
          </strong>

          <small>
            Raw count statistic
          </small>

        </section>


        <section className="analytics-v2-summary-card">

          <span>
            Legacy Records
          </span>

          <strong>
            {analytics.legacyScans.length}
          </strong>

          <small>
            Excluded from weekly-rate
            aggregation
          </small>

        </section>

      </div>


      <div className="analytics-v2-insight-grid">

        <section className="analytics-v2-insight-card">

          <span>
            HIGHEST OBSERVED AREA RATE
          </span>

          <strong>
            {analytics.highestObservedRateArea
              ? analytics
                  .highestObservedRateArea
                  .areaName
              : "Not available"}
          </strong>

          <p>
            {analytics.highestObservedRateArea
              ? `${formatRate(
                  analytics
                    .highestObservedRateArea
                    .rate
                )} ACP / trap-week · ${
                  analytics
                    .highestObservedRateArea
                    .evidence
                } evidence`
              : "No Protocol v2 area rate is available yet."}
          </p>

        </section>


        <section className="analytics-v2-insight-card">

          <span>
            MOST MONITORED AREA
          </span>

          <strong>
            {analytics.mostMonitoredArea
              ? analytics
                  .mostMonitoredArea
                  .areaName
              : "Not available"}
          </strong>

          <p>
            {analytics.mostMonitoredArea
              ? `${Number(
                  analytics
                    .mostMonitoredArea
                    .scanCount
                ) || 0} saved observations`
              : "No monitoring areas are available yet."}
          </p>

        </section>

      </div>


      <section className="analytics-v2-card">

        <div className="analytics-v2-section-heading">

          <div>

            <span>
              OBSERVATION TREND
            </span>

            <h2>
              Observed ACP Rate Over Time
            </h2>

            <p>
              Each point represents one
              Protocol v2 observation using
              its raw exposure-normalized
              rate. Short observations may
              have high mathematical
              extrapolations and should be
              interpreted alongside evidence
              strength.
            </p>

          </div>

        </div>


        {analytics.trendData.length >
        0 ? (

          <div className="analytics-v2-chart analytics-v2-chart-large">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={
                  analytics.trendData
                }
                margin={{
                  top: 10,
                  right: 20,
                  left: 6,
                  bottom: 12,
                }}
              >

                <CartesianGrid
                  stroke={
                    CHART_GRID
                  }
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="observation"
                  axisLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tickLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tick={{
                    fill:
                      CHART_TEXT,
                    fontSize:
                      11,
                  }}
                  label={{
                    value:
                      "Observation sequence",
                    position:
                      "insideBottom",
                    offset:
                      -6,
                  }}
                />

                <YAxis
                  axisLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tickLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tick={{
                    fill:
                      CHART_TEXT,
                    fontSize:
                      11,
                  }}
                  label={{
                    value:
                      "ACP / trap-week",
                    angle:
                      -90,
                    position:
                      "insideLeft",
                  }}
                />

                <Tooltip
                  contentStyle={
                    TOOLTIP_STYLE
                  }
                  cursor={{
                    stroke:
                      CHART_GREEN_LIGHT,
                    strokeWidth:
                      1,
                    strokeDasharray:
                      "4 4",
                  }}
                  formatter={(
                    value
                  ) => [
                    `${value} ACP / trap-week`,
                    "Observed rate",
                  ]}
                  labelFormatter={(
                    observation
                  ) =>
                    `Observation ${observation}`
                  }
                />

                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Observed rate"
                  stroke={
                    CHART_GREEN
                  }
                  strokeWidth={2.5}
                  dot={{
                    r:
                      3.5,
                    fill:
                      "#FFFFFF",
                    stroke:
                      CHART_GREEN,
                    strokeWidth:
                      2,
                  }}
                  activeDot={{
                    r:
                      5,
                    fill:
                      CHART_GREEN,
                    stroke:
                      "#FFFFFF",
                    strokeWidth:
                      2,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        ) : (

          <div className="analytics-v2-empty-chart">
            Complete Protocol v2
            observations to build an
            exposure-normalized trend.
          </div>

        )}

      </section>


      <section className="analytics-v2-card">

        <div className="analytics-v2-section-heading">

          <div>

            <span>
              AREA COMPARISON
            </span>

            <h2>
              Observed ACP Rate by Monitoring Area
            </h2>

            <p>
              Bars use each area's raw
              observed ACP/trap-week rate,
              calculated from total ACP
              divided by total exposure.
              The heat-map color may use a
              separate stabilized
              classification rate when
              exposure is short.
            </p>

          </div>

        </div>


        {analytics.areaRateData.length >
        0 ? (

          <div
            className="analytics-v2-chart"
            style={{
              height:
                `${Math.max(
                  300,
                  analytics
                    .areaRateData
                    .length *
                    52
                )}px`,
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  analytics.areaRateData
                }
                layout="vertical"
                margin={{
                  top: 10,
                  right: 24,
                  left: 18,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  stroke={
                    CHART_GRID
                  }
                  strokeDasharray="3 3"
                />

                <XAxis
                  type="number"
                  axisLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tickLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tick={{
                    fill:
                      CHART_TEXT,
                    fontSize:
                      11,
                  }}
                  label={{
                    value:
                      "Observed ACP / trap-week",
                    position:
                      "insideBottom",
                    offset:
                      -5,
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="areaName"
                  width={145}
                  axisLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tickLine={false}
                  tick={{
                    fill:
                      CHART_TEXT,
                    fontSize:
                      11,
                  }}
                />

                <Tooltip
                  contentStyle={
                    TOOLTIP_STYLE
                  }
                  cursor={{
                    fill:
                      "rgba(31, 107, 69, 0.05)",
                  }}
                  formatter={(
                    value,
                    name
                  ) => [
                    name ===
                    "Observed Area Rate"
                      ? `${value} ACP / trap-week`
                      : value,
                    name,
                  ]}
                />

                <Bar
                  dataKey="rate"
                  name="Observed Area Rate"
                  fill={
                    CHART_GREEN
                  }
                  radius={[
                    0,
                    5,
                    5,
                    0,
                  ]}
                  maxBarSize={
                    34
                  }
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        ) : (

          <div className="analytics-v2-empty-chart">
            No Protocol v2 monitoring-area
            rate data is available yet.
          </div>

        )}

      </section>


      <div className="analytics-v2-two-column">

        <section className="analytics-v2-card">

          <div className="analytics-v2-section-heading">

            <div>

              <span>
                MAP CLASSIFICATIONS
              </span>

              <h2>
                Monitoring Areas by Risk Label
              </h2>

              <p>
                These are prototype
                surveillance labels, not
                disease states.
              </p>

            </div>

          </div>


          <div className="analytics-v2-chart analytics-v2-chart-small">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  riskDistributionData
                }
                margin={{
                  top: 10,
                  right: 12,
                  left: 0,
                  bottom: 4,
                }}
              >

                <CartesianGrid
                  stroke={
                    CHART_GRID
                  }
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                  axisLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tickLine={false}
                  tick={{
                    fill:
                      CHART_TEXT,
                    fontSize:
                      11,
                  }}
                />

                <YAxis
                  allowDecimals={
                    false
                  }
                  axisLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tickLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tick={{
                    fill:
                      CHART_TEXT,
                    fontSize:
                      11,
                  }}
                />

                <Tooltip
                  contentStyle={
                    TOOLTIP_STYLE
                  }
                  cursor={{
                    fill:
                      "rgba(31, 107, 69, 0.04)",
                  }}
                />

                <Bar
                  dataKey="value"
                  name="Areas"
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                  maxBarSize={
                    74
                  }
                >
                  {riskDistributionData.map(
                    (
                      entry
                    ) => (
                      <Cell
                        key={
                          entry.name
                        }
                        fill={
                          RISK_CHART_COLORS[
                            entry.name
                          ] ??
                          CHART_GREEN
                        }
                      />
                    )
                  )}
                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>


        <section className="analytics-v2-card">

          <div className="analytics-v2-section-heading">

            <div>

              <span>
                EVIDENCE CONTEXT
              </span>

              <h2>
                Areas by Evidence Level
              </h2>

              <p>
                Evidence labels reflect
                accumulated represented
                exposure, not model
                confidence.
              </p>

            </div>

          </div>


          <div className="analytics-v2-chart analytics-v2-chart-small">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  evidenceData
                }
                margin={{
                  top: 10,
                  right: 12,
                  left: 0,
                  bottom: 4,
                }}
              >

                <CartesianGrid
                  stroke={
                    CHART_GRID
                  }
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                  axisLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tickLine={false}
                  tick={{
                    fill:
                      CHART_TEXT,
                    fontSize:
                      11,
                  }}
                />

                <YAxis
                  allowDecimals={
                    false
                  }
                  axisLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tickLine={{
                    stroke:
                      CHART_GRID,
                  }}
                  tick={{
                    fill:
                      CHART_TEXT,
                    fontSize:
                      11,
                  }}
                />

                <Tooltip
                  contentStyle={
                    TOOLTIP_STYLE
                  }
                  cursor={{
                    fill:
                      "rgba(31, 107, 69, 0.04)",
                  }}
                />

                <Bar
                  dataKey="value"
                  name="Areas"
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                  maxBarSize={
                    74
                  }
                >
                  {evidenceData.map(
                    (
                      entry
                    ) => (
                      <Cell
                        key={
                          entry.name
                        }
                        fill={
                          EVIDENCE_CHART_COLORS[
                            entry.name
                          ] ??
                          CHART_GREEN
                        }
                      />
                    )
                  )}
                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>

      </div>


      <section className="analytics-v2-card">

        <div className="analytics-v2-section-heading">

          <div>

            <span>
              RECENT HISTORY
            </span>

            <h2>
              Recent Observations
            </h2>

          </div>

        </div>


        {analytics.recentScans.length >
        0 ? (

          <div className="analytics-v2-table-wrap">

            <table className="analytics-v2-table">

              <thead>

                <tr>

                  <th>
                    Observation
                  </th>

                  <th>
                    Area
                  </th>

                  <th>
                    ACP
                  </th>

                  <th>
                    Exposure
                  </th>

                  <th>
                    Observed Rate
                  </th>

                  <th>
                    Evidence
                  </th>

                  <th>
                    Date
                  </th>

                </tr>

              </thead>


              <tbody>

                {analytics.recentScans.map(
                  (scan) => (

                    <tr
                      key={
                        scan.scanId
                      }
                    >

                      <td>
                        {scan.scanName ??
                          "Unnamed observation"}
                      </td>

                      <td>
                        {scan.areaName}
                      </td>

                      <td>
                        {scan.count ??
                          "—"}
                      </td>

                      <td>
                        {scan.duration ===
                        null
                          ? "—"
                          : formatMonitoringTime(
                              scan.duration
                            )}
                      </td>

                      <td>
                        {scan.observedRate ===
                        null
                          ? "Legacy"
                          : `${formatRate(
                              scan.observedRate
                            )} ACP/wk`}
                      </td>

                      <td>
                        {scan.riskEvidenceLevel ??
                          (
                            isProtocolV2Scan(
                              scan
                            )
                              ? "Not recorded"
                              : "Legacy"
                          )}
                      </td>

                      <td>
                        {formatDate(
                          scan.endedAt ??
                            scan.createdAt ??
                            scan.startedAt
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        ) : (

          <div className="analytics-v2-empty-chart">
            No completed observations are
            available yet.
          </div>

        )}

      </section>


      <div className="analytics-v2-method-note">

        <strong>
          Analytics method:
        </strong>{" "}

        Protocol v2 weekly-rate statistics
        use total observed ACP divided by
        total represented exposure, then
        scaled to 10,080 minutes per week.
        Legacy records remain visible in
        history and raw-count summaries but
        are excluded from ACP/trap-week
        aggregation so incompatible units
        are not mixed. Environmental values
        in prototype scan records are
        simulated and are not used to claim
        causal relationships.

      </div>

    </div>
  );
}


export default AnalyticsPage;
