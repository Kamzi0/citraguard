import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  classifyPrototypeRisk,
  createPrototypeScanResult,
} from "../utils/scanEngine.js";

import {
  loadCitraGuardDataFromFirestore,
  syncCitraGuardDataToFirestore,
} from "../services/firestoreSync.js";


const ScanContext =
  createContext();


const STORAGE_KEY =
  "citraguard-persistent-data-v1";


function loadPersistentData() {
  const emptyData = {
    completedScans: [],
    monitoringAreas: [],
  };


  if (
    typeof window === "undefined"
  ) {
    return emptyData;
  }


  try {
    const savedData =
      window.localStorage.getItem(
        STORAGE_KEY
      );


    if (!savedData) {
      return emptyData;
    }


    const parsedData =
      JSON.parse(
        savedData
      );


    return {
      completedScans:
        Array.isArray(
          parsedData.completedScans
        )
          ? parsedData.completedScans
          : [],

      monitoringAreas:
        Array.isArray(
          parsedData.monitoringAreas
        )
          ? parsedData.monitoringAreas
          : [],
    };
  } catch (error) {
    console.error(
      "CitraGuard could not load saved data:",
      error
    );


    return emptyData;
  }
}


function savePersistentData(
  completedScans,
  monitoringAreas
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }


  try {
    const dataToSave = {
      version: 2,

      completedScans,

      monitoringAreas,

      savedAt:
        new Date().toISOString(),
    };


    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        dataToSave
      )
    );
  } catch (error) {
    console.error(
      "CitraGuard could not save data:",
      error
    );
  }
}


function removeCloudMetadata(
  record
) {
  const cleanRecord = {
    ...record,
  };


  delete cleanRecord.cloudUpdatedAt;


  return cleanRecord;
}


function getRecordTime(
  record,
  dateFields
) {
  for (
    const field of dateFields
  ) {
    const value =
      record?.[field];


    if (!value) {
      continue;
    }


    const time =
      new Date(
        value
      ).getTime();


    if (
      Number.isFinite(
        time
      )
    ) {
      return time;
    }
  }


  return 0;
}


function mergeRecords(
  localRecords,
  cloudRecords,
  idField,
  dateFields
) {
  const recordsById =
    new Map();


  cloudRecords.forEach(
    (record) => {
      const cleanRecord =
        removeCloudMetadata(
          record
        );


      const recordId =
        cleanRecord?.[idField];


      if (!recordId) {
        return;
      }


      recordsById.set(
        recordId,
        cleanRecord
      );
    }
  );


  localRecords.forEach(
    (record) => {
      const cleanRecord =
        removeCloudMetadata(
          record
        );


      const recordId =
        cleanRecord?.[idField];


      if (!recordId) {
        return;
      }


      /*
        Local records are applied second.

        This means:
        - cloud-only records are restored
        - local-only records are preserved
        - an existing local copy is never
          destroyed merely because a cloud
          request returned an older copy
      */

      recordsById.set(
        recordId,
        cleanRecord
      );
    }
  );


  return Array.from(
    recordsById.values()
  ).sort(
    (
      firstRecord,
      secondRecord
    ) =>
      getRecordTime(
        secondRecord,
        dateFields
      ) -
      getRecordTime(
        firstRecord,
        dateFields
      )
  );
}


const createEmptyScan = () => ({
  scanId: null,

  areaId: null,

  scanName: null,
  isCustomName: false,

  /*
    Monitoring protocol v2

    "focused" = 30 minutes to 12 hours
    "extended" = 1 to 28 days

    plannedDurationMinutes remains the common
    duration field so older parts of CitraGuard
    can continue working while the new protocol
    UI is introduced.
  */
  protocolVersion: 2,
  monitoringMode: "focused",

  plannedDurationMinutes: null,
  actualDurationMinutes: null,

  captureIntervalMinutes: 20,
  captureWindow: "daylight",
  adaptiveVerification: false,

  scheduledCaptureCount: null,

  estimatedStorageMB: null,
  estimatedPowerUsePercent: null,

  trapServiceIntervalDays: null,

  latitude: null,
  longitude: null,

  status: "idle",

  startedAt: null,
  monitoringEndedAt: null,
  endedAt: null,
  createdAt: null,

  completionType: null,

  isAreaUpdate: false,
  updatesAreaId: null,
  updatesScanId: null,

  observationId: null,

  psyllidCount: null,

  /*
    Protocol v2 risk/capture fields.

    referencePsyllidCount is the prepared
    prototype profile that seeds the
    duration-aware simulation.

    captureRatePerWeek is the observed
    normalized rate used by the v2 map
    risk model.
  */
  referencePsyllidCount: null,
  preparedObservationCount: null,
  simulatedFieldCount: null,
  simulatedWeeklyIntensity: null,
  captureRatePerWeek: null,
  classificationRatePerWeek: null,
  riskEvidenceLevel: null,
  riskMetric: null,

  detectionMethod: null,
  confidence: null,

  temperature: null,
  humidity: null,
  light: null,
  windSpeed: null,
  windDirection: null,

  riskScore: null,
  riskLevel: null,
});


