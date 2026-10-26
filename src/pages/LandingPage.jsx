import {
  useEffect,
  useRef,
} from "react";

import "../landing.css";


const ASSET_ROOT =
  "/citraguard-assets";


const EXPERTS = [
  {
    name:
      "Dr. Paulino Ribeiro Villas-Boas",
    organization:
      "Embrapa Instrumentation · Brazil",
    note:
      "AI validation, experimental design, statistics, and scientific publication",
    relationship:
      "Project guidance",
  },
  {
    name:
      "Dr. Olufunke Abiola Oke",
    organization:
      "NIHORT · Nigeria",
    note:
      "Entomology, pest surveillance, and citrus psyllids",
    relationship:
      "Project guidance",
  },
  {
    name:
      "Dr. Mamoudou Sétamou",
    organization:
      "Texas A&M University–Kingsville",
    note:
      "Asian citrus psyllid biology, ecology, monitoring, and pest management",
    relationship:
      "Field expertise",
  },
  {
    name:
      "Dr. Tolulope A. Agunbiade",
    organization:
      "Citrus entomology & biological control research",
    note:
      "ACP identification, pest management, and biological control",
    relationship:
      "Field expertise",
  },
];


/*
  The yellow sticky region was mapped directly
  from sentinel-front.png.

  Source-image yellow bounds:
  x = 398–725 of 1216 px
  y = 318–716 of 1052 px

  These normalized values let the animation
  find the yellow card correctly at any
  responsive rendered size.
*/
const STICKY_TRAP_REGION = {
  left: 398 / 1216,
  right: 725 / 1216,
  top: 318 / 1052,
  bottom: 716 / 1052,
};


const BUG_COUNT =
  18;


function randomBetween(
  minimum,
  maximum
) {
  return (
    minimum +
    Math.random() *
      (
        maximum -
        minimum
      )
  );
}


function shuffled(
  values
) {
  const copy = [
    ...values,
  ];


  for (
    let index =
      copy.length -
      1;
    index >
    0;
    index -=
      1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          (
            index +
            1
          )
      );


    [
      copy[
        index
      ],
      copy[
        randomIndex
      ],
    ] = [
      copy[
        randomIndex
      ],
      copy[
        index
      ],
    ];
  }


  return copy;
}


function angleBetween(
  firstPoint,
  secondPoint
) {
  return (
    Math.atan2(
      secondPoint.y -
        firstPoint.y,
      secondPoint.x -
        firstPoint.x
    ) *
    180 /
    Math.PI
  );
}


function createEdgeStart(
  edge,
  wrapperRect
) {
  const outsideDistance =
    randomBetween(
      80,
      180
    );


  let clientX =
    0;

  let clientY =
    0;


  if (
    edge ===
    "left"
  ) {
    clientX =
      -outsideDistance;

    clientY =
      randomBetween(
        window.innerHeight *
          0.08,
        window.innerHeight *
          0.92
      );
  }


  if (
    edge ===
    "right"
  ) {
    clientX =
      window.innerWidth +
      outsideDistance;

    clientY =
      randomBetween(
        window.innerHeight *
          0.08,
        window.innerHeight *
          0.92
      );
  }


  if (
    edge ===
    "top"
  ) {
    clientX =
      randomBetween(
        window.innerWidth *
          0.05,
        window.innerWidth *
          0.95
      );

    clientY =
      -outsideDistance;
  }


  if (
    edge ===
    "bottom"
  ) {
    clientX =
      randomBetween(
        window.innerWidth *
          0.08,
        window.innerWidth *
          0.92
      );

    clientY =
      window.innerHeight +
      outsideDistance;
  }


  return {
    x:
      clientX -
      wrapperRect.left,

    y:
      clientY -
      wrapperRect.top,
  };
}


