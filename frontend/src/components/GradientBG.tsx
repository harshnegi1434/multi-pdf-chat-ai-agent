import React from "react";

const GradientBG: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <svg
    style={{
      position: "fixed",
      left: 0,
      top: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 0,
      pointerEvents: "none",
    }}
    aria-hidden
  >
    <defs>
      <radialGradient id="g1" cx="50%" cy="30%" r="70%" fx="50%" fy="30%">
        <stop offset="0%" stopColor={dark ? "#1976d2" : "#42a5f5"} stopOpacity="0.25"/>
        <stop offset="100%" stopColor="transparent"/>
      </radialGradient>
    </defs>
    <ellipse cx="55%" cy="25%" rx="320" ry="160" fill="url(#g1)" />
    <ellipse cx="25%" cy="80%" rx="180" ry="80" fill="url(#g1)" />
  </svg>
);

export default GradientBG;