function normalizeStoredScan(
  scan
) {
  if (!scan) {
    return scan;
  }


  const hasProtocolV2 =
    scan.protocolVersion === 2 ||
    scan.monitoringMode === "focused" ||
    scan.monitoringMode === "extended";


  return {
    ...scan,

    protocolVersion:
      hasProtocolV2
        ? 2
        : 1,

    monitoringMode:
      hasProtocolV2
        ? (
            scan.monitoringMode ??
            "focused"
          )
        : "legacy",

    captureIntervalMinutes:
      scan.captureIntervalMinutes ??
      null,

    captureWindow:
      scan.captureWindow ??
      (
        hasProtocolV2
          ? "daylight"
          : null
      ),

    adaptiveVerification:
      scan.adaptiveVerification ??
      (
        hasProtocolV2
          ? false
          : null
      ),

    scheduledCaptureCount:
      scan.scheduledCaptureCount ??
      null,

    estimatedStorageMB:
      scan.estimatedStorageMB ??
      null,

    estimatedPowerUsePercent:
      scan.estimatedPowerUsePercent ??
      null,

    trapServiceIntervalDays:
      scan.trapServiceIntervalDays ??
      null,

    referencePsyllidCount:
      scan.referencePsyllidCount ??
      null,

    preparedObservationCount:
      scan.preparedObservationCount ??
      scan.referencePsyllidCount ??
      null,

    simulatedFieldCount:
      scan.simulatedFieldCount ??
      scan.psyllidCount ??
      null,

    simulatedWeeklyIntensity:
      scan.simulatedWeeklyIntensity ??
      null,

    captureRatePerWeek:
      scan.captureRatePerWeek ??
      null,

    classificationRatePerWeek:
      scan.classificationRatePerWeek ??
      null,

    riskEvidenceLevel:
      scan.riskEvidenceLevel ??
      null,

    riskMetric:
      scan.riskMetric ??
      (
        hasProtocolV2
          ? "ACP_PER_TRAP_WEEK"
          : "LEGACY_COUNT"
      ),
  };
}


function createDefaultScanName(
  latitude,
  longitude
) {
  return `Scan ${latitude.toFixed(
    4
  )}, ${longitude.toFixed(4)}`;
}


const MINUTES_PER_WEEK =
  7 *
  24 *
  60;


/*
  Prototype heat-map stabilization.

  CitraGuard always preserves the raw
  exposure-normalized ACP/trap-week rate.

  For LOW / CAUTION / HIGH classification,
  exposures shorter than 24 hours use a
  24-hour minimum denominator. This reduces
  extreme color swings from very short
  observations while keeping the raw rate
  visible for transparency.

  This is a prototype engineering rule,
  not a validated biological threshold.
*/
const MIN_CLASSIFICATION_EXPOSURE_MINUTES =
  24 *
  60;


function getRiskEvidenceLevel(
  exposureMinutes
) {
  const exposure =
    Number(
      exposureMinutes
    );


  if (
    !Number.isFinite(
      exposure
    ) ||
    exposure <= 0
  ) {
    return null;
  }


  if (
    exposure <
    24 *
      60
  ) {
    return "PRELIMINARY";
  }


  if (
    exposure <
    3 *
      24 *
      60
  ) {
    return "LIMITED";
  }


  return "STANDARD";
}


/*
  Prototype weekly-intensity profiles.

  These are simulation profiles, not
  validated intervention thresholds.

  They are intentionally expressed as
  ACP per trap-week because published
  ACP sticky-trap studies commonly report
  captures on a weekly basis.
*/
function getPrototypeWeeklyIntensity(
  referenceCount
) {
  const count =
    Number(
      referenceCount
    );


  if (
    !Number.isFinite(
      count
    ) ||
    count <= 0
  ) {
    return 0;
  }


  if (count <= 1) {
    return 1;
  }


  if (count <= 3) {
    return 3;
  }


  if (count <= 6) {
    return 7;
  }


  if (count <= 11) {
    return 15;
  }


  return 40;
}


function getScanDurationMinutes(
  scan
) {
  const duration =
    Number(
      scan?.actualDurationMinutes ??
      scan?.plannedDurationMinutes
    );


  return Number.isFinite(
    duration
  )
    ? duration
    : null;
}


function calculateCaptureRatePerWeek(
  psyllidCount,
  durationMinutes
) {
  const count =
    Number(
      psyllidCount
    );


  const duration =
    Number(
      durationMinutes
    );


  if (
    !Number.isFinite(
      count
    ) ||
    count < 0 ||
    !Number.isFinite(
      duration
    ) ||
    duration <= 0
  ) {
    return null;
  }


  return (
    count *
    (
      MINUTES_PER_WEEK /
      duration
    )
  );
}


