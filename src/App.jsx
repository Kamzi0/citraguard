import {
  useState,
} from "react";

import {
  Routes,
  Route,
} from "react-router";

import AppLayout from "./components/AppLayout.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import MapPage from "./pages/MapPage.jsx";
import ScansPage from "./pages/ScansPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import DevicePage from "./pages/DevicePage.jsx";
import VisionPage from "./pages/VisionPage.jsx";
import NewScanPage from "./pages/NewScanPage.jsx";
import ActiveScanPage from "./pages/ActiveScanPage.jsx";
import ScanResultPage from "./pages/ScanResultPage.jsx";
import ScanDetailPage from "./pages/ScanDetailPage.jsx";
import AreaDetailPage from "./pages/AreaDetailPage.jsx";


const INTRO_SESSION_KEY =
  "citraguard-intro-seen-v1";


function App() {
  const [
    showIntro,
    setShowIntro,
  ] = useState(
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return true;
      }


      const parameters =
        new URLSearchParams(
          window.location.search
        );


      /*
        Add ?showcase=1 to any URL when
        you want to replay the landing
        experience during judging.
      */
      if (
        parameters.get(
          "showcase"
        ) ===
        "1"
      ) {
        return true;
      }


      return (
        window.sessionStorage.getItem(
          INTRO_SESSION_KEY
        ) !==
        "true"
      );
    }
  );


  function enterApplication() {
    if (
      typeof window !==
      "undefined"
    ) {
      window.sessionStorage.setItem(
        INTRO_SESSION_KEY,
        "true"
      );


      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }


    setShowIntro(
      false
    );
  }


  if (
    showIntro
  ) {
    return (
      <LandingPage
        onEnter={
          enterApplication
        }
      />
    );
  }


  return (
    <Routes>

      <Route
        element={
          <AppLayout />
        }
      >

        <Route
          path="/"
          element={
            <MapPage />
          }
        />

        <Route
          path="/scans"
          element={
            <ScansPage />
          }
        />

        <Route
          path="/analytics"
          element={
            <AnalyticsPage />
          }
        />

        <Route
          path="/device"
          element={
            <DevicePage />
          }
        />

        <Route
          path="/vision"
          element={
            <VisionPage />
          }
        />

        <Route
          path="/new-scan"
          element={
            <NewScanPage />
          }
        />

        <Route
          path="/active-scan"
          element={
            <ActiveScanPage />
          }
        />

        <Route
          path="/scan-result"
          element={
            <ScanResultPage />
          }
        />

        <Route
          path="/scan-detail/:scanId"
          element={
            <ScanDetailPage />
          }
        />

        <Route
          path="/area/:areaId"
          element={
            <AreaDetailPage />
          }
        />

      </Route>

    </Routes>
  );
}


export default App;
