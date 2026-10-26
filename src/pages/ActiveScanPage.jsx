import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  useScan,
} from "../context/ScanContext.jsx";


function getDemoDurationMs(
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
    return 10000;
  }


  if (
    numericMinutes <= 30
  ) {
    return 7000;
  }


  if (
    numericMinutes <= 60
  ) {
    return 8000;
  }


  if (
    numericMinutes <= 120
  ) {
    return 10000;
  }


  if (
    numericMinutes <= 240
  ) {
    return 11000;
  }


  if (
    numericMinutes <= 720
  ) {
    return 12000;
  }


  if (
    numericMinutes <= 1440
  ) {
    return 13000;
  }


  if (
    numericMinutes <= 10080
  ) {
    return 15000;
  }


  if (
    numericMinutes <= 20160
  ) {
    return 16000;
  }


  return 18000;
}


const PROCESSING_STAGES = [
  {
    label:
      "Loading prototype observation",
    duration: 700,
  },

  {
    label:
      "Analyzing prepared observation",
    duration: 1000,
  },

  {
    label:
      "Processing environmental readings",
    duration: 800,
  },

  {
    label:
      "Calculating monitoring classification",
    duration: 800,
  },

  {
    label:
      "Saving observation",
    duration: 700,
  },
];


const ALL_STAGES = [
  "Initializing Sentinel",
  "Representing capture schedule",
  "Loading prototype observation",
  "Analyzing prepared observation",
  "Processing environmental readings",
  "Calculating monitoring classification",
  "Saving observation",
];


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
    return "Not available";
  }


  if (
    numericMinutes < 60
  ) {
    return `${Number(
      numericMinutes.toFixed(
        1
      )
    )} min`;
  }


  if (
    numericMinutes < 1440
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
        ? "hr"
        : "hrs"
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
    return "Not available";
  }


  if (
    numericMinutes < 60
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


function deriveCaptureCount(
  scan
) {
  const storedCount =
    Number(
      scan.scheduledCaptureCount
    );


  if (
    Number.isFinite(
      storedCount
    ) &&
    storedCount > 0
  ) {
    return Math.max(
      1,
      Math.round(
        storedCount
      )
    );
  }


  const duration =
    Number(
      scan.plannedDurationMinutes
    );


  const interval =
    Number(
      scan.captureIntervalMinutes
    );


  if (
    !Number.isFinite(
      duration
    ) ||
    duration <= 0 ||
    !Number.isFinite(
      interval
    ) ||
    interval <= 0
  ) {
    return 1;
  }


  let activeMinutes =
    duration;


  if (
    scan.captureWindow ===
    "daylight"
  ) {
    if (
      scan.monitoringMode ===
      "extended"
    ) {
      const days =
        duration /
        1440;


      activeMinutes =
        days *
        12 *
        60;
    } else {
      activeMinutes =
        Math.min(
          duration,
          12 *
            60
        );
    }
  }


  return Math.max(
    1,
    Math.floor(
      activeMinutes /
      interval
    ) +
      1
  );
}


function ActiveScanPage() {
  const navigate =
    useNavigate();


  const {
    currentScan,
    finishMonitoringNormally,
    endScanEarly,
    completeProcessing,
    cancelScan,
  } = useScan();


  const [
    monitoringProgress,
    setMonitoringProgress,
  ] = useState(
    0
  );


  const [
    processingStageIndex,
    setProcessingStageIndex,
  ] = useState(
    0
  );


  const [
    showCancelConfirm,
    setShowCancelConfirm,
  ] = useState(
    false
  );


  const monitoringFinishedRef =
    useRef(
      false
    );


  const processingFinishedRef =
    useRef(
      false
    );


  const demoDurationMs =
    getDemoDurationMs(
      currentScan
        .plannedDurationMinutes
    );


  const demoSeconds =
    Math.round(
      demoDurationMs /
      1000
    );


  const totalScheduledCaptures =
    useMemo(
      () =>
        deriveCaptureCount(
          currentScan
        ),
      [
        currentScan
          .scheduledCaptureCount,
        currentScan
          .plannedDurationMinutes,
        currentScan
          .captureIntervalMinutes,
        currentScan
          .captureWindow,
        currentScan
          .monitoringMode,
      ]
    );


  const representedMinutes =
    currentScan.status ===
    "active"
      ? Number(
          currentScan
            .plannedDurationMinutes
        ) *
        (
          monitoringProgress /
          100
        )
      : Number(
          currentScan
            .actualDurationMinutes
        );


  const representedCaptureNumber =
    useMemo(
      () => {
        if (
          totalScheduledCaptures <= 1
        ) {
          return 1;
        }


        const progressFraction =
          Math.max(
            0,
            Math.min(
              1,
              monitoringProgress /
                100
            )
          );


        return Math.min(
          totalScheduledCaptures,
          Math.floor(
            progressFraction *
            (
              totalScheduledCaptures -
              1
            )
          ) +
            1
        );
      },
      [
        monitoringProgress,
        totalScheduledCaptures,
      ]
    );


  const captureProgressPercent =
    currentScan.status ===
    "processing"
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            monitoringProgress
          )
        );


  useEffect(() => {
    if (
      currentScan.status !==
        "active" ||
      !currentScan.startedAt
    ) {
      return;
    }


    const timer =
      setInterval(
        () => {
          const startTime =
            new Date(
              currentScan.startedAt
            ).getTime();


          const elapsed =
            Date.now() -
            startTime;


          const progress =
            Math.min(
              (
                elapsed /
                demoDurationMs
              ) *
                100,
              100
            );


          setMonitoringProgress(
            progress
          );


          if (
            progress >= 100 &&
            !monitoringFinishedRef.current
          ) {
            monitoringFinishedRef.current =
              true;


            finishMonitoringNormally();
          }
        },
        100
      );


    return () => {
      clearInterval(
        timer
      );
    };
  }, [
    currentScan.status,
    currentScan.startedAt,
    currentScan.plannedDurationMinutes,
    demoDurationMs,
    finishMonitoringNormally,
  ]);


  useEffect(() => {
    if (
      currentScan.status !==
        "processing" ||
      !currentScan.monitoringEndedAt
    ) {
      return;
    }


    const totalProcessingTime =
      PROCESSING_STAGES.reduce(
        (
          total,
          stage
        ) =>
          total +
          stage.duration,
        0
      );


    const timer =
      setInterval(
        () => {
          const processingStart =
            new Date(
              currentScan
                .monitoringEndedAt
            ).getTime();


          const elapsed =
            Date.now() -
            processingStart;


          let accumulatedTime =
            0;


          let stageFound =
            false;


          for (
            let index = 0;
            index <
            PROCESSING_STAGES.length;
            index++
          ) {
            accumulatedTime +=
              PROCESSING_STAGES[
                index
              ].duration;


            if (
              elapsed <
              accumulatedTime
            ) {
              setProcessingStageIndex(
                index
              );


              stageFound =
                true;


              break;
            }
          }


          if (
            elapsed >=
              totalProcessingTime &&
            !processingFinishedRef.current
          ) {
            processingFinishedRef.current =
              true;


            completeProcessing();


            navigate(
              "/scan-result"
            );
          }


          if (!stageFound) {
            setProcessingStageIndex(
              PROCESSING_STAGES.length -
                1
            );
          }
        },
        100
      );


    return () => {
      clearInterval(
        timer
      );
    };
  }, [
    currentScan.status,
    currentScan.monitoringEndedAt,
    completeProcessing,
    navigate,
  ]);


  function handleEndScanEarly() {
    if (
      currentScan.status !==
      "active"
    ) {
      return;
    }


    const safeRepresentedMinutes =
      Math.max(
        1,
        Number(
          representedMinutes.toFixed(
            1
          )
        )
      );


    endScanEarly(
      safeRepresentedMinutes
    );
  }


  function handleCancelScan() {
    cancelScan();


    navigate(
      "/"
    );
  }


  function getCurrentStageIndex() {
    if (
      currentScan.status ===
      "processing"
    ) {
      return (
        2 +
        processingStageIndex
      );
    }


    if (
      currentScan.status ===
        "active" &&
      monitoringProgress <
        8
    ) {
      return 0;
    }


    return 1;
  }


  function getStageSymbol(
    index
  ) {
    const currentStageIndex =
      getCurrentStageIndex();


    if (
      index <
      currentStageIndex
    ) {
      return "✓";
    }


    if (
      index ===
      currentStageIndex
    ) {
      return "●";
    }


    return "";
  }


  function getStageClass(
    index
  ) {
    const currentStageIndex =
      getCurrentStageIndex();


    if (
      index <
      currentStageIndex
    ) {
      return "scan-stage is-complete";
    }


    if (
      index ===
      currentStageIndex
    ) {
      return "scan-stage is-current";
    }


    return "scan-stage";
  }


  const currentStageIndex =
    getCurrentStageIndex();


  const currentStageLabel =
    ALL_STAGES[
      currentStageIndex
    ] ??
    "Processing observation";


  if (
    !currentScan
      .plannedDurationMinutes
  ) {
    return (
      <div className="active-scan-page">

        <div className="active-scan-empty">

          <div className="page-eyebrow">
            SENTINEL MONITORING
          </div>

          <h1>
            No active scan
          </h1>

          <p>
            Configure a Sentinel
            monitoring session before
            opening this screen.
          </p>

          <Link
            to="/new-scan"
            className="active-scan-empty-button"
          >
            Configure New Scan
          </Link>

        </div>

      </div>
    );
  }


  return (
    <div className="active-scan-page">

      <div className="active-scan-header">

        <div>

          <div className="page-eyebrow">
            SENTINEL MONITORING
          </div>

          <h1 className="active-scan-title">
            {currentScan.status ===
            "processing"
              ? "Processing Observation"
              : "Monitoring in Progress"}
          </h1>

          <p className="active-scan-description">
            Demo Mode compresses the
            configured field deployment
            into a short sequence. Capture
            checkpoints represent the
            selected schedule; the prototype
            does not claim that the real
            monitoring time has elapsed.
          </p>

        </div>


        <div className="active-scan-status-badge">

          <span />

          {currentScan.status ===
          "processing"
            ? "Processing"
            : "Monitoring"}

        </div>

      </div>


      <div className="active-scan-layout">

        <main className="active-scan-main">

          <section className="active-monitor-card">

            <div
              className={
                currentScan.status ===
                "processing"
                  ? "active-monitor-visual is-processing"
                  : "active-monitor-visual"
              }
            >

              <div className="active-sentinel-radar">

                <div className="active-radar-ring ring-one" />
                <div className="active-radar-ring ring-two" />
                <div className="active-radar-ring ring-three" />


                <div className="active-sentinel-core">

                  <svg
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M24 7v7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    <rect
                      x="14"
                      y="14"
                      width="20"
                      height="14"
                      rx="3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />

                    <circle
                      cx="20"
                      cy="21"
                      r="3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />

                    <path
                      d="M24 28v12M18 40h12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>

                </div>

              </div>


              <div className="active-monitor-stage">

                <span>
                  CURRENT STAGE
                </span>

                <strong>
                  {currentStageLabel}
                </strong>

                <small>
                  {currentScan.status ===
                  "processing"
                    ? "Capture schedule represented. CitraGuard is finalizing the prototype observation."
                    : `Representing capture ${representedCaptureNumber} of ${totalScheduledCaptures}.`}
                </small>

              </div>

            </div>


            <div className="active-monitor-progress">

              <div className="active-progress-heading">

                <div>

                  <span>
                    {currentScan.status ===
                    "processing"
                      ? "MONITORING COMPLETE"
                      : "DEPLOYMENT PROGRESS"}
                  </span>

                  <strong>
                    {currentScan.status ===
                    "processing"
                      ? "100%"
                      : `${Math.round(
                          monitoringProgress
                        )}%`}
                  </strong>

                </div>


                <div className="active-progress-time">

                  <span>
                    Represented field time
                  </span>

                  <strong>
                    {formatDuration(
                      representedMinutes
                    )}
                  </strong>

                </div>

              </div>


              <div className="active-progress-track">

                <div
                  className="active-progress-fill"
                  style={{
                    width:
                      `${captureProgressPercent}%`,
                  }}
                />

              </div>


              <div className="active-progress-caption">

                <span>
                  Start
                </span>

                <span>
                  {formatDuration(
                    currentScan
                      .plannedDurationMinutes
                  )}
                </span>

              </div>

            </div>

          </section>


          <section className="active-capture-card">

            <div className="active-section-heading">

              <div>

                <div className="active-section-eyebrow">
                  CAPTURE SCHEDULE
                </div>

                <h2>
                  Scheduled Image Capture
                </h2>

                <p>
                  The physical Sentinel would
                  wake at each scheduled
                  checkpoint, photograph the
                  sticky card, process the
                  image, record metadata, and
                  return to low-power operation.
                </p>

              </div>

            </div>


            <div className="active-capture-summary">

              <div>
                <span>
                  CURRENT CHECKPOINT
                </span>

                <strong>
                  {currentScan.status ===
                  "processing"
                    ? totalScheduledCaptures
                    : representedCaptureNumber}
                  <small>
                    {" "}
                    / {totalScheduledCaptures}
                  </small>
                </strong>
              </div>


              <div>
                <span>
                  CAPTURE INTERVAL
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
                  CAPTURE WINDOW
                </span>

                <strong>
                  {currentScan.captureWindow ===
                  "continuous"
                    ? "24-hour"
                    : "Daylight only"}
                </strong>
              </div>

            </div>


            <div className="active-capture-track">

              <div
                className="active-capture-track-fill"
                style={{
                  width:
                    `${captureProgressPercent}%`,
                }}
              />

              <div className="active-capture-track-marker">
                <span>
                  {representedCaptureNumber}
                </span>
              </div>

            </div>


            <div className="active-capture-explanation">

              <strong>
                Scheduled capture protocol
              </strong>

              <span>
                Only the configured capture checkpoints are represented in this prototype. Adaptive verification is a future capability and is not active in the current workflow.
              </span>

            </div>


            <div className="active-capture-integrity">
              Demo Mode represents the timing
              and capture schedule only. It
              does not fabricate separate
              detections, confidence scores,
              or bounding boxes for each
              checkpoint. One prepared
              prototype observation is
              processed at completion.
            </div>

          </section>


          <section className="active-process-card">

            <div className="active-section-heading">

              <div>

                <div className="active-section-eyebrow">
                  WORKFLOW
                </div>

                <h2>
                  Monitoring Process
                </h2>

                <p>
                  CitraGuard advances through
                  each prototype stage
                  automatically.
                </p>

              </div>


              <div className="active-stage-counter">
                Stage{" "}
                {currentStageIndex +
                  1}{" "}
                of{" "}
                {ALL_STAGES.length}
              </div>

            </div>


            <div className="active-stage-list">

              {ALL_STAGES.map(
                (
                  stage,
                  index
                ) => (

                  <div
                    key={
                      stage
                    }
                    className={
                      getStageClass(
                        index
                      )
                    }
                  >

                    <div className="scan-stage-marker">

                      {getStageSymbol(
                        index
                      )}

                    </div>


                    <div className="scan-stage-content">

                      <strong>
                        {stage}
                      </strong>

                      <small>
                        {index === 0 &&
                          "Preparing the prototype Sentinel session."}

                        {index === 1 &&
                          "Representing scheduled image checkpoints across the selected field-monitoring duration."}

                        {index === 2 &&
                          "Loading one prepared sticky-card observation for the current prototype."}

                        {index === 3 &&
                          "Applying the prepared observation workflow. No AI confidence or boxes are fabricated."}

                        {index === 4 &&
                          "Generating simulated environmental readings for the saved observation."}

                        {index === 5 &&
                          "Applying the prototype exposure-aware monitoring classification."}

                        {index === 6 &&
                          "Writing the completed observation to CitraGuard storage."}
                      </small>

                    </div>

                  </div>

                )
              )}

            </div>

          </section>

        </main>


        <aside className="active-scan-sidebar">

          <section className="active-scan-info-card">

            <div className="active-sidebar-heading">

              <span>
                DEPLOYMENT
              </span>

              <strong>
                Monitoring Configuration
              </strong>

            </div>


            <div className="active-info-row">

              <span>
                Scan Name
              </span>

              <strong>
                {currentScan.scanName}
              </strong>

            </div>


            <div className="active-info-row">

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


            <div className="active-info-row">

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


            <div className="active-info-row">

              <span>
                Scheduled Captures
              </span>

              <strong>
                {totalScheduledCaptures}
              </strong>

            </div>


            <div className="active-info-row">

              <span>
                Interval
              </span>

              <strong>
                {formatInterval(
                  currentScan
                    .captureIntervalMinutes
                )}
              </strong>

            </div>


            <div className="active-info-row">

              <span>
                Window
              </span>

              <strong>
                {currentScan.captureWindow ===
                "continuous"
                  ? "Day + Night"
                  : "Daylight Only"}
              </strong>

            </div>


            <div className="active-info-row">

              <span>
                Demo Runtime
              </span>

              <strong>
                ~{demoSeconds} sec
              </strong>

            </div>


            <div className="active-info-row">

              <span>
                Latitude
              </span>

              <strong>
                {Number.isFinite(
                  Number(
                    currentScan.latitude
                  )
                )
                  ? Number(
                      currentScan.latitude
                    ).toFixed(
                      5
                    )
                  : "—"}
              </strong>

            </div>


            <div className="active-info-row">

              <span>
                Longitude
              </span>

              <strong>
                {Number.isFinite(
                  Number(
                    currentScan.longitude
                  )
                )
                  ? Number(
                      currentScan.longitude
                    ).toFixed(
                      5
                    )
                  : "—"}
              </strong>

            </div>

          </section>


          <section className="active-demo-card">

            <div className="active-demo-title">
              Demo Mode
            </div>

            <p>
              Physical image capture,
              Sentinel communication,
              environmental readings, and
              real elapsed deployment time
              are not being claimed here.
              This screen demonstrates how
              the configured monitoring
              schedule will operate.
            </p>

          </section>


          <section className="active-scan-controls">

            {currentScan.status ===
              "active" && (

              <button
                type="button"
                className="active-end-button"
                onClick={
                  handleEndScanEarly
                }
              >
                End Monitoring Early
              </button>

            )}


            <button
              type="button"
              className="active-cancel-button"
              onClick={() =>
                setShowCancelConfirm(
                  true
                )
              }
            >
              Cancel Monitoring
            </button>

          </section>

        </aside>

      </div>


      {currentScan.status ===
        "processing" && (

        <div className="active-processing-banner">

          <div className="active-processing-spinner" />

          <div>

            <strong>
              Capture schedule complete
            </strong>

            <span>
              {currentScan
                .completionType ===
              "ended-early"
                ? `Monitoring ended early after ${formatDuration(
                    currentScan
                      .actualDurationMinutes
                  )}. CitraGuard is processing the prototype observation.`
                : `${formatDuration(
                    currentScan
                      .actualDurationMinutes
                  )} represented monitoring period complete. CitraGuard is processing the prototype observation.`}
            </span>

          </div>

        </div>

      )}


      {showCancelConfirm && (

        <div className="active-cancel-overlay">

          <div className="active-cancel-dialog">

            <div className="active-cancel-dialog-icon">
              ×
            </div>

            <h2>
              Cancel this monitoring session?
            </h2>

            <p>
              Cancelling will discard the
              current in-progress
              observation. No completed
              monitoring record will be
              saved.
            </p>


            <div className="active-cancel-dialog-actions">

              <button
                type="button"
                className="active-continue-button"
                onClick={() =>
                  setShowCancelConfirm(
                    false
                  )
                }
              >
                Continue Monitoring
              </button>


              <button
                type="button"
                className="active-confirm-cancel-button"
                onClick={
                  handleCancelScan
                }
              >
                Confirm Cancel
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default ActiveScanPage;
