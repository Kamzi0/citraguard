import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import {
  BrowserRouter,
} from "react-router";

import App from "./App.jsx";

import {
  ScanProvider,
} from "./context/ScanContext.jsx";

import "./index.css";


createRoot(
  document.getElementById(
    "root"
  )
).render(
  <StrictMode>
    <ScanProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ScanProvider>
  </StrictMode>
);