function createLandingPoints(
  imageRect,
  wrapperRect
) {
  const trapLeft =
    imageRect.left -
    wrapperRect.left +
    imageRect.width *
      STICKY_TRAP_REGION.left;


  const trapRight =
    imageRect.left -
    wrapperRect.left +
    imageRect.width *
      STICKY_TRAP_REGION.right;


  const trapTop =
    imageRect.top -
    wrapperRect.top +
    imageRect.height *
      STICKY_TRAP_REGION.top;


  const trapBottom =
    imageRect.top -
    wrapperRect.top +
    imageRect.height *
      STICKY_TRAP_REGION.bottom;


  const horizontalInset =
    (
      trapRight -
      trapLeft
    ) *
    0.075;


  const verticalInset =
    (
      trapBottom -
      trapTop
    ) *
    0.065;


  const safeLeft =
    trapLeft +
    horizontalInset;


  const safeRight =
    trapRight -
    horizontalInset;


  const safeTop =
    trapTop +
    verticalInset;


  const safeBottom =
    trapBottom -
    verticalInset;


  /*
    Use a 4 × 5 grid so the final insects
    naturally spread across the whole yellow
    card instead of clustering. We use 18 of
    the 20 available zones each cycle and
    randomize the exact landing point inside
    every zone.
  */
  const columns =
    4;


  const rows =
    5;


  const allZones =
    [];


  for (
    let row = 0;
    row < rows;
    row += 1
  ) {
    for (
      let column = 0;
      column < columns;
      column += 1
    ) {
      allZones.push({
        row,
        column,
      });
    }
  }


  const zones =
    shuffled(
      allZones
    ).slice(
      0,
      BUG_COUNT
    );


  const zoneWidth =
    (
      safeRight -
      safeLeft
    ) /
    columns;


  const zoneHeight =
    (
      safeBottom -
      safeTop
    ) /
    rows;


  return zones.map(
    (
      zone
    ) => {
      const zoneLeft =
        safeLeft +
        zone.column *
          zoneWidth;


      const zoneTop =
        safeTop +
        zone.row *
          zoneHeight;


      return {
        x:
          randomBetween(
            zoneLeft +
              zoneWidth *
                0.16,
            zoneLeft +
              zoneWidth *
                0.84
          ),

        y:
          randomBetween(
            zoneTop +
              zoneHeight *
                0.16,
            zoneTop +
              zoneHeight *
                0.84
          ),
      };
    }
  );
}


