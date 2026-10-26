import * as SunCalc from "suncalc";


const OPEN_METEO_ENDPOINT =
  "https://api.open-meteo.com/v1/forecast";


function finite(
  value
) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(
      Number(
        value
      )
    )
  );
}


function localDateParts(
  date,
  timeZone
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );


  const parts =
    Object.fromEntries(
      formatter
        .formatToParts(
          date
        )
        .filter(
          (part) =>
            part.type !==
            "literal"
        )
        .map(
          (part) => [
            part.type,
            part.value,
          ]
        )
    );


  return {
    year:
      Number(
        parts.year
      ),

    month:
      Number(
        parts.month
      ),

    day:
      Number(
        parts.day
      ),
  };
}


function timeZoneOffsetMinutes(
  date,
  timeZone
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }
    );


  const parts =
    Object.fromEntries(
      formatter
        .formatToParts(
          date
        )
        .filter(
          (part) =>
            part.type !==
            "literal"
        )
        .map(
          (part) => [
            part.type,
            part.value,
          ]
        )
    );


  const representedUtc =
    Date.UTC(
      Number(
        parts.year
      ),
      Number(
        parts.month
      ) -
        1,
      Number(
        parts.day
      ),
      Number(
        parts.hour
      ),
      Number(
        parts.minute
      ),
      Number(
        parts.second
      )
    );


  return Math.round(
    (
      representedUtc -
      date.getTime()
    ) /
      60000
  );
}


function formatLocalTime(
  date,
  timeZone
) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unavailable";
  }


  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(
    date
  );
}


function weatherDescription(
  weatherCode
) {
  const code =
    Number(
      weatherCode
    );


  if (code === 0) {
    return "Clear";
  }


  if (
    code === 1 ||
    code === 2
  ) {
    return "Partly cloudy";
  }


  if (code === 3) {
    return "Overcast";
  }


  if (
    code === 45 ||
    code === 48
  ) {
    return "Fog";
  }


  if (
    code >= 51 &&
    code <= 57
  ) {
    return "Drizzle";
  }


  if (
    code >= 61 &&
    code <= 67
  ) {
    return "Rain";
  }


  if (
    code >= 71 &&
    code <= 77
  ) {
    return "Snow";
  }


  if (
    code >= 80 &&
    code <= 82
  ) {
    return "Rain showers";
  }


  if (
    code >= 85 &&
    code <= 86
  ) {
    return "Snow showers";
  }


  if (
    code >= 95
  ) {
    return "Thunderstorms";
  }


  return "Conditions unavailable";
}