function calculateClassificationRatePerWeek(
  psyllidCount,
  exposureMinutes
) {
  const count =
    Number(
      psyllidCount
    );


  const exposure =
    Number(
      exposureMinutes
    );


  if (
    !Number.isFinite(
      count
    ) ||
    count < 0 ||
    !Number.isFinite(
      exposure
    ) ||
    exposure <= 0
  ) {
    return null;
  }


  const effectiveExposureMinutes =
    Math.max(
      exposure,
      MIN_CLASSIFICATION_EXPOSURE_MINUTES
    );


  return calculateCaptureRatePerWeek(
    count,
    effectiveExposureMinutes
  );
}


/*
  Trap-capture data are count data.
  A Poisson draw gives the demo realistic
  variation while making longer deployments
  accumulate more insects on average.

  The camera capture interval does NOT
  change this value. The sticky card remains
  exposed between photographs.
*/
function samplePoisson(
  expectedCount
) {
  const lambda =
    Math.max(
      0,
      Number(
        expectedCount
      ) ||
      0
    );


  if (lambda === 0) {
    return 0;
  }


  /*
    Knuth's method is simple and stable
    for the modest expected counts used
    by the CitraGuard prototype.
  */
  const limit =
    Math.exp(
      -lambda
    );


  let product =
    1;


  let count =
    0;


  do {
    count +=
      1;


    product *=
      Math.random();
  } while (
    product >
    limit
  );


  return (
    count -
    1
  );
}


function createDurationAwarePrototypeDetection(
  prototypeResult,
  scan
) {
  const isProtocolV2 =
    scan?.protocolVersion === 2 ||
    scan?.monitoringMode ===
      "focused" ||
    scan?.monitoringMode ===
      "extended";


  if (!isProtocolV2) {
    return prototypeResult;
  }


  const durationMinutes =
    getScanDurationMinutes(
      scan
    );


  const referenceCount =
    Number(
      prototypeResult?.psyllidCount
    );


  if (
    !Number.isFinite(
      durationMinutes
    ) ||
    durationMinutes <= 0 ||
    !Number.isFinite(
      referenceCount
    )
  ) {
    return prototypeResult;
  }


  const weeklyIntensity =
    getPrototypeWeeklyIntensity(
      referenceCount
    );


  const expectedCount =
    weeklyIntensity *
    (
      durationMinutes /
      MINUTES_PER_WEEK
    );


  const simulatedCount =
    samplePoisson(
      expectedCount
    );


  /*
    Raw exposure-normalized rate.
    This is retained for transparency.
  */
  const captureRatePerWeek =
    calculateCaptureRatePerWeek(
      simulatedCount,
      durationMinutes
    );


  /*
    Stabilized rate used only for the
    prototype LOW / CAUTION / HIGH
    classification.
  */
  const classificationRatePerWeek =
    calculateClassificationRatePerWeek(
      simulatedCount,
      durationMinutes
    );


  const riskEvidenceLevel =
    getRiskEvidenceLevel(
      durationMinutes
    );


  return {
    ...prototypeResult,

    psyllidCount:
      simulatedCount,

    referencePsyllidCount:
      referenceCount,

    preparedObservationCount:
      referenceCount,

    simulatedFieldCount:
      simulatedCount,

    simulatedWeeklyIntensity:
      weeklyIntensity,

    captureRatePerWeek:
      captureRatePerWeek ===
      null
        ? null
        : Number(
            captureRatePerWeek.toFixed(
              1
            )
          ),

    classificationRatePerWeek:
      classificationRatePerWeek ===
      null
        ? null
        : Number(
            classificationRatePerWeek.toFixed(
              1
            )
          ),

    riskEvidenceLevel,

    riskMetric:
      "ACP_PER_TRAP_WEEK",

    /*
      This remains explicitly a prototype
      simulation until the real vision model
      is connected.
    */
    detectionMethod:
      "Duration-aware prototype simulation",

    confidence:
      null,

    riskScore:
      null,

    riskLevel:
      classificationRatePerWeek ===
      null
        ? null
        : classifyPrototypeRisk(
            classificationRatePerWeek
          ),
  };
}

