import {
  NavLink,
  Outlet,
} from "react-router";

import "../app-layout.css";


function MapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
      />

      <circle
        cx="12"
        cy="10"
        r="2.25"
      />
    </svg>
  );
}


function ScansIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="1.8"
      />

      <path
        d="M8.5 8h7M8.5 12h7M8.5 16h4.5"
      />

      <path
        d="m15.5 15 1.3 1.3 2.5-3"
      />
    </svg>
  );
}


function VisionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M3 12s3.4-5 9-5 9 5 9 5-3.4 5-9 5-9-5-9-5Z"
      />

      <circle
        cx="12"
        cy="12"
        r="2.7"
      />

      <path
        d="M4.5 5.5h3M4.5 5.5v3M19.5 5.5h-3M19.5 5.5v3M4.5 18.5h3M4.5 18.5v-3M19.5 18.5h-3M19.5 18.5v-3"
      />
    </svg>
  );
}


function AnalyticsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M5 19V11M10 19V6M15 19v-4M20 19V8"
      />

      <path
        d="M3 19.5h18"
      />
    </svg>
  );
}


function DeviceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="4"
        width="12"
        height="16"
        rx="2.2"
      />

      <circle
        cx="12"
        cy="10"
        r="2.4"
      />

      <path
        d="M9.5 16h5"
      />
    </svg>
  );
}


const NAVIGATION_ITEMS = [
  {
    label:
      "Map",

    to:
      "/",

    end:
      true,

    icon:
      MapIcon,
  },

  {
    label:
      "Scans",

    to:
      "/scans",

    icon:
      ScansIcon,
  },

  {
    label:
      "Vision",

    to:
      "/vision",

    icon:
      VisionIcon,
  },

  {
    label:
      "Analytics",

    to:
      "/analytics",

    icon:
      AnalyticsIcon,
  },

  {
    label:
      "Device",

    to:
      "/device",

    icon:
      DeviceIcon,
  },
];


function NavigationLinks({
  mobile =
    false,
}) {
  return NAVIGATION_ITEMS.map(
    (
      item
    ) => {
      const Icon =
        item.icon;


      return (
        <NavLink
          key={
            item.to
          }
          to={
            item.to
          }
          end={
            item.end
          }
          className={(
            {
              isActive,
            }
          ) =>
            [
              mobile
                ? "cg-mobile-nav-link"
                : "cg-sidebar-nav-link",

              isActive
                ? "is-active"
                : "",
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
          }
        >
          <span className="cg-nav-icon">
            <Icon />
          </span>

          <span className="cg-nav-label">
            {item.label}
          </span>
        </NavLink>
      );
    }
  );
}


function AppLayout() {
  return (
    <div className="cg-app-shell">

      <aside className="cg-app-sidebar">

        <NavLink
          to="/"
          className="cg-brand"
          aria-label="CitraGuard home"
        >
          <img
            src="/citraguard-assets/citraguard-logo.png"
            alt="CitraGuard Sentinel"
            className="cg-brand-logo"
          />
        </NavLink>


        <div className="cg-sidebar-section-label">
          MONITORING
        </div>


        <nav
          className="cg-sidebar-navigation"
          aria-label="Primary navigation"
        >
          <NavigationLinks />
        </nav>


        <div className="cg-prototype-card">

          <div className="cg-prototype-card-heading">

            <span className="cg-status-dot" />

            <strong>
              Prototype Mode
            </strong>

          </div>


          <p>
            Sentinel hardware and
            environmental sensor readings
            are simulated in the current
            application prototype.
          </p>

        </div>

      </aside>


      <div className="cg-app-main">

        <header className="cg-app-topbar">

          <div className="cg-mobile-brand">
            <img
              src="/citraguard-assets/citraguard-logo.png"
              alt="CitraGuard Sentinel"
            />
          </div>


          <div className="cg-demo-badge">

            <span className="cg-status-dot" />

            Demo Mode

          </div>

        </header>


        <main className="cg-app-content">
          <Outlet />
        </main>

      </div>


      <nav
        className="cg-mobile-navigation"
        aria-label="Mobile navigation"
      >
        <NavigationLinks
          mobile
        />
      </nav>

    </div>
  );
}


export default AppLayout;
