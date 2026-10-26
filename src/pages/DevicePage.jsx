import {
  useMemo,
} from "react";

import {
  useScan,
} from "../context/ScanContext.jsx";


const STORAGE_CAPACITY_GB =
  128;

const STORAGE_CAPACITY_MB =
  STORAGE_CAPACITY_GB *
  1000;

const FALLBACK_MB_PER_IMAGE =
  2.0;

const BATTERY_TARGET_MAH =
  20000;


function DevicePage() {
  const {
    completedScans,
    currentScan,
  } = useScan();


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
          value <
            10
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
        value >=
          10000
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


  const latestScan =
    useMemo(() => {
      if (
        completedScans.length ===
        0
      ) {
        return null;
      }


      return [
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
      )[0];
    }, [
      completedScans,
    ]);


  const storageSummary =
    useMemo(() => {
      let usedMB =
        0;

      let directEstimateScans =
        0;

      let fallbackEstimateScans =
        0;

      let untrackedScans =
        0;


      completedScans.forEach(
        (scan) => {
          const directEstimate =
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


          if (
            directEstimate !==
            null &&
            directEstimate >=
            0
          ) {
            usedMB +=
              directEstimate;

            directEstimateScans +=
              1;

            return;
          }


          const captureCount =
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


          if (
            captureCount !==
            null &&
            captureCount >=
            0
          ) {
            usedMB +=
              captureCount *
              FALLBACK_MB_PER_IMAGE;

            fallbackEstimateScans +=
              1;

            return;
          }


          untrackedScans +=
            1;
        }
      );


      const safeUsedMB =
        Math.max(
          0,
          usedMB
        );


      const remainingMB =
        Math.max(
          0,
          STORAGE_CAPACITY_MB -
            safeUsedMB
        );


      const usedPercent =
        STORAGE_CAPACITY_MB >
        0
          ? Math.min(
              100,
              (
                safeUsedMB /
                STORAGE_CAPACITY_MB
              ) *
                100
            )
          : 0;


      return {
        usedMB:
          safeUsedMB,

        remainingMB,

        usedPercent,

        directEstimateScans,

        fallbackEstimateScans,

        untrackedScans,
      };
    }, [
      completedScans,
    ]);


  const projectedStorageMB =
    useMemo(() => {
      if (
        currentScan.scanId
      ) {
        return null;
      }


      if (
        currentScan.estimatedStorageMB !==
          null &&
        currentScan.estimatedStorageMB !==
          undefined &&
        Number.isFinite(
          Number(
            currentScan.estimatedStorageMB
          )
        )
      ) {
        return Number(
          currentScan.estimatedStorageMB
        );
      }


      if (
        currentScan.scheduledCaptureCount !==
          null &&
        currentScan.scheduledCaptureCount !==
          undefined &&
        Number.isFinite(
          Number(
            currentScan.scheduledCaptureCount
          )
        )
      ) {
        return (
          Number(
            currentScan.scheduledCaptureCount
          ) *
          FALLBACK_MB_PER_IMAGE
        );
      }


      return null;
    }, [
      currentScan,
    ]);


  const projectedPercent =
    projectedStorageMB !==
      null
      ? Math.min(
          100 -
            storageSummary.usedPercent,
          (
            projectedStorageMB /
            STORAGE_CAPACITY_MB
          ) *
            100
        )
      : 0;


  return (
    <div className="device-v3-page">

      <div className="device-v3-header">

        <div>

          <div className="page-eyebrow">
            SENTINEL HARDWARE
          </div>

          <h1>
            Device
          </h1>

          <p>
            Prototype hardware plan,
            storage forecasting, and
            calibration status for the
            proposed CitraGuard Sentinel.
          </p>

        </div>


        <div className="device-v3-mode-badge">

          <span />

          Prototype Mode

        </div>

      </div>


      <section className="device-v3-status-card">

        <div className="device-v3-status-heading">

          <div>

            <span>
              CONNECTION STATUS
            </span>

            <strong>
              Software Simulation
            </strong>

          </div>


          <div className="device-v3-status-pill">
            NOT CONNECTED
          </div>

        </div>


        <p>
          The physical CitraGuard
          Sentinel is not currently
          connected to this application.
          Scan observations, prepared
          sticky-card data, and prototype
          environmental readings remain
          simulated or preloaded unless
          explicitly identified otherwise.
        </p>

      </section>


      <div className="device-v3-primary-grid">

        <section className="device-v3-card">

          <div className="device-v3-card-heading">

            <div>

              <span>
                STORAGE
              </span>

              <h2>
                128 GB microSD Target
              </h2>

            </div>


            <div className="device-v3-status-tag device-v3-tag-check">
              VERIFY
            </div>

          </div>


          <div className="device-v3-storage-numbers">

            <div>

              <span>
                Estimated Used
              </span>

              <strong>
                {formatStorage(
                  storageSummary.usedMB
                )}
              </strong>

            </div>


            <div>

              <span>
                Estimated Available
              </span>

              <strong>
                {formatStorage(
                  storageSummary.remainingMB
                )}
              </strong>

            </div>


            <div>

              <span>
                Nominal Capacity
              </span>

              <strong>
                128 GB
              </strong>

            </div>

          </div>


          <div className="device-v3-storage-bar">

            <div
              className="device-v3-storage-used"
              style={{
                width:
                  `${storageSummary.usedPercent}%`,
              }}
            />

            {projectedStorageMB !==
              null && (
              <div
                className="device-v3-storage-projected"
                style={{
                  left:
                    `${storageSummary.usedPercent}%`,

                  width:
                    `${projectedPercent}%`,
                }}
              />
            )}

          </div>


          <div className="device-v3-storage-meta">

            <span>
              {storageSummary.usedPercent.toFixed(
                3
              )}% estimated utilization
            </span>

            {projectedStorageMB !==
              null && (
              <span>
                Current deployment: +
                {formatStorage(
                  projectedStorageMB
                )}
              </span>
            )}

          </div>


          <div className="device-v3-note">

            Storage is estimated from
            completed scan history. Newer
            records use their saved storage
            forecast; older compatible
            records fall back to 2.0 MB per
            scheduled JPEG image. Records
            without either value are not
            fabricated.

          </div>


          <div className="device-v3-mini-grid">

            <div>

              <span>
                Direct estimates
              </span>

              <strong>
                {storageSummary.directEstimateScans}
              </strong>

            </div>


            <div>

              <span>
                Fallback estimates
              </span>

              <strong>
                {storageSummary.fallbackEstimateScans}
              </strong>

            </div>


            <div>

              <span>
                Untracked legacy
              </span>

              <strong>
                {storageSummary.untrackedScans}
              </strong>

            </div>

          </div>


          <div className="device-v3-warning">

            The 128 GB card is the current
            CitraGuard storage target.
            Compatibility with the final
            Banana Pi M2 Zero hardware
            configuration still needs to be
            physically verified before it
            is treated as guaranteed device
            capacity.

          </div>

        </section>


        <section className="device-v3-card">

          <div className="device-v3-card-heading">

            <div>

              <span>
                POWER
              </span>

              <h2>
                20,000 mAh Battery Target
              </h2>

            </div>


            <div className="device-v3-status-tag device-v3-tag-pending">
              CALIBRATE
            </div>

          </div>


          <div className="device-v3-power-hero">

            <strong>
              {BATTERY_TARGET_MAH.toLocaleString()} mAh
            </strong>

            <span>
              5 V / 3 A output target
            </span>

          </div>


          <div className="device-v3-spec-list">

            <div>

              <span>
                Prototype candidate
              </span>

              <strong>
                INIU P512
              </strong>

            </div>


            <div>

              <span>
                Runtime forecast
              </span>

              <strong>
                Calibration pending
              </strong>

            </div>


            <div>

              <span>
                Live battery telemetry
              </span>

              <strong>
                Not connected
              </strong>

            </div>


            <div>

              <span>
                Power reserve
              </span>

              <strong>
                Not calculated
              </strong>

            </div>

          </div>


          <div className="device-v3-note">

            CitraGuard will not display a
            fabricated runtime or battery
            percentage. The power model will
            be enabled after measuring the
            assembled prototype with a USB
            power meter during idle, image
            capture, and processing.

          </div>


          <div className="device-v3-calibration-list">

            <div>
              <span>
                1
              </span>
              Measure board idle draw
            </div>

            <div>
              <span>
                2
              </span>
              Measure camera capture draw
            </div>

            <div>
              <span>
                3
              </span>
              Measure processing draw
            </div>

            <div>
              <span>
                4
              </span>
              Build deployment energy model
            </div>

          </div>

        </section>

      </div>


      <section className="device-v3-section">

        <div className="device-v3-section-heading">

          <div>

            <span>
              PROPOSED SENTINEL
            </span>

            <h2>
              Hardware Configuration
            </h2>

          </div>

        </div>


        <div className="device-v3-hardware-grid">

          <article className="device-v3-hardware-card">

            <span>
              COMPUTE
            </span>

            <strong>
              Banana Pi M2 Zero
            </strong>

            <p>
              Proposed edge-compute board
              for capture scheduling,
              local processing, storage,
              and future model inference.
            </p>

            <small>
              Planned hardware
            </small>

          </article>


          <article className="device-v3-hardware-card">

            <span>
              CAMERA
            </span>

            <strong>
              OV5640 · 5 MP
            </strong>

            <p>
              Proposed sticky-card imaging
              camera. Current software does
              not yet receive live frames
              from this module.
            </p>

            <small>
              Planned hardware
            </small>

          </article>


          <article className="device-v3-hardware-card">

            <span>
              ENVIRONMENT
            </span>

            <strong>
              SHT30
            </strong>

            <p>
              Proposed temperature and
              relative-humidity sensor for
              field-context logging.
            </p>

            <small>
              Planned hardware
            </small>

          </article>


          <article className="device-v3-hardware-card">

            <span>
              LIGHT
            </span>

            <strong>
              VEML7700
            </strong>

            <p>
              Proposed ambient-light sensor
              for recording illumination
              context during Sentinel
              operation.
            </p>

            <small>
              Planned hardware
            </small>

          </article>


          <article className="device-v3-hardware-card">

            <span>
              STORAGE
            </span>

            <strong>
              128 GB microSD
            </strong>

            <p>
              Current nominal application
              target for local images and
              monitoring records.
            </p>

            <small>
              Compatibility verification pending
            </small>

          </article>


          <article className="device-v3-hardware-card">

            <span>
              POWER
            </span>

            <strong>
              20,000 mAh USB Pack
            </strong>

            <p>
              Current prototype target with
              5 V / 3 A output headroom.
            </p>

            <small>
              Runtime calibration pending
            </small>

          </article>

        </div>

      </section>


      <div className="device-v3-secondary-grid">

        <section className="device-v3-card">

          <div className="device-v3-card-heading">

            <div>

              <span>
                APP ACTIVITY
              </span>

              <h2>
                Current Monitoring State
              </h2>

            </div>

          </div>


          <div className="device-v3-spec-list">

            <div>

              <span>
                Status
              </span>

              <strong>
                {currentScan.status ??
                  "idle"}
              </strong>

            </div>


            <div>

              <span>
                Monitoring mode
              </span>

              <strong>
                {currentScan.monitoringMode ===
                "extended"
                  ? "Extended Monitoring"
                  : currentScan.monitoringMode ===
                    "focused"
                  ? "Focused Survey"
                  : "Not configured"}
              </strong>

            </div>


            <div>

              <span>
                Scheduled captures
              </span>

              <strong>
                {currentScan.scheduledCaptureCount !==
                  null &&
                currentScan.scheduledCaptureCount !==
                  undefined
                  ? currentScan.scheduledCaptureCount
                  : "Not configured"}
              </strong>

            </div>


            <div>

              <span>
                Forecasted storage
              </span>

              <strong>
                {projectedStorageMB !==
                  null
                  ? formatStorage(
                      projectedStorageMB
                    )
                  : "Not configured"}
              </strong>

            </div>

          </div>

        </section>


        <section className="device-v3-card">

          <div className="device-v3-card-heading">

            <div>

              <span>
                LATEST RECORD
              </span>

              <h2>
                Latest Saved Observation
              </h2>

            </div>

          </div>


          {latestScan ? (

            <div className="device-v3-spec-list">

              <div>

                <span>
                  Observation
                </span>

                <strong>
                  {latestScan.scanName ??
                    "Unnamed observation"}
                </strong>

              </div>


              <div>

                <span>
                  ACP count
                </span>

                <strong>
                  {latestScan.psyllidCount ??
                    "—"}
                </strong>

              </div>


              <div>

                <span>
                  Classification
                </span>

                <strong>
                  {latestScan.riskLevel ??
                    "Unclassified"}
                </strong>

              </div>


              <div>

                <span>
                  Saved
                </span>

                <strong>
                  {formatDate(
                    latestScan.endedAt ??
                      latestScan.createdAt
                  )}
                </strong>

              </div>

            </div>

          ) : (

            <div className="device-v3-empty">
              No completed observation has
              been saved yet.
            </div>

          )}

        </section>

      </div>


      <section className="device-v3-section">

        <div className="device-v3-section-heading">

          <div>

            <span>
              FUTURE DEVICE FLOW
            </span>

            <h2>
              Sentinel → CitraGuard
            </h2>

          </div>

        </div>


        <div className="device-v3-flow">

          <div>

            <span>
              1
            </span>

            <strong>
              Monitor
            </strong>

            <small>
              Sticky card remains exposed
            </small>

          </div>


          <div className="device-v3-arrow">
            →
          </div>


          <div>

            <span>
              2
            </span>

            <strong>
              Capture
            </strong>

            <small>
              Camera + field sensors
            </small>

          </div>


          <div className="device-v3-arrow">
            →
          </div>


          <div>

            <span>
              3
            </span>

            <strong>
              Process
            </strong>

            <small>
              Future local vision inference
            </small>

          </div>


          <div className="device-v3-arrow">
            →
          </div>


          <div>

            <span>
              4
            </span>

            <strong>
              Store
            </strong>

            <small>
              Images + observation data
            </small>

          </div>


          <div className="device-v3-arrow">
            →
          </div>


          <div>

            <span>
              5
            </span>

            <strong>
              Visualize
            </strong>

            <small>
              Map, history, analytics
            </small>

          </div>

        </div>

      </section>


      <div className="device-v3-prototype-note">

        <strong>
          Prototype disclosure:
        </strong>{" "}

        This page describes the proposed
        Sentinel hardware architecture and
        estimates derived from application
        history. It does not represent live
        device telemetry. Battery runtime,
        power reserve, final microSD
        compatibility, environmental sensor
        readings, and computer-vision
        inference must be verified on the
        assembled physical prototype.

      </div>

    </div>
  );
}


export default DevicePage;