function createFlightFrames(
  start,
  target,
  pathType,
  flip
) {
  const deltaX =
    target.x -
    start.x;


  const deltaY =
    target.y -
    start.y;


  const distance =
    Math.max(
      1,
      Math.hypot(
        deltaX,
        deltaY
      )
    );


  const unitX =
    deltaX /
    distance;


  const unitY =
    deltaY /
    distance;


  const perpendicularX =
    -unitY;


  const perpendicularY =
    unitX;


  const finalAngle =
    randomBetween(
      -75,
      75
    );


  const scale =
    randomBetween(
      0.72,
      0.96
    );


  const transformFor =
    (
      point,
      rotation,
      currentScale =
        scale
    ) =>
      `translate(${point.x}px, ${point.y}px) rotate(${rotation}deg) scale(${currentScale}) scaleX(${flip})`;


  const curveStrength =
    pathType ===
    "swoop"
      ? randomBetween(
          85,
          145
        )
      : pathType ===
        "wander"
      ? randomBetween(
          45,
          90
        )
      : randomBetween(
          14,
          38
        );


  const directionOne =
    Math.random() >
    0.5
      ? 1
      : -1;


  const directionTwo =
    pathType ===
    "wander"
      ? -directionOne
      : directionOne;


  const waypointOne = {
    x:
      start.x +
      deltaX *
        0.29 +
      perpendicularX *
        curveStrength *
        directionOne,

    y:
      start.y +
      deltaY *
        0.29 +
      perpendicularY *
        curveStrength *
        directionOne,
  };


  const waypointTwo = {
    x:
      start.x +
      deltaX *
        0.58 +
      perpendicularX *
        curveStrength *
        0.72 *
        directionTwo,

    y:
      start.y +
      deltaY *
        0.58 +
      perpendicularY *
        curveStrength *
        0.72 *
        directionTwo,
  };


  const preLandingDistance =
    randomBetween(
      28,
      56
    );


  const preLanding = {
    x:
      target.x -
      unitX *
        preLandingDistance,

    y:
      target.y -
      unitY *
        preLandingDistance,
  };


  if (
    pathType ===
    "loop"
  ) {
    const loopCenter = {
      x:
        start.x +
        deltaX *
          0.68,

      y:
        start.y +
        deltaY *
          0.68,
    };


    const radius =
      randomBetween(
        32,
        48
      );


    const loopOne = {
      x:
        loopCenter.x +
        perpendicularX *
          radius,

      y:
        loopCenter.y +
        perpendicularY *
          radius,
    };


    const loopTwo = {
      x:
        loopCenter.x +
        unitX *
          radius,

      y:
        loopCenter.y +
        unitY *
          radius,
    };


    const loopThree = {
      x:
        loopCenter.x -
        perpendicularX *
          radius,

      y:
        loopCenter.y -
        perpendicularY *
          radius,
    };


    const loopFour = {
      x:
        loopCenter.x -
        unitX *
          radius,

      y:
        loopCenter.y -
        unitY *
          radius,
    };


    return [
      {
        offset: 0,
        opacity: 0,
        transform:
          transformFor(
            start,
            angleBetween(
              start,
              waypointOne
            ),
            scale *
              0.88
          ),
      },
      {
        offset: 0.08,
        opacity: 1,
        transform:
          transformFor(
            start,
            angleBetween(
              start,
              waypointOne
            ),
            scale *
              0.9
          ),
      },
      {
        offset: 0.31,
        opacity: 1,
        transform:
          transformFor(
            waypointOne,
            angleBetween(
              waypointOne,
              waypointTwo
            )
          ),
      },
      {
        offset: 0.54,
        opacity: 1,
        transform:
          transformFor(
            waypointTwo,
            angleBetween(
              waypointTwo,
              loopOne
            )
          ),
      },
      {
        offset: 0.64,
        opacity: 1,
        transform:
          transformFor(
            loopOne,
            90
          ),
      },
      {
        offset: 0.72,
        opacity: 1,
        transform:
          transformFor(
            loopTwo,
            180
          ),
      },
      {
        offset: 0.8,
        opacity: 1,
        transform:
          transformFor(
            loopThree,
            270
          ),
      },
      {
        offset: 0.87,
        opacity: 1,
        transform:
          transformFor(
            loopFour,
            350
          ),
      },
      {
        offset: 0.94,
        opacity: 1,
        transform:
          transformFor(
            preLanding,
            angleBetween(
              preLanding,
              target
            ),
            scale *
              0.95
          ),
      },
      {
        offset: 1,
        opacity: 1,
        transform:
          transformFor(
            target,
            finalAngle,
            scale *
              0.9
          ),
      },
    ];
  }


  return [
    {
      offset: 0,
      opacity: 0,
      transform:
        transformFor(
          start,
          angleBetween(
            start,
            waypointOne
          ),
          scale *
            0.86
        ),
    },
    {
      offset: 0.08,
      opacity: 1,
      transform:
        transformFor(
          start,
          angleBetween(
            start,
            waypointOne
          ),
          scale *
            0.9
        ),
    },
    {
      offset: 0.34,
      opacity: 1,
      transform:
        transformFor(
          waypointOne,
          angleBetween(
            waypointOne,
            waypointTwo
          )
        ),
    },
    {
      offset: 0.66,
      opacity: 1,
      transform:
        transformFor(
          waypointTwo,
          angleBetween(
            waypointTwo,
            preLanding
          )
        ),
    },
    {
      offset: 0.9,
      opacity: 1,
      transform:
        transformFor(
          preLanding,
          angleBetween(
            preLanding,
            target
          ),
          scale *
            0.96
        ),
    },
    {
      offset: 1,
      opacity: 1,
      transform:
        transformFor(
          target,
          finalAngle,
          scale *
            0.9
        ),
    },
  ];
}