function calculatePrototypeAreaResult(
  scans
) {
  const validScans =
    scans.filter(
      (scan) => {
        const durationMinutes =
          getScanDurationMinutes(
            scan
          );


        return (
          Number.isFinite(
            Number(
              scan.psyllidCount
            )
          ) &&
          Number(
            scan.psyllidCount
          ) >= 0 &&
          Number.isFinite(
            durationMinutes
          ) &&
          durationMinutes >
            0
        );
      }
    );


  if (
    validScans.length === 0
  ) {
    return {
      currentRiskValue: null,
      currentRiskLevel: null,
      currentRiskMetric: null,
      observedRatePerWeek: null,
      classificationRatePerWeek: null,
      totalPsyllidCount: 0,
      totalMonitoringMinutes: 0,
      totalExposureMinutes: 0,
      riskEvidenceLevel: null,
    };
  }


  /*
    Once an area has protocol-v2 scans,
    only v2 scans contribute to the new
    exposure-normalized metric.

    Legacy scans stay in history but are
    not mixed into a different unit.
  */
  const protocolV2Scans =
    validScans.filter(
      (scan) =>
        scan.protocolVersion ===
          2 ||
        scan.monitoringMode ===
          "focused" ||
        scan.monitoringMode ===
          "extended"
    );


  if (
    protocolV2Scans.length >
    0
  ) {
    /*
      Area aggregation is weighted by
      actual represented exposure:

      total ACP / total minutes × 10,080

      Individual scan colors are not averaged.
    */
    const totalPsyllidCount =
      protocolV2Scans.reduce(
        (
          total,
          scan
        ) =>
          total +
          Number(
            scan.psyllidCount
          ),
        0
      );


    const totalExposureMinutes =
      protocolV2Scans.reduce(
        (
          total,
          scan
        ) =>
          total +
          getScanDurationMinutes(
            scan
          ),
        0
      );


    const observedRatePerWeek =
      calculateCaptureRatePerWeek(
        totalPsyllidCount,
        totalExposureMinutes
      );


    const classificationRatePerWeek =
      calculateClassificationRatePerWeek(
        totalPsyllidCount,
        totalExposureMinutes
      );


    const normalizedObservedRate =
      observedRatePerWeek ===
      null
        ? null
        : Number(
            observedRatePerWeek.toFixed(
              1
            )
          );


    const normalizedClassificationRate =
      classificationRatePerWeek ===
      null
        ? null
        : Number(
            classificationRatePerWeek.toFixed(
              1
            )
          );


    const riskEvidenceLevel =
      getRiskEvidenceLevel(
        totalExposureMinutes
      );


    return {
      /*
        currentRiskValue remains the number
        consumed by the existing map color
        system, so it uses the stabilized
        classification rate.
      */
      currentRiskValue:
        normalizedClassificationRate,

      currentRiskLevel:
        normalizedClassificationRate ===
        null
          ? null
          : classifyPrototypeRisk(
              normalizedClassificationRate
            ),

      currentRiskMetric:
        "STABILIZED_ACP_PER_TRAP_WEEK",

      observedRatePerWeek:
        normalizedObservedRate,

      classificationRatePerWeek:
        normalizedClassificationRate,

      totalPsyllidCount,

      totalMonitoringMinutes:
        totalExposureMinutes,

      totalExposureMinutes,

      riskEvidenceLevel,
    };
  }


  /*
    Legacy observations retain their old
    prototype behavior and are not mixed
    into Protocol v2 rates.
  */
  const totalPsyllidCount =
    validScans.reduce(
      (
        total,
        scan
      ) =>
        total +
        Number(
          scan.psyllidCount
        ),
      0
    );


  const totalMonitoringMinutes =
    validScans.reduce(
      (
        total,
        scan
      ) =>
        total +
        getScanDurationMinutes(
          scan
        ),
      0
    );


  const averageCount =
    totalPsyllidCount /
    validScans.length;


  const currentRiskValue =
    Number(
      averageCount.toFixed(
        1
      )
    );


  return {
    currentRiskValue,

    currentRiskLevel:
      classifyPrototypeRisk(
        currentRiskValue
      ),

    currentRiskMetric:
      "LEGACY_COUNT",

    observedRatePerWeek:
      null,

    classificationRatePerWeek:
      null,

    totalPsyllidCount,

    totalMonitoringMinutes,

    totalExposureMinutes:
      totalMonitoringMinutes,

    riskEvidenceLevel:
      "LEGACY",
  };
}

function createMonitoringArea(
  completedScan,
  areaResult
) {
  return {
    areaId:
      completedScan.areaId,

    areaName:
      completedScan.scanName,

    centerLatitude:
      completedScan.latitude,

    centerLongitude:
      completedScan.longitude,

    radiusMeters: 15,

    scanIds: [
      completedScan.scanId,
    ],

    scanCount: 1,

    latestScanId:
      completedScan.scanId,

    currentRiskLevel:
      areaResult.currentRiskLevel,

    currentRiskValue:
      areaResult.currentRiskValue,

    currentRiskMetric:
      areaResult.currentRiskMetric,

    observedRatePerWeek:
      areaResult.observedRatePerWeek,

    classificationRatePerWeek:
      areaResult.classificationRatePerWeek,

    riskEvidenceLevel:
      areaResult.riskEvidenceLevel,

    totalPsyllidCount:
      areaResult.totalPsyllidCount,

    totalMonitoringMinutes:
      areaResult.totalMonitoringMinutes,

    totalExposureMinutes:
      areaResult.totalExposureMinutes,

    createdAt:
      completedScan.createdAt,

    lastUpdated:
      completedScan.endedAt,
  };
}


