const EARTH_RADIUS_METERS =
  6371000;

const MAX_MERCATOR_LATITUDE =
  85;


function toRadians(
  degrees
) {
  return (
    degrees *
    (Math.PI / 180)
  );
}


function toDegrees(
  radians
) {
  return (
    radians *
    (180 / Math.PI)
  );
}


function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}


export function calculateDistanceMeters(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const latitudeDifference =
    toRadians(
      latitude2 - latitude1
    );

  const longitudeDifference =
    toRadians(
      longitude2 - longitude1
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
      latitudeDifference / 2
    ) ** 2 +
    Math.cos(
      firstLatitude
    ) *
      Math.cos(
        secondLatitude
      ) *
      Math.sin(
        longitudeDifference / 2
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
    EARTH_RADIUS_METERS *
    angularDistance
  );
}


function hexToRgb(
  hexColor
) {
  const cleanedColor =
    hexColor.replace(
      "#",
      ""
    );

  return {
    red:
      parseInt(
        cleanedColor.slice(
          0,
          2
        ),
        16
      ),

    green:
      parseInt(
        cleanedColor.slice(
          2,
          4
        ),
        16
      ),

    blue:
      parseInt(
        cleanedColor.slice(
          4,
          6
        ),
        16
      ),
  };
}


function rgbToHex(
  red,
  green,
  blue
) {
  const componentToHex =
    (component) =>
      Math.round(
        component
      )
        .toString(16)
        .padStart(
          2,
          "0"
        );

  return `#${componentToHex(
    red
  )}${componentToHex(
    green
  )}${componentToHex(
    blue
  )}`;
}


function interpolateColor(
  firstColor,
  secondColor,
  amount
) {
  const firstRgb =
    hexToRgb(
      firstColor
    );

  const secondRgb =
    hexToRgb(
      secondColor
    );

  const safeAmount =
    clamp(
      amount,
      0,
      1
    );

  return rgbToHex(
    firstRgb.red +
      (
        secondRgb.red -
        firstRgb.red
      ) *
        safeAmount,

    firstRgb.green +
      (
        secondRgb.green -
        firstRgb.green
      ) *
        safeAmount,

    firstRgb.blue +
      (
        secondRgb.blue -
        firstRgb.blue
      ) *
        safeAmount
  );
}


const RISK_COLOR_STOPS = [
  {
    value: 0,
    color: "#22c55e",
  },

  {
    value: 2,
    color: "#22c55e",
  },

  {
    value: 3,
    color: "#eab308",
  },

  {
    value: 6,
    color: "#f59e0b",
  },

  {
    value: 9,
    color: "#f97316",
  },

  {
    value: 10,
    color: "#ef4444",
  },
];


export function getRiskColorFromValue(
  riskValue
) {
  if (
    !Number.isFinite(
      riskValue
    )
  ) {
    return "#94a3b8";
  }

  if (
    riskValue <=
    RISK_COLOR_STOPS[0].value
  ) {
    return (
      RISK_COLOR_STOPS[0]
        .color
    );
  }

  const lastStop =
    RISK_COLOR_STOPS[
      RISK_COLOR_STOPS.length -
        1
    ];

  if (
    riskValue >=
    lastStop.value
  ) {
    return lastStop.color;
  }

  for (
    let index = 0;
    index <
    RISK_COLOR_STOPS.length -
      1;
    index += 1
  ) {
    const firstStop =
      RISK_COLOR_STOPS[
        index
      ];

    const secondStop =
      RISK_COLOR_STOPS[
        index + 1
      ];

    const isBetweenStops =
      riskValue >=
        firstStop.value &&
      riskValue <=
        secondStop.value;

    if (!isBetweenStops) {
      continue;
    }

    const range =
      secondStop.value -
      firstStop.value;

    const amount =
      range === 0
        ? 0
        : (
            riskValue -
            firstStop.value
          ) /
          range;

    return interpolateColor(
      firstStop.color,
      secondStop.color,
      amount
    );
  }

  return "#94a3b8";
}


function getRiskContributors(
  latitude,
  longitude,
  monitoringAreas
) {
  return monitoringAreas
    .map((area) => {
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
    })
    .filter(
      ({
        area,
        distanceMeters,
      }) =>
        Number.isFinite(
          area.currentRiskValue
        ) &&
        distanceMeters <=
          area.radiusMeters
    );
}


export function calculateBlendedRiskValue(
  latitude,
  longitude,
  monitoringAreas
) {
  const contributors =
    getRiskContributors(
      latitude,
      longitude,
      monitoringAreas
    );

  if (
    contributors.length === 0
  ) {
    return null;
  }

  let weightedValueTotal =
    0;

  let totalWeight =
    0;

  contributors.forEach(
    ({
      area,
      distanceMeters,
    }) => {
      const proximity =
        clamp(
          1 -
            distanceMeters /
              area.radiusMeters,
          0,
          1
        );

      const weight =
        0.1 +
        proximity *
          proximity *
          0.9;

      weightedValueTotal +=
        area.currentRiskValue *
        weight;

      totalWeight +=
        weight;
    }
  );

  if (
    totalWeight === 0
  ) {
    return null;
  }

  return Number(
    (
      weightedValueTotal /
      totalWeight
    ).toFixed(2)
  );
}


