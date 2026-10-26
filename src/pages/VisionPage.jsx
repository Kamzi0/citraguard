import {
  useEffect,
  useRef,
  useState,
} from "react";

import "../vision.css";


const VISION_API_URL =
  import.meta.env.VITE_VISION_API_URL ??
  "http://127.0.0.1:8000";


function VisionPage() {
  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);


  const [
    previewUrl,
    setPreviewUrl,
  ] = useState(null);


  const [
    imageDimensions,
    setImageDimensions,
  ] = useState(null);


  const [
    backendStatus,
    setBackendStatus,
  ] = useState({
    loading: true,
    online: false,
    modelLoaded: false,
    modelName: "YOLO11n",
    message:
      "Checking CitraGuard Vision backend…",
  });


  const [
    analysisStatus,
    setAnalysisStatus,
  ] = useState("idle");


  const [
    analysisResult,
    setAnalysisResult,
  ] = useState(null);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const fileInputRef =
    useRef(null);


  useEffect(() => {
    let cancelled =
      false;


    async function checkBackend() {
      try {
        const response =
          await fetch(
            `${VISION_API_URL}/health`
          );


        if (!response.ok) {
          throw new Error(
            "Vision backend returned an error."
          );
        }


        const result =
          await response.json();


        if (cancelled) {
          return;
        }


        setBackendStatus({
          loading: false,
          online: true,
          modelLoaded:
            Boolean(
              result.model_loaded
            ),
          modelName:
            result.model_name ??
            "YOLO11n",
          message:
            result.model_loaded
              ? "YOLO11 model ready."
              : "Backend online. Model weights are not loaded yet.",
        });
      } catch {
        if (cancelled) {
          return;
        }


        setBackendStatus({
          loading: false,
          online: false,
          modelLoaded: false,
          modelName:
            "YOLO11n",
          message:
            "Vision backend is offline.",
        });
      }
    }


    checkBackend();


    return () => {
      cancelled =
        true;
    };
  }, []);


  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [
    previewUrl,
  ]);


  function resetAnalysis() {
    setAnalysisStatus(
      "idle"
    );

    setAnalysisResult(
      null
    );

    setErrorMessage(
      ""
    );
  }


  function handleFileSelected(
    event
  ) {
    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setErrorMessage(
        "Please choose a valid image file."
      );

      return;
    }


    if (
      file.size >
      12 *
        1024 *
        1024
    ) {
      setErrorMessage(
        "Please choose an image smaller than 12 MB."
      );

      return;
    }


    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }


    const nextPreviewUrl =
      URL.createObjectURL(
        file
      );


    setSelectedFile(
      file
    );

    setPreviewUrl(
      nextPreviewUrl
    );

    setImageDimensions(
      null
    );

    resetAnalysis();
  }


  function handleImageLoaded(
    event
  ) {
    setImageDimensions({
      width:
        event.currentTarget
          .naturalWidth,

      height:
        event.currentTarget
          .naturalHeight,
    });
  }


  function handleChooseAnotherImage() {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }


    setSelectedFile(
      null
    );

    setPreviewUrl(
      null
    );

    setImageDimensions(
      null
    );

    resetAnalysis();


    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  }


  async function handleAnalyze() {
    if (
      !selectedFile ||
      analysisStatus ===
        "running"
    ) {
      return;
    }


    if (
      !backendStatus.online
    ) {
      setErrorMessage(
        "CitraGuard Vision backend is not running. Start the FastAPI server, then try again."
      );

      return;
    }


    if (
      !backendStatus.modelLoaded
    ) {
      setErrorMessage(
        "The backend is running, but the trained YOLO11 weights are missing. Train the model first or place citraguard-yolo11n.pt in vision_backend/models/."
      );

      return;
    }


    setAnalysisStatus(
      "running"
    );

    setAnalysisResult(
      null
    );

    setErrorMessage(
      ""
    );


    const formData =
      new FormData();


    formData.append(
      "image",
      selectedFile
    );


    try {
      const response =
        await fetch(
          `${VISION_API_URL}/predict`,
          {
            method:
              "POST",

            body:
              formData,
          }
        );


      const payload =
        await response.json();


      if (!response.ok) {
        throw new Error(
          payload.detail ??
            "CitraGuard Vision could not analyze this image."
        );
      }


      setAnalysisResult(
        payload
      );

      setAnalysisStatus(
        "complete"
      );
    } catch (
      error
    ) {
      setAnalysisStatus(
        "error"
      );

      setErrorMessage(
        error?.message ??
          "CitraGuard Vision could not analyze this image."
      );
    }
  }


  const resultWidth =
    analysisResult?.image_width ??
    imageDimensions?.width ??
    null;


  const resultHeight =
    analysisResult?.image_height ??
    imageDimensions?.height ??
    null;


  return (
    <div className="vision-v2-page">

      <div className="vision-v2-header">

        <div>

          <div className="page-eyebrow">
            CITRAGUARD VISION
          </div>

          <h1>
            ACP Image Detection
          </h1>

          <p>
            Upload a yellow sticky-trap
            image and run the experimental
            YOLO11n detector for Asian
            citrus psyllid observations.
          </p>

        </div>


        <div
          className={`vision-v2-model-status ${
            backendStatus.online &&
            backendStatus.modelLoaded
              ? "is-ready"
              : "is-pending"
          }`}
        >

          <span />

          <div>
            <strong>
              {backendStatus.modelName}
            </strong>

            <small>
              {backendStatus.message}
            </small>
          </div>

        </div>

      </div>


      <div className="vision-v2-disclosure">

        <strong>
          Experimental model:
        </strong>{" "}

        This detector is a prototype
        fine-tuned on the currently
        available CitraGuard training
        dataset. Its ACP-positive image
        diversity is limited, so detections
        should be treated as demonstration
        output rather than field-validated
        identification.

      </div>


      <div className="vision-v2-grid">

        <section className="vision-v2-card">

          <div className="vision-v2-card-heading">

            <div>

              <span>
                01 · INPUT
              </span>

              <h2>
                Sticky-Trap Image
              </h2>

            </div>

          </div>


          {!previewUrl ? (

            <label className="vision-v2-dropzone">

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/*"
                onChange={
                  handleFileSelected
                }
              />

              <div className="vision-v2-upload-icon">
                +
              </div>

              <strong>
                Choose a sticky-trap image
              </strong>

              <span>
                JPG, PNG, or WEBP · maximum 12 MB
              </span>

            </label>

          ) : (

            <div>

              <div className="vision-v2-image-stage">

                <img
                  src={
                    previewUrl
                  }
                  alt="Uploaded sticky trap"
                  onLoad={
                    handleImageLoaded
                  }
                />


                {analysisResult &&
                  resultWidth &&
                  resultHeight &&
                  analysisResult.detections.map(
                    (
                      detection,
                      index
                    ) => {
                      const left =
                        (
                          detection.x1 /
                          resultWidth
                        ) *
                        100;


                      const top =
                        (
                          detection.y1 /
                          resultHeight
                        ) *
                        100;


                      const width =
                        (
                          (
                            detection.x2 -
                            detection.x1
                          ) /
                          resultWidth
                        ) *
                        100;


                      const height =
                        (
                          (
                            detection.y2 -
                            detection.y1
                          ) /
                          resultHeight
                        ) *
                        100;


                      return (
                        <div
                          key={
                            `${detection.x1}-${detection.y1}-${index}`
                          }
                          className="vision-v2-box"
                          style={{
                            left:
                              `${left}%`,

                            top:
                              `${top}%`,

                            width:
                              `${width}%`,

                            height:
                              `${height}%`,
                          }}
                        >
                          <span>
                            ACP{" "}
                            {Math.round(
                              detection.confidence *
                                100
                            )}
                            %
                          </span>
                        </div>
                      );
                    }
                  )}

              </div>


              <div className="vision-v2-file-meta">

                <div>
                  <span>
                    File
                  </span>

                  <strong>
                    {selectedFile?.name}
                  </strong>
                </div>


                <div>
                  <span>
                    Resolution
                  </span>

                  <strong>
                    {imageDimensions
                      ? `${imageDimensions.width} × ${imageDimensions.height}`
                      : "Loading…"}
                  </strong>
                </div>


                <div>
                  <span>
                    Size
                  </span>

                  <strong>
                    {selectedFile
                      ? `${(
                          selectedFile.size /
                          1024 /
                          1024
                        ).toFixed(
                          2
                        )} MB`
                      : "—"}
                  </strong>
                </div>

              </div>


              <div className="vision-v2-input-actions">

                <button
                  type="button"
                  className="vision-v2-secondary-button"
                  onClick={
                    handleChooseAnotherImage
                  }
                >
                  Choose Another
                </button>


                <button
                  type="button"
                  className="vision-v2-primary-button"
                  onClick={
                    handleAnalyze
                  }
                  disabled={
                    analysisStatus ===
                      "running"
                  }
                >
                  {analysisStatus ===
                  "running"
                    ? "Analyzing…"
                    : "Analyze with YOLO11"}
                </button>

              </div>

            </div>

          )}

        </section>


        <section className="vision-v2-card">

          <div className="vision-v2-card-heading">

            <div>

              <span>
                02 · RESULT
              </span>

              <h2>
                Detection Summary
              </h2>

            </div>

          </div>


          {!analysisResult ? (

            <div className="vision-v2-empty-result">

              <strong>
                No analysis yet
              </strong>

              <p>
                Upload an image and run
                CitraGuard Vision. Bounding
                boxes will appear directly
                on the uploaded image.
              </p>

            </div>

          ) : (

            <div className="vision-v2-result">

              <div className="vision-v2-count">

                <span>
                  DETECTED ACP
                </span>

                <strong>
                  {analysisResult.count}
                </strong>

                <small>
                  Asian citrus psyllid detections
                </small>

              </div>


              <div className="vision-v2-result-grid">

                <div>
                  <span>
                    Model
                  </span>

                  <strong>
                    {analysisResult.model_name}
                  </strong>
                </div>


                <div>
                  <span>
                    Confidence threshold
                  </span>

                  <strong>
                    {Math.round(
                      analysisResult.confidence_threshold *
                        100
                    )}
                    %
                  </strong>
                </div>


                <div>
                  <span>
                    Input size
                  </span>

                  <strong>
                    {analysisResult.inference_size}px
                  </strong>
                </div>


                <div>
                  <span>
                    Target class
                  </span>

                  <strong>
                    {analysisResult.target_class}
                  </strong>
                </div>

              </div>


              <div className="vision-v2-detection-list">

                <div className="vision-v2-list-heading">
                  Individual detections
                </div>


                {analysisResult.detections.length ===
                0 ? (

                  <div className="vision-v2-zero">
                    No ACP detections exceeded
                    the current confidence
                    threshold.
                  </div>

                ) : (

                  analysisResult.detections.map(
                    (
                      detection,
                      index
                    ) => (
                      <div
                        key={
                          `${detection.x1}-${detection.y1}-${index}`
                        }
                        className="vision-v2-detection-row"
                      >

                        <span>
                          ACP {index + 1}
                        </span>

                        <strong>
                          {Math.round(
                            detection.confidence *
                              100
                          )}
                          % confidence
                        </strong>

                      </div>
                    )
                  )

                )}

              </div>

            </div>

          )}


          {errorMessage && (
            <div className="vision-v2-error">
              {errorMessage}
            </div>
          )}

        </section>

      </div>


      <section className="vision-v2-method">

        <div>

          <span>
            MODEL PIPELINE
          </span>

          <h2>
            Raw image → YOLO11n → ACP boxes → count
          </h2>

        </div>


        <div className="vision-v2-method-flow">

          <div>
            <strong>
              1
            </strong>
            <span>
              Upload original image
            </span>
          </div>

          <i>
            →
          </i>

          <div>
            <strong>
              2
            </strong>
            <span>
              YOLO11 inference
            </span>
          </div>

          <i>
            →
          </i>

          <div>
            <strong>
              3
            </strong>
            <span>
              Filter ACP detections
            </span>
          </div>

          <i>
            →
          </i>

          <div>
            <strong>
              4
            </strong>
            <span>
              Draw boxes + count
            </span>
          </div>

        </div>

      </section>

    </div>
  );
}


export default VisionPage;