function FlyingBugs({
  trapImageRef,
  trapWrapRef,
}) {
  const flyRefs =
    useRef(
      []
    );


  const layerRef =
    useRef(
      null
    );


  const animationRefs =
    useRef(
      []
    );


  const timerRefs =
    useRef(
      []
    );


  const isVisibleRef =
    useRef(
      false
    );


  const isRunningRef =
    useRef(
      false
    );


  const isMountedRef =
    useRef(
      true
    );


  useEffect(() => {
    const wrapper =
      trapWrapRef.current;


    const image =
      trapImageRef.current;


    const layer =
      layerRef.current;


    if (
      !wrapper ||
      !image ||
      !layer
    ) {
      return;
    }


    isMountedRef.current =
      true;


    function clearTimers() {
      timerRefs.current.forEach(
        (
          timer
        ) =>
          window.clearTimeout(
            timer
          )
      );


      timerRefs.current =
        [];
    }


    function clearFlightAnimations() {
      animationRefs.current.forEach(
        (
          animation
        ) =>
          animation.cancel()
      );


      animationRefs.current =
        [];
    }


    function resetBugElements() {
      flyRefs.current.forEach(
        (
          fly
        ) => {
          if (
            !fly
          ) {
            return;
          }


          fly.style.opacity =
            "0";

          fly.style.setProperty(
            "--trail-opacity",
            "0"
          );
        }
      );
    }


    async function clearTrapAndRestart() {
      if (
        !isMountedRef.current
      ) {
        return;
      }


      const fade =
        layer.animate(
          [
            {
              opacity: 1,
            },
            {
              opacity: 0,
            },
          ],
          {
            duration: 700,
            easing:
              "ease-in-out",
            fill:
              "forwards",
          }
        );


      try {
        await fade.finished;
      } catch {
        return;
      }


      clearFlightAnimations();
      resetBugElements();


      fade.cancel();


      layer.style.opacity =
        "1";


      isRunningRef.current =
        false;


      if (
        isVisibleRef.current &&
        isMountedRef.current
      ) {
        const restartTimer =
          window.setTimeout(
            () => {
              startCycle();
            },
            900
          );


        timerRefs.current.push(
          restartTimer
        );
      }
    }


    function startCycle() {
      if (
        !isMountedRef.current ||
        !isVisibleRef.current ||
        isRunningRef.current
      ) {
        return;
      }


      isRunningRef.current =
        true;


      clearTimers();
      clearFlightAnimations();
      resetBugElements();


      const wrapperRect =
        wrapper.getBoundingClientRect();


      const imageRect =
        image.getBoundingClientRect();


      const landingPoints =
        createLandingPoints(
          imageRect,
          wrapperRect
        );


      const entryEdges =
        shuffled([
          "left",
          "right",
          "top",
          "left",
          "right",
          "bottom",
          "top",
          "left",
          "right",
          "bottom",
          "left",
          "right",
          "top",
          "left",
          "right",
          "bottom",
          "left",
          "right",
        ]);


      const pathTypes =
        shuffled([
          "wander",
          "straight",
          "wander",
          "swoop",
          "straight",
          "wander",
          "loop",
          "straight",
          "swoop",
          "wander",
          "straight",
          "wander",
          "swoop",
          "straight",
          "loop",
          "wander",
          "straight",
          "wander",
        ]);


      let landedCount =
        0;


      let accumulatedDelay =
        randomBetween(
          200,
          550
        );


      flyRefs.current.forEach(
        (
          fly,
          index
        ) => {
          if (
            !fly
          ) {
            return;
          }


          accumulatedDelay +=
            randomBetween(
              760,
              1220
            );


          const launchDelay =
            accumulatedDelay;


          const launchTimer =
            window.setTimeout(
              () => {
                if (
                  !isMountedRef.current
                ) {
                  return;
                }


                const start =
                  createEdgeStart(
                    entryEdges[
                      index
                    ],
                    wrapperRect
                  );


                const target =
                  landingPoints[
                    index
                  ];


                const flip =
                  start.x >
                  target.x
                    ? -1
                    : 1;


                fly.style.opacity =
                  "0";


                fly.style.setProperty(
                  "--trail-opacity",
                  "0.34"
                );


                const animation =
                  fly.animate(
                    createFlightFrames(
                      start,
                      target,
                      pathTypes[
                        index
                      ],
                      flip
                    ),
                    {
                      duration:
                        randomBetween(
                          4200,
                          6400
                        ),

                      easing:
                        "cubic-bezier(0.3, 0.1, 0.2, 1)",

                      fill:
                        "forwards",
                    }
                  );


                animationRefs.current.push(
                  animation
                );


                animation.finished
                  .then(
                    () => {
                      if (
                        !isMountedRef.current
                      ) {
                        return;
                      }


                      /*
                        The bug stays stuck on the card,
                        but its flight trail disappears.
                      */
                      fly.style.setProperty(
                        "--trail-opacity",
                        "0"
                      );


                      landedCount +=
                        1;


                      if (
                        landedCount ===
                        BUG_COUNT
                      ) {
                        const holdTimer =
                          window.setTimeout(
                            () => {
                              clearTrapAndRestart();
                            },
                            2800
                          );


                        timerRefs.current.push(
                          holdTimer
                        );
                      }
                    }
                  )
                  .catch(
                    () => {}
                  );
              },
              launchDelay
            );


          timerRefs.current.push(
            launchTimer
          );
        }
      );
    }


    const observer =
      new IntersectionObserver(
        (
          entries
        ) => {
          entries.forEach(
            (
              entry
            ) => {
              isVisibleRef.current =
                entry.isIntersecting;


              if (
                entry.isIntersecting
              ) {
                startCycle();
              }
            }
          );
        },
        {
          threshold:
            0.2,
        }
      );


    observer.observe(
      wrapper
    );


    return () => {
      isMountedRef.current =
        false;


      observer.disconnect();
      clearTimers();
      clearFlightAnimations();
    };
  }, [
    trapImageRef,
    trapWrapRef,
  ]);


  return (
    <div
      ref={layerRef}
      className="cg-bug-layer"
      aria-hidden="true"
    >
      {Array.from(
        {
          length:
            BUG_COUNT,
        },
        (
          _,
          index
        ) => (
          <span
            key={
              index
            }
            ref={(
              element
            ) => {
              flyRefs.current[
                index
              ] =
                element;
            }}
            className="cg-fly"
            style={{
              animation:
                "none",

              opacity:
                0,

              pointerEvents:
                "none",

              "--trail-opacity":
                0,
            }}
          />
        )
      )}
    </div>
  );
}