function calculateRiskFieldSample(
  latitude,
  longitude,
  monitoringAreas
) {
  const contributors =
    getRiskContributors(
      latitude,
      longitude,
      monitoringAreas
    );

  if (
    contributors.length === 0
  ) {
    return null;
  }

  const riskValue =
    calculateBlendedRiskValue(
      latitude,
      longitude,
      monitoringAreas
    );

  let strongestProximity =
    0;

  contributors.forEach(
    ({
      area,
      distanceMeters,
    }) => {
      const proximity =
        clamp(
          1 -
            distanceMeters /
              area.radiusMeters,
          0,
          1
        );

      strongestProximity =
        Math.max(
          strongestProximity,
          proximity
        );
    }
  );

  const overlapBoost =
    Math.min(
      0.08,
      (
        contributors.length -
        1
      ) *
        0.04
    );

  const opacity =
    clamp(
      0.16 +
        strongestProximity *
          0.36 +
        overlapBoost,
      0.16,
      0.58
    );

  return {
    riskValue,

    color:
      getRiskColorFromValue(
        riskValue
      ),

    opacity:
      Number(
        opacity.toFixed(2)
      ),

    contributorCount:
      contributors.length,
  };
}


function projectToMeters(
  latitude,
  longitude
) {
  const safeLatitude =
    clamp(
      latitude,
      -MAX_MERCATOR_LATITUDE,
      MAX_MERCATOR_LATITUDE
    );

  const latitudeRadians =
    toRadians(
      safeLatitude
    );

  return {
    x:
      EARTH_RADIUS_METERS *
      toRadians(
        longitude
      ),

    y:
      EARTH_RADIUS_METERS *
      Math.log(
        Math.tan(
          Math.PI / 4 +
            latitudeRadians / 2
        )
      ),
  };
}


function unprojectFromMeters(
  x,
  y
) {
  const longitude =
    toDegrees(
      x /
        EARTH_RADIUS_METERS
    );

  const latitude =
    toDegrees(
      2 *
        Math.atan(
          Math.exp(
            y /
              EARTH_RADIUS_METERS
          )
        ) -
        Math.PI / 2
    );

  return {
    latitude,
    longitude,
  };
}


export function generateRiskFieldPoints(
  monitoringAreas
) {
  if (
    monitoringAreas.length === 0
  ) {
    return [];
  }

  const gridSpacingMeters =
    2;

  const candidateCells =
    new Map();


  monitoringAreas.forEach(
    (area) => {
      const projectedCenter =
        projectToMeters(
          area.centerLatitude,
          area.centerLongitude
        );

      const latitudeScale =
        Math.max(
          0.2,
          Math.cos(
            toRadians(
              area.centerLatitude
            )
          )
        );

      const projectedRadius =
        area.radiusMeters /
        latitudeScale;

      const minimumXIndex =
        Math.floor(
          (
            projectedCenter.x -
            projectedRadius
          ) /
            gridSpacingMeters
        );

      const maximumXIndex =
        Math.ceil(
          (
            projectedCenter.x +
            projectedRadius
          ) /
            gridSpacingMeters
        );

      const minimumYIndex =
        Math.floor(
          (
            projectedCenter.y -
            projectedRadius
          ) /
            gridSpacingMeters
        );

      const maximumYIndex =
        Math.ceil(
          (
            projectedCenter.y +
            projectedRadius
          ) /
            gridSpacingMeters
        );


      for (
        let xIndex =
          minimumXIndex;
        xIndex <=
        maximumXIndex;
        xIndex += 1
      ) {
        for (
          let yIndex =
            minimumYIndex;
          yIndex <=
          maximumYIndex;
          yIndex += 1
        ) {
          const cellId =
            `${xIndex}:${yIndex}`;

          if (
            candidateCells.has(
              cellId
            )
          ) {
            continue;
          }

          candidateCells.set(
            cellId,
            {
              x:
                xIndex *
                gridSpacingMeters,

              y:
                yIndex *
                gridSpacingMeters,
            }
          );
        }
      }
    }
  );


  const riskFieldPoints = [];


  candidateCells.forEach(
    (
      projectedPoint,
      cellId
    ) => {
      const location =
        unprojectFromMeters(
          projectedPoint.x,
          projectedPoint.y
        );

      const sample =
        calculateRiskFieldSample(
          location.latitude,
          location.longitude,
          monitoringAreas
        );

      if (!sample) {
        return;
      }

      riskFieldPoints.push({
        id: cellId,

        latitude:
          location.latitude,

        longitude:
          location.longitude,

        riskValue:
          sample.riskValue,

        color:
          sample.color,

        opacity:
          sample.opacity,

        contributorCount:
          sample.contributorCount,
      });
    }
  );


  return riskFieldPoints;
}