function calculateDistanceMeters(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const earthRadiusMeters =
    6371000;


  const toRadians =
    (degrees) =>
      degrees *
      (
        Math.PI /
        180
      );


  const latitudeDifference =
    toRadians(
      latitude2 -
      latitude1
    );


  const longitudeDifference =
    toRadians(
      longitude2 -
      longitude1
    );


  const firstLatitude =
    toRadians(
      latitude1
    );


  const secondLatitude =
    toRadians(
      latitude2
    );


  const haversineValue =
    Math.sin(
      latitudeDifference /
      2
    ) ** 2 +
    Math.cos(
      firstLatitude
    ) *
      Math.cos(
        secondLatitude
      ) *
      Math.sin(
        longitudeDifference /
        2
      ) ** 2;


  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(
        haversineValue
      ),
      Math.sqrt(
        1 -
        haversineValue
      )
    );


  return (
    earthRadiusMeters *
    angularDistance
  );
}


export function ScanProvider({
  children,
}) {
  const [
    persistentData,
  ] = useState(
    () =>
      loadPersistentData()
  );


  const [
    currentScan,
    setCurrentScan,
  ] = useState(
    createEmptyScan()
  );


  const [
    completedScans,
    setCompletedScans,
  ] = useState(
    () =>
      persistentData.completedScans.map(
        normalizeStoredScan
      )
  );


  const [
    monitoringAreas,
    setMonitoringAreas,
  ] = useState(
    persistentData.monitoringAreas
  );


  const [
    cloudHydrationComplete,
    setCloudHydrationComplete,
  ] = useState(
    false
  );


  const cloudHydrationStarted =
    useRef(
      false
    );


  const lastCloudSyncSignature =
    useRef(
      null
    );


  /*
    CLOUD HYDRATION

    On startup:

    1. Local data is available immediately.
    2. Firestore is contacted.
    3. Cloud records are merged with local records.
    4. Local-only records are preserved.
    5. Cloud-only records are restored.
    6. Only after this process may automatic
       cloud synchronization begin.
  */

  useEffect(() => {
    if (
      cloudHydrationStarted.current
    ) {
      return;
    }


    cloudHydrationStarted.current =
      true;


    async function hydrateFromCloud() {
      try {
        const cloudData =
          await loadCitraGuardDataFromFirestore();


        setCompletedScans(
          (
            currentLocalScans
          ) =>
            mergeRecords(
              currentLocalScans,
              cloudData.completedScans,
              "scanId",
              [
                "endedAt",
                "createdAt",
                "startedAt",
              ]
            ).map(
              normalizeStoredScan
            )
        );


        setMonitoringAreas(
          (
            currentLocalAreas
          ) =>
            mergeRecords(
              currentLocalAreas,
              cloudData.monitoringAreas,
              "areaId",
              [
                "lastUpdated",
                "createdAt",
              ]
            )
        );


        console.log(
          `CitraGuard cloud load complete: ${cloudData.completedScans.length} scans and ${cloudData.monitoringAreas.length} monitoring areas found.`
        );
      } catch (error) {
        console.error(
          "CitraGuard could not load cloud data. Local storage will remain available:",
          error
        );
      } finally {
        setCloudHydrationComplete(
          true
        );
      }
    }


    hydrateFromCloud();
  }, []);


  /*
    KEEP AREA RISK IN SYNC WITH SCAN HISTORY

    This also migrates existing monitoring areas
    away from the old 30-minute normalization
    without deleting any stored scan records.
  */
  useEffect(() => {
    if (
      completedScans.length === 0
    ) {
      return;
    }


    setMonitoringAreas(
      (
        previousAreas
      ) => {
        let changed =
          false;


        const nextAreas =
          previousAreas.map(
            (area) => {
              const areaScans =
                completedScans.filter(
                  (scan) =>
                    scan.areaId ===
                    area.areaId
                );


              if (
                areaScans.length ===
                0
              ) {
                return area;
              }


              const areaResult =
                calculatePrototypeAreaResult(
                  areaScans
                );


              const nextArea = {
                ...area,

                currentRiskLevel:
                  areaResult
                    .currentRiskLevel,

                currentRiskValue:
                  areaResult
                    .currentRiskValue,

                currentRiskMetric:
                  areaResult
                    .currentRiskMetric,

                observedRatePerWeek:
                  areaResult
                    .observedRatePerWeek,

                classificationRatePerWeek:
                  areaResult
                    .classificationRatePerWeek,

                riskEvidenceLevel:
                  areaResult
                    .riskEvidenceLevel,

                totalPsyllidCount:
                  areaResult
                    .totalPsyllidCount,

                totalMonitoringMinutes:
                  areaResult
                    .totalMonitoringMinutes,

                totalExposureMinutes:
                  areaResult
                    .totalExposureMinutes,
              };


              const areaChanged =
                area.currentRiskLevel !==
                  nextArea.currentRiskLevel ||
                area.currentRiskValue !==
                  nextArea.currentRiskValue ||
                area.currentRiskMetric !==
                  nextArea.currentRiskMetric ||
                area.observedRatePerWeek !==
                  nextArea.observedRatePerWeek ||
                area.classificationRatePerWeek !==
                  nextArea.classificationRatePerWeek ||
                area.riskEvidenceLevel !==
                  nextArea.riskEvidenceLevel ||
                area.totalPsyllidCount !==
                  nextArea.totalPsyllidCount ||
                area.totalMonitoringMinutes !==
                  nextArea.totalMonitoringMinutes ||
                area.totalExposureMinutes !==
                  nextArea.totalExposureMinutes;


              if (
                areaChanged
              ) {
                changed =
                  true;
              }


              return areaChanged
                ? nextArea
                : area;
            }
          );


        return changed
          ? nextAreas
          : previousAreas;
      }
    );
  }, [
    completedScans,
  ]);


  /*
    LOCAL + CLOUD PERSISTENCE

    localStorage is always maintained.

    Firestore synchronization is deliberately
    blocked until the initial cloud-read attempt
    has completed.
  */

  useEffect(() => {
    savePersistentData(
      completedScans,
      monitoringAreas
    );


    if (
      !cloudHydrationComplete
    ) {
      return;
    }


    const syncSignature =
      JSON.stringify({
        completedScans,
        monitoringAreas,
      });


    if (
      lastCloudSyncSignature.current ===
      syncSignature
    ) {
      return;
    }


    lastCloudSyncSignature.current =
      syncSignature;


    async function syncCloudData() {
      try {
        await syncCitraGuardDataToFirestore(
          completedScans,
          monitoringAreas
        );


        console.log(
          "CitraGuard cloud sync complete."
        );
      } catch (error) {
        lastCloudSyncSignature.current =
          null;


        console.error(
          "CitraGuard cloud sync failed:",
          error
        );
      }
    }


    syncCloudData();
  }, [
    completedScans,
    monitoringAreas,
    cloudHydrationComplete,
  ]);


  function setDuration(
    minutes
  ) {
    setCurrentScan(
      (
        previousScan
      ) => {
        const baseScan =
          previousScan.status ===
          "idle"
            ? previousScan
            : createEmptyScan();


        return {
          ...baseScan,

          plannedDurationMinutes:
            minutes,

          scheduledCaptureCount:
            null,

          estimatedStorageMB:
            null,

          estimatedPowerUsePercent:
            null,
        };
      }
    );
  }


  function setMonitoringMode(
    monitoringMode
  ) {
    if (
      monitoringMode !==
        "focused" &&
      monitoringMode !==
        "extended"
    ) {
      return false;
    }


    setCurrentScan(
      (
        previousScan
      ) => {
        const baseScan =
          previousScan.status ===
          "idle"
            ? previousScan
            : createEmptyScan();


        return {
          ...baseScan,

          protocolVersion: 2,

          monitoringMode,

          plannedDurationMinutes:
            null,

          captureIntervalMinutes:
            monitoringMode ===
            "focused"
              ? 20
              : 60,

          captureWindow:
            "daylight",

          adaptiveVerification:
            false,

          scheduledCaptureCount:
            null,

          estimatedStorageMB:
            null,

          estimatedPowerUsePercent:
            null,

          trapServiceIntervalDays:
            null,
        };
      }
    );


    return true;
  }


  function setCaptureInterval(
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
      return false;
    }


    setCurrentScan(
      (
        previousScan
      ) => ({
        ...previousScan,

        captureIntervalMinutes:
          numericMinutes,

        scheduledCaptureCount:
          null,

        estimatedStorageMB:
          null,

        estimatedPowerUsePercent:
          null,
      })
    );


    return true;
  }


  function setCaptureWindow(
    captureWindow
  ) {
    if (
      captureWindow !==
        "daylight" &&
      captureWindow !==
        "continuous"
    ) {
      return false;
    }


    setCurrentScan(
      (
        previousScan
      ) => ({
        ...previousScan,

        captureWindow,

        scheduledCaptureCount:
          null,

        estimatedStorageMB:
          null,

        estimatedPowerUsePercent:
          null,
      })
    );


    return true;
  }


  function setAdaptiveVerification(
    enabled
  ) {
    setCurrentScan(
      (
        previousScan
      ) => ({
        ...previousScan,

        adaptiveVerification:
          Boolean(
            enabled
          ),
      })
    );
  }


  function setDeploymentForecast({
    scheduledCaptureCount,
    estimatedStorageMB,
    estimatedPowerUsePercent,
  }) {
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


    setCurrentScan(
      (
        previousScan
      ) => ({
        ...previousScan,

        scheduledCaptureCount:
          finiteNumberOrNull(
            scheduledCaptureCount
          ),

        estimatedStorageMB:
          finiteNumberOrNull(
            estimatedStorageMB
          ),

        estimatedPowerUsePercent:
          finiteNumberOrNull(
            estimatedPowerUsePercent
          ),
      })
    );
  }


  function setScanName(
    name
  ) {
    setCurrentScan(
      (
        previousScan
      ) => ({
        ...previousScan,

        scanName:
          name,

        isCustomName:
          name.trim().length >
          0,
      })
    );
  }


  function setLocation(
    latitude,
    longitude
  ) {
    const numericLatitude =
      Number(
        latitude
      );


    const numericLongitude =
      Number(
        longitude
      );


    const locationIsValid =
      Number.isFinite(
        numericLatitude
      ) &&
      Number.isFinite(
        numericLongitude
      ) &&
      numericLatitude >= -90 &&
      numericLatitude <= 90 &&
      numericLongitude >= -180 &&
      numericLongitude <= 180;


    if (
      !locationIsValid
    ) {
      return false;
    }


    setCurrentScan(
      (
        previousScan
      ) => {
        const baseScan =
          previousScan.status ===
          "idle"
            ? previousScan
            : createEmptyScan();


        const defaultName =
          createDefaultScanName(
            numericLatitude,
            numericLongitude
          );


        return {
          ...baseScan,

          latitude:
            numericLatitude,

          longitude:
            numericLongitude,

          areaId: null,

          isAreaUpdate:
            false,

          updatesAreaId:
            null,

          scanName:
            baseScan.isCustomName
              ? baseScan.scanName
              : defaultName,
        };
      }
    );


    return true;
  }


  function findMonitoringAreaAtLocation(
    latitude,
    longitude
  ) {
    const matchingAreas =
      monitoringAreas
        .map(
          (area) => {
            const distanceMeters =
              calculateDistanceMeters(
                latitude,
                longitude,
                area.centerLatitude,
                area.centerLongitude
              );


            return {
              area,
              distanceMeters,
            };
          }
        )
        .filter(
          ({
            area,
            distanceMeters,
          }) =>
            distanceMeters <=
            area.radiusMeters
        )
        .sort(
          (
            first,
            second
          ) =>
            first.distanceMeters -
            second.distanceMeters
        );


    if (
      matchingAreas.length ===
      0
    ) {
      return null;
    }


    return matchingAreas[0];
  }


  function selectExistingArea(
    area,
    latitude,
    longitude
  ) {
    const defaultName =
      area.areaName;


    setCurrentScan({
      ...createEmptyScan(),

      areaId:
        area.areaId,

      scanName:
        defaultName,

      isCustomName:
        true,

      latitude,

      longitude,

      isAreaUpdate:
        true,

      updatesAreaId:
        area.areaId,
    });
  }


  function createNewMonitoringPoint(
    latitude,
    longitude
  ) {
    const defaultName =
      createDefaultScanName(
        latitude,
        longitude
      );


    setCurrentScan({
      ...createEmptyScan(),

      latitude,

      longitude,

      scanName:
        defaultName,

      isCustomName:
        false,

      areaId: null,

      isAreaUpdate:
        false,

      updatesAreaId:
        null,
    });
  }


  function startScan(
    scanName
  ) {
    setCurrentScan(
      (
        previousScan
      ) => ({
        ...previousScan,

        scanName:
          scanName.trim(),

        isCustomName:
          true,

        status:
          "active",

        startedAt:
          new Date().toISOString(),

        monitoringEndedAt:
          null,

        endedAt:
          null,

        completionType:
          null,

        actualDurationMinutes:
          null,

        scanId:
          null,

        createdAt:
          null,

        observationId:
          null,

        psyllidCount:
          null,

        referencePsyllidCount:
          null,

        preparedObservationCount:
          null,

        simulatedFieldCount:
          null,

        simulatedWeeklyIntensity:
          null,

        captureRatePerWeek:
          null,

        classificationRatePerWeek:
          null,

        riskEvidenceLevel:
          null,

        riskMetric:
          null,

        detectionMethod:
          null,

        confidence:
          null,

        temperature:
          null,

        humidity:
          null,

        light:
          null,

        windSpeed:
          null,

        windDirection:
          null,

        riskScore:
          null,

        riskLevel:
          null,
      })
    );
  }


  function finishMonitoringNormally() {
    setCurrentScan(
      (
        previousScan
      ) => ({
        ...previousScan,

        status:
          "processing",

        monitoringEndedAt:
          new Date().toISOString(),

        completionType:
          "completed",

        actualDurationMinutes:
          previousScan
            .plannedDurationMinutes,
      })
    );
  }


  function endScanEarly(
    actualDurationMinutes
  ) {
    setCurrentScan(
      (
        previousScan
      ) => ({
        ...previousScan,

        status:
          "processing",

        monitoringEndedAt:
          new Date().toISOString(),

        completionType:
          "ended-early",

        actualDurationMinutes,
      })
    );
  }


  function completeProcessing() {
    const areaId =
      currentScan.areaId ??
      crypto.randomUUID();


    const prototypeResult =
      createPrototypeScanResult({
        ...currentScan,

        areaId,
      });


    const durationAwareResult =
      createDurationAwarePrototypeDetection(
        prototypeResult,
        currentScan
      );


    /*
      Preserve protocol configuration even if the
      prototype result engine only returns its older
      detection/result fields.
    */
    const completedScan =
      normalizeStoredScan({
        ...currentScan,
        ...durationAwareResult,

        areaId,

        protocolVersion:
          currentScan.protocolVersion ??
          2,
      });


    const previousAreaScans =
      completedScans.filter(
        (scan) =>
          scan.areaId ===
          areaId
      );


    const areaScans = [
      ...previousAreaScans,
      completedScan,
    ];


    const areaResult =
      calculatePrototypeAreaResult(
        areaScans
      );


    setCurrentScan(
      completedScan
    );


    setCompletedScans(
      (
        previousScans
      ) => [
        completedScan,
        ...previousScans,
      ]
    );


    setMonitoringAreas(
      (
        previousAreas
      ) => {
        const existingArea =
          previousAreas.find(
            (area) =>
              area.areaId ===
              areaId
          );


        if (
          !existingArea
        ) {
          const newArea =
            createMonitoringArea(
              completedScan,
              areaResult
            );


          return [
            newArea,
            ...previousAreas,
          ];
        }


        return previousAreas.map(
          (area) => {
            if (
              area.areaId !==
              areaId
            ) {
              return area;
            }


            return {
              ...area,

              scanIds: [
                ...area.scanIds,
                completedScan.scanId,
              ],

              scanCount:
                areaScans.length,

              latestScanId:
                completedScan.scanId,

              currentRiskLevel:
                areaResult
                  .currentRiskLevel,

              currentRiskValue:
                areaResult
                  .currentRiskValue,

              currentRiskMetric:
                areaResult
                  .currentRiskMetric,

              observedRatePerWeek:
                areaResult
                  .observedRatePerWeek,

              classificationRatePerWeek:
                areaResult
                  .classificationRatePerWeek,

              riskEvidenceLevel:
                areaResult
                  .riskEvidenceLevel,

              totalPsyllidCount:
                areaResult
                  .totalPsyllidCount,

              totalMonitoringMinutes:
                areaResult
                  .totalMonitoringMinutes,

              totalExposureMinutes:
                areaResult
                  .totalExposureMinutes,

              lastUpdated:
                completedScan.endedAt,
            };
          }
        );
      }
    );
  }


  function renameScan(
    scanId,
    newName
  ) {
    const cleanedName =
      newName.trim();


    if (
      !cleanedName
    ) {
      return false;
    }


    setCompletedScans(
      (
        previousScans
      ) =>
        previousScans.map(
          (scan) => {
            if (
              scan.scanId !==
              scanId
            ) {
              return scan;
            }


            return {
              ...scan,

              scanName:
                cleanedName,

              isCustomName:
                true,
            };
          }
        )
    );


    setCurrentScan(
      (
        previousScan
      ) => {
        if (
          previousScan.scanId !==
          scanId
        ) {
          return previousScan;
        }


        return {
          ...previousScan,

          scanName:
            cleanedName,

          isCustomName:
            true,
        };
      }
    );


    return true;
  }


  function cancelScan() {
    setCurrentScan(
      createEmptyScan()
    );
  }


  function resetScan() {
    setCurrentScan(
      createEmptyScan()
    );
  }


  function getScanById(
    scanId
  ) {
    return completedScans.find(
      (scan) =>
        scan.scanId ===
        scanId
    );
  }


  function getAreaById(
    areaId
  ) {
    return monitoringAreas.find(
      (area) =>
        area.areaId ===
        areaId
    );
  }


  return (
    <ScanContext.Provider
      value={{
        currentScan,
        completedScans,
        monitoringAreas,

        setDuration,
        setMonitoringMode,
        setCaptureInterval,
        setCaptureWindow,
        setAdaptiveVerification,
        setDeploymentForecast,

        setLocation,
        setScanName,

        findMonitoringAreaAtLocation,
        selectExistingArea,
        createNewMonitoringPoint,

        startScan,

        finishMonitoringNormally,
        endScanEarly,
        completeProcessing,

        renameScan,

        cancelScan,
        resetScan,

        getScanById,
        getAreaById,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}


export function useScan() {
  const context =
    useContext(
      ScanContext
    );


  if (!context) {
    throw new Error(
      "useScan must be used inside ScanProvider"
    );
  }


  return context;
}