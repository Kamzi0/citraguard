const STICKY_CARD_OBSERVATIONS = [
  {
    observationId: "OBS-001",
    psyllidCount: 0,
  },
  {
    observationId: "OBS-002",
    psyllidCount: 1,
  },
  {
    observationId: "OBS-003",
    psyllidCount: 3,
  },
  {
    observationId: "OBS-004",
    psyllidCount: 6,
  },
  {
    observationId: "OBS-005",
    psyllidCount: 11,
  },
  {
    observationId: "OBS-006",
    psyllidCount: 15,
  },
];

const WIND_DIRECTIONS = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
];

function getRandomItem(items) {
  const randomIndex = Math.floor(
    Math.random() * items.length
  );

  return items[randomIndex];
}

function getRandomNumber(
  minimum,
  maximum,
  decimalPlaces = 1
) {
  const value =
    Math.random() * (maximum - minimum) + minimum;

  return Number(
    value.toFixed(decimalPlaces)
  );
}

export function classifyPrototypeRisk(
  psyllidCount
) {
  if (psyllidCount <= 2) {
    return "LOW";
  }

  if (psyllidCount <= 9) {
    return "CAUTION";
  }

  return "HIGH";
}

export function createPrototypeScanResult(
  scan
) {
  const observation =
    getRandomItem(STICKY_CARD_OBSERVATIONS);

  const psyllidCount =
    observation.psyllidCount;

  return {
    ...scan,

    scanId: crypto.randomUUID(),

    createdAt: new Date().toISOString(),

    observationId:
      observation.observationId,

    psyllidCount,

    detectionMethod:
      "Prepared sticky-card label",

    confidence: null,

    temperature:
      getRandomNumber(18, 38, 1),

    humidity:
      getRandomNumber(35, 95, 0),

    light:
      getRandomNumber(2000, 80000, 0),

    windSpeed:
      getRandomNumber(0, 8, 1),

    windDirection:
      getRandomItem(WIND_DIRECTIONS),

    riskScore: null,

    riskLevel:
      classifyPrototypeRisk(
        psyllidCount
      ),

    status: "complete",

    endedAt:
      new Date().toISOString(),
  };
}