function LandingPage({
  onEnter,
}) {
  const prototypeRef =
    useRef(null);


  const trapWrapRef =
    useRef(null);


  const trapImageRef =
    useRef(null);


  useEffect(() => {
    const revealElements =
      document.querySelectorAll(
        ".cg-minimal-landing [data-reveal]"
      );


    const revealObserver =
      new IntersectionObserver(
        (entries) => {
          entries.forEach(
            (entry) => {
              if (
                entry.isIntersecting
              ) {
                entry.target.classList.add(
                  "is-visible"
                );
              }
            }
          );
        },
        {
          threshold: 0.15,
        }
      );


    revealElements.forEach(
      (element) =>
        revealObserver.observe(
          element
        )
    );


    return () =>
      revealObserver.disconnect();
  }, []);


  function scrollToPrototype() {
    prototypeRef.current?.scrollIntoView(
      {
        behavior:
          "smooth",
      }
    );
  }


  return (
    <div className="cg-minimal-landing">

      <style>{`
        .cg-trap-hero-wrap {
          overflow: visible;
        }

        .cg-bug-layer {
          position: absolute;
          inset: 0;
          z-index: 8;
          overflow: visible;
          pointer-events: none;
        }

        .cg-fly::after {
          opacity: var(--trail-opacity, 0) !important;
          transition: opacity 260ms ease;
        }
      `}</style>

      <header className="cg-minimal-nav">

        <button
          type="button"
          className="cg-logo-button"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior:
                "smooth",
            })
          }
          aria-label="CitraGuard Sentinel home"
        >
          <img
            src={`${ASSET_ROOT}/citraguard-logo.png`}
            alt=""
          />

          <span className="cg-logo-wordmark">
            <strong>
              CitraGuard
            </strong>

            <small>
              SENTINEL
            </small>
          </span>

        </button>


        <div className="cg-minimal-nav-actions">

          <button
            type="button"
            className="cg-nav-text-button"
            onClick={
              scrollToPrototype
            }
          >
            Prototype
          </button>

          <button
            type="button"
            className="cg-enter-button cg-enter-button-small"
            onClick={
              onEnter
            }
          >
            Enter platform
            <span>
              ↗
            </span>
          </button>

        </div>

      </header>


      <main>

        <section className="cg-minimal-hero">

          <div
            className="cg-hero-text"
            data-reveal
          >

            <div className="cg-overline">
              CITRUS SURVEILLANCE · FIELD TECHNOLOGY
            </div>


            <h1>
              Field surveillance,
              <br />

              <em>
                made visible.
              </em>
            </h1>


            <p>
              CitraGuard Sentinel is a
              low-cost monitoring concept
              built around Asian citrus
              psyllid surveillance: one
              physical monitoring point,
              repeatable observations, and
              a geographic record that
              grows over time.
            </p>


            <div className="cg-hero-actions">

              <button
                type="button"
                className="cg-enter-button"
                onClick={
                  onEnter
                }
              >
                Enter CitraGuard
                <span>
                  →
                </span>
              </button>


              <button
                type="button"
                className="cg-outline-button"
                onClick={
                  scrollToPrototype
                }
              >
                View prototype
              </button>

            </div>

          </div>


          <div
            className="cg-hero-product"
            data-reveal
          >

            <div className="cg-product-halo" />

            <img
              className="cg-hero-device"
              src={`${ASSET_ROOT}/sentinel-full.png`}
              alt="CitraGuard Sentinel full prototype model"
            />


            <div className="cg-hero-spec cg-hero-spec-one">
              <span>
                HARDWARE TARGET
              </span>

              <strong>
                ≤ $150
              </strong>
            </div>


            <div className="cg-hero-spec cg-hero-spec-two">
              <span>
                IMAGING
              </span>

              <strong>
                OV5640 · 5 MP
              </strong>
            </div>

          </div>

        </section>


        <section
          ref={prototypeRef}
          className="cg-hardware-story"
        >

          <div className="cg-hardware-row media-left">

            <div
              className="cg-hardware-media"
              data-reveal
            >

              <div
                ref={trapWrapRef}
                className="cg-trap-hero-wrap"
              >

                <img
                  ref={trapImageRef}
                  src={`${ASSET_ROOT}/sentinel-front.png`}
                  alt="Forward-facing CitraGuard Sentinel sticky-card view"
                  className="cg-hardware-image cg-media-trap"
                />

                <FlyingBugs
                  trapImageRef={
                    trapImageRef
                  }
                  trapWrapRef={
                    trapWrapRef
                  }
                />

              </div>

            </div>


            <div
              className="cg-hardware-copy"
              data-reveal
            >

              <div className="cg-section-number">
                01 · CONTINUOUS FIELD EXPOSURE
              </div>

              <h2>
                A simple yellow surface
                becomes a repeatable
                monitoring point.
              </h2>

              <p>
                The sticky card remains
                exposed in the field while
                CitraGuard schedules image
                capture around the monitoring
                protocol. The trap is the
                observation surface; the
                camera interval only changes
                how often that surface is
                photographed.
              </p>

            </div>

          </div>


          <div className="cg-hardware-row media-right">

            <div
              className="cg-hardware-copy"
              data-reveal
            >

              <div className="cg-section-number">
                02 · FIELD CONTEXT
              </div>

              <h2>
                The observation keeps its
                environmental context.
              </h2>

              <p>
                The proposed Sentinel
                records temperature and
                humidity with the SHT30 and
                ambient light with the
                VEML7700. These measurements
                provide field context without
                being used as unvalidated
                disease-risk weights.
              </p>

            </div>


            <div
              className="cg-hardware-media"
              data-reveal
            >

              <div className="cg-sensor-composition">

                <div className="cg-sensor-piece cg-sensor-piece-one">
                  <img
                    src={`${ASSET_ROOT}/humidity-sensor.png`}
                    alt="SHT30 temperature and humidity sensor"
                    className="cg-hardware-image"
                  />

                  <span>
                    SHT30
                  </span>
                </div>


                <div className="cg-sensor-piece cg-sensor-piece-two">
                  <img
                    src={`${ASSET_ROOT}/light-sensor.png`}
                    alt="VEML7700 ambient light sensor"
                    className="cg-hardware-image"
                  />

                  <span>
                    VEML7700
                  </span>
                </div>

              </div>

            </div>

          </div>


          <div className="cg-hardware-row media-left">

            <div
              className="cg-hardware-media"
              data-reveal
            >

              <div className="cg-compute-composition">

                <img
                  src={`${ASSET_ROOT}/sentinel-interior.png`}
                  alt="Interior of the CitraGuard Sentinel"
                  className="cg-hardware-image cg-interior-image"
                />

                <img
                  src={`${ASSET_ROOT}/banana-pi.png`}
                  alt="Banana Pi M2 Zero inside the CitraGuard Sentinel"
                  className="cg-hardware-image cg-board-image"
                />

              </div>

            </div>


            <div
              className="cg-hardware-copy"
              data-reveal
            >

              <div className="cg-section-number">
                03 · EDGE HARDWARE
              </div>

              <h2>
                Processing and storage stay
                with the device concept.
              </h2>

              <p>
                The Banana Pi M2 Zero is the
                planned edge computer for
                capture scheduling, local
                storage, sensor management,
                and future computer-vision
                inference.
              </p>

            </div>

          </div>


          <div className="cg-hardware-row media-right">

            <div
              className="cg-hardware-copy"
              data-reveal
            >

              <div className="cg-section-number">
                04 · CONTROLLED IMAGING
              </div>

              <h2>
                The camera and wing are
                designed around one job: a
                consistent view of the trap.
              </h2>

              <p>
                The OV5640 camera is
                positioned to image the
                sticky surface. The side
                wing helps control stray
                light around the imaging
                area while preserving access
                to the replaceable card.
              </p>

            </div>


            <div
              className="cg-hardware-media"
              data-reveal
            >

              <div className="cg-camera-wing-wrap">

                <img
                  src={`${ASSET_ROOT}/camera.png`}
                  alt="OV5640 camera"
                  className="cg-hardware-image cg-camera-image"
                />

                <img
                  src={`${ASSET_ROOT}/wing.png`}
                  alt="CitraGuard imaging wing"
                  className="cg-hardware-image cg-wing-image"
                />

              </div>

            </div>

          </div>

        </section>


        <section className="cg-field-to-insight">

          <div
            className="cg-section-heading"
            data-reveal
          >

            <div className="cg-overline">
              FROM FIELD TO INSIGHT
            </div>

            <h2>
              One observation becomes useful
              when it keeps its context.
            </h2>

          </div>


          <div className="cg-flow-line">

            <article
              className="cg-flow-step"
              data-reveal
            >

              <span className="cg-flow-number">
                01
              </span>

              <div className="cg-flow-visual cg-flow-visual-device">
                <img
                  src={`${ASSET_ROOT}/sentinel-full.png`}
                  alt="CitraGuard Sentinel deployment"
                />
              </div>

              <h3>
                Deploy
              </h3>

              <p>
                Select a monitoring point
                and define the exposure
                window.
              </p>

            </article>


            <article
              className="cg-flow-step"
              data-reveal
            >

              <span className="cg-flow-number">
                02
              </span>

              <div className="cg-flow-visual">
                <img
                  src={`${ASSET_ROOT}/trap-camera-view.png`}
                  alt="Camera view of the CitraGuard sticky card"
                />
              </div>

              <h3>
                Capture
              </h3>

              <p>
                Scheduled images document
                the continuously exposed
                sticky surface.
              </p>

            </article>


            <article
              className="cg-flow-step"
              data-reveal
            >

              <span className="cg-flow-number">
                03
              </span>

              <div className="cg-flow-visual cg-flow-visual-psyllid">
                <img
                  src={`${ASSET_ROOT}/psyllid.png`}
                  alt="Asian citrus psyllid"
                />
              </div>

              <h3>
                Detect
              </h3>

              <p>
                The vision workflow is
                designed to distinguish
                Asian citrus psyllids from
                the trap image.
              </p>

            </article>


            <article
              className="cg-flow-step"
              data-reveal
            >

              <span className="cg-flow-number">
                04
              </span>

              <div className="cg-flow-visual cg-flow-visual-map">
                <img
                  src={`${ASSET_ROOT}/heatmap.png`}
                  alt="CitraGuard monitoring heat map"
                />
              </div>

              <h3>
                Map
              </h3>

              <p>
                Location, exposure, and
                history become an area-level
                monitoring picture.
              </p>

            </article>

          </div>

        </section>


        <section className="cg-expert-section">

          <div
            className="cg-section-heading cg-expert-heading"
            data-reveal
          >

            <div className="cg-overline">
              SCIENTIFIC CONTEXT
            </div>

            <h2>
              Built with direct guidance
              and informed by citrus pest
              expertise.
            </h2>

          </div>


          <div className="cg-expert-list">

            {EXPERTS.map(
              (expert) => (
                <article
                  key={
                    expert.name
                  }
                  className="cg-expert-row"
                  data-reveal
                >

                  <div>
                    <span>
                      {expert.relationship}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {expert.name}
                    </strong>

                    <small>
                      {expert.organization}
                    </small>
                  </div>

                  <p>
                    {expert.note}
                  </p>

                </article>
              )
            )}

          </div>

        </section>


        <section className="cg-final-entry">

          <div
            data-reveal
          >

            <div className="cg-overline">
              THE WORKING PROTOTYPE
            </div>

            <h2>
              See the surveillance system
              behind the Sentinel.
            </h2>

            <p>
              Open the map, configure a
              monitoring deployment, review
              observations, and explore the
              prototype analytics workflow.
            </p>

            <button
              type="button"
              className="cg-enter-button cg-final-enter-button"
              onClick={
                onEnter
              }
            >
              Enter CitraGuard
              <span>
                →
              </span>
            </button>

          </div>

        </section>

      </main>


      <footer className="cg-minimal-footer">

        <span>
          CitraGuard Sentinel
        </span>

        <span>
          Prototype surveillance platform
        </span>

      </footer>

    </div>
  );
}


export default LandingPage;
