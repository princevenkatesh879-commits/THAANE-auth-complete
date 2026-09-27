import { useEffect, useState } from "react";

type BrandIntroProps = {
  onComplete: () => void;
};

export default function BrandIntro({ onComplete }: BrandIntroProps) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => {
      setClosing(true);
    }, 1000);

    const completeTimer = window.setTimeout(() => {
      onComplete();
    }, 1500);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        width: "100vw",
        height: "100dvh",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: closing ? 0 : 1,
        transition: "opacity 600ms ease",
      }}
    >
      <img
        src="/thaane-logo-black.png"
        alt="THAANE"
        style={{
          display: "block",
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "250px",
          height: "250px",
          maxWidth: "78vw",
          maxHeight: "78vw",
          objectFit: "contain",
          transform: "translate(-50%, -50%) scale(1)",
          opacity: 1,
          animation:
            "thaaneLogoAppear 1200ms cubic-bezier(.16,1,.3,1) forwards",
        }}
      />

      <style>
        {`
          @keyframes thaaneLogoAppear {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.82);
            }

            55% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1.04);
            }

            100% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}