export async function fetchFieldConditions(
  latitude,
  longitude
) {
  if (
    !finite(
      latitude
    ) ||
    !finite(
      longitude
    )
  ) {
    throw new Error(
      "Valid latitude and longitude are required for field conditions."
    );
  }


  const params =
    new URLSearchParams({
      latitude:
        String(
          Number(
            latitude
          )
        ),

      longitude:
        String(
          Number(
            longitude
          )
        ),

      current:
        [
          "temperature_2m",
          "relative_humidity_2m",
          "precipitation",
          "rain",
          "weather_code",
          "wind_speed_10m",
          "wind_direction_10m",
          "is_day",
        ].join(
          ","
        ),

      daily:
        [
          "weather_code",
          "sunrise",
          "sunset",
          "daylight_duration",
          "precipitation_probability_max",
          "temperature_2m_max",
          "temperature_2m_min",
          "wind_speed_10m_max",
        ].join(
          ","
        ),

      timezone:
        "auto",

      forecast_days:
        "7",
    });


  const response =
    await fetch(
      `${OPEN_METEO_ENDPOINT}?${params.toString()}`
    );


  if (
    !response.ok
  ) {
    throw new Error(
      `Weather request failed with status ${response.status}.`
    );
  }


  const data =
    await response.json();


  const timezone =
    data.timezone ||
    "UTC";


  return {
    latitude:
      Number(
        data.latitude
      ),

    longitude:
      Number(
        data.longitude
      ),

    timezone,

    timezoneAbbreviation:
      data.timezone_abbreviation ??
      null,

    current: {
      time:
        data.current?.time ??
        null,

      temperatureC:
        finite(
          data.current
            ?.temperature_2m
        )
          ? Number(
              data.current
                .temperature_2m
            )
          : null,

      relativeHumidityPercent:
        finite(
          data.current
            ?.relative_humidity_2m
        )
          ? Number(
              data.current
                .relative_humidity_2m
            )
          : null,

      precipitationMm:
        finite(
          data.current
            ?.precipitation
        )
          ? Number(
              data.current
                .precipitation
            )
          : null,

      rainMm:
        finite(
          data.current
            ?.rain
        )
          ? Number(
              data.current
                .rain
            )
          : null,

      weatherCode:
        finite(
          data.current
            ?.weather_code
        )
          ? Number(
              data.current
                .weather_code
            )
          : null,

      description:
        weatherDescription(
          data.current
            ?.weather_code
        ),

      windSpeedKmh:
        finite(
          data.current
            ?.wind_speed_10m
        )
          ? Number(
              data.current
                .wind_speed_10m
            )
          : null,

      windDirectionDegrees:
        finite(
          data.current
            ?.wind_direction_10m
        )
          ? Number(
              data.current
                .wind_direction_10m
            )
          : null,

      isDay:
        Number(
          data.current
            ?.is_day
        ) === 1,
    },

    today: {
      sunrise:
        data.daily
          ?.sunrise?.[0] ??
        null,

      sunset:
        data.daily
          ?.sunset?.[0] ??
        null,

      daylightDurationSeconds:
        finite(
          data.daily
            ?.daylight_duration?.[0]
        )
          ? Number(
              data.daily
                .daylight_duration[0]
            )
          : null,

      precipitationProbabilityMax:
        finite(
          data.daily
            ?.precipitation_probability_max?.[0]
        )
          ? Number(
              data.daily
                .precipitation_probability_max[0]
            )
          : null,

      temperatureMaxC:
        finite(
          data.daily
            ?.temperature_2m_max?.[0]
        )
          ? Number(
              data.daily
                .temperature_2m_max[0]
            )
          : null,

      temperatureMinC:
        finite(
          data.daily
            ?.temperature_2m_min?.[0]
        )
          ? Number(
              data.daily
                .temperature_2m_min[0]
            )
          : null,

      windSpeedMaxKmh:
        finite(
          data.daily
            ?.wind_speed_10m_max?.[0]
        )
          ? Number(
              data.daily
                .wind_speed_10m_max[0]
            )
          : null,
    },
  };
}


export function calculateCaptureSchedule({
  latitude,
  longitude,
  timeZone,
  startDate =
    new Date(),
  durationMinutes,
  captureIntervalMinutes,
  captureWindow =
    "daylight",
}) {
  const lat =
    Number(
      latitude
    );


  const lon =
    Number(
      longitude
    );


  const duration =
    Number(
      durationMinutes
    );


  const interval =
    Number(
      captureIntervalMinutes
    );


  if (
    !Number.isFinite(
      lat
    ) ||
    !Number.isFinite(
      lon
    ) ||
    !Number.isFinite(
      duration
    ) ||
    duration <= 0 ||
    !Number.isFinite(
      interval
    ) ||
    interval <= 0
  ) {
    return {
      totalCaptures: 0,
      activeMinutes: 0,
      daylightWindows: [],
      nextCaptureAt: null,
      todaySunrise: null,
      todaySunset: null,
      todaySunriseLabel:
        "Unavailable",
      todaySunsetLabel:
        "Unavailable",
      isDaylightNow:
        null,
    };
  }


  const zone =
    timeZone ||
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone ||
    "UTC";


  const sessionStart =
    new Date(
      startDate
    );


  const sessionEnd =
    new Date(
      sessionStart.getTime() +
      duration *
        60000
    );


  const intervalMs =
    interval *
    60000;


  if (
    captureWindow ===
    "continuous"
  ) {
    return {
      totalCaptures:
        Math.max(
          1,
          Math.floor(
            (
              sessionEnd -
              sessionStart
            ) /
              intervalMs
          ) +
            1
        ),

      activeMinutes:
        duration,

      daylightWindows:
        [],

      nextCaptureAt:
        sessionStart,

      todaySunrise:
        null,

      todaySunset:
        null,

      todaySunriseLabel:
        "24-hour",

      todaySunsetLabel:
        "24-hour",

      isDaylightNow:
        null,
    };
  }


  const startParts =
    localDateParts(
      sessionStart,
      zone
    );


  const firstDay =
    new Date(
      Date.UTC(
        startParts.year,
        startParts.month -
          1,
        startParts.day,
        12
      )
    );


  const daysToInspect =
    Math.ceil(
      duration /
        1440
    ) +
    2;


  let totalCaptures =
    0;


  let activeMinutes =
    0;


  let nextCaptureAt =
    null;


  let todaySunrise =
    null;


  let todaySunset =
    null;


  const daylightWindows =
    [];


  for (
    let dayIndex = 0;
    dayIndex <
    daysToInspect;
    dayIndex++
  ) {
    const calendarDay =
      new Date(
        firstDay
      );


    calendarDay.setUTCDate(
      firstDay.getUTCDate() +
      dayIndex
    );


    const offsetMinutes =
      timeZoneOffsetMinutes(
        calendarDay,
        zone
      );


    const sunTimes =
      SunCalc.getTimes(
        calendarDay,
        lat,
        lon,
        0,
        offsetMinutes
      );


    const sunrise =
      sunTimes.sunrise;


    const sunset =
      sunTimes.sunset;


    if (
      dayIndex === 0
    ) {
      todaySunrise =
        sunrise ??
        null;

      todaySunset =
        sunset ??
        null;
    }


    if (
      !(
        sunrise instanceof
        Date
      ) ||
      !(
        sunset instanceof
        Date
      )
    ) {
      continue;
    }


    if (
      Number.isNaN(
        sunrise.getTime()
      ) ||
      Number.isNaN(
        sunset.getTime()
      )
    ) {
      continue;
    }


    const windowStart =
      new Date(
        Math.max(
          sunrise.getTime(),
          sessionStart.getTime()
        )
      );


    const windowEnd =
      new Date(
        Math.min(
          sunset.getTime(),
          sessionEnd.getTime()
        )
      );


    if (
      windowEnd <
      windowStart
    ) {
      continue;
    }


    const windowMinutes =
      (
        windowEnd -
        windowStart
      ) /
      60000;


    activeMinutes +=
      windowMinutes;


    const capturesThisWindow =
      Math.floor(
        (
          windowEnd -
          windowStart
        ) /
          intervalMs
      ) +
      1;


    totalCaptures +=
      Math.max(
        0,
        capturesThisWindow
      );


    if (
      !nextCaptureAt
    ) {
      nextCaptureAt =
        windowStart;
    }


    daylightWindows.push({
      sunrise,

      sunset,

      activeStart:
        windowStart,

      activeEnd:
        windowEnd,

      captureCount:
        Math.max(
          0,
          capturesThisWindow
        ),
    });


    if (
      windowEnd >=
      sessionEnd
    ) {
      break;
    }
  }


  const isDaylightNow =
    todaySunrise &&
    todaySunset
      ? sessionStart >=
          todaySunrise &&
        sessionStart <=
          todaySunset
      : null;


  return {
    totalCaptures,

    activeMinutes:
      Number(
        activeMinutes.toFixed(
          1
        )
      ),

    daylightWindows,

    nextCaptureAt,

    todaySunrise,

    todaySunset,

    todaySunriseLabel:
      todaySunrise
        ? formatLocalTime(
            todaySunrise,
            zone
          )
        : "Unavailable",

    todaySunsetLabel:
      todaySunset
        ? formatLocalTime(
            todaySunset,
            zone
          )
        : "Unavailable",

    isDaylightNow,
  };
}