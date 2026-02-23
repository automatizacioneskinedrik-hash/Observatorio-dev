import type { ReactNode } from "react";

export function MenuItem({
  label, icon, menuOpen, onClick, active,
}: {
  label: string;
  icon: React.ReactNode;
  menuOpen: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      title={label}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "24px 1fr",
        alignItems: "center",
        columnGap: 10,
        padding: "10px 12px",
        borderRadius: "10px",
        color: "var(--kv-text)",
        cursor: "pointer",
        userSelect: "none",
        transition: "background-color 200ms ease, border-color 200ms ease",
        border: active
          ? "1px solid #00A884"   // un poco más luminoso que #008f72
          : "1px solid var(--kv-border)",

        background: active
          ? "rgba(0, 143, 114, 0.18)"  // verde translúcido visible
          : "var(--kv-panel-strong)",

        boxShadow: active
          ? "0 0 0 3px rgba(0, 168, 132, 0.25)"
          : "none",


      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--kv-panel)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--kv-panel-strong)";
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--kv-subtext)",
        }}
      >
        {icon}
      </span>

      <span
        style={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          opacity: menuOpen ? 1 : 0,
          maxWidth: menuOpen ? 200 : 0,
          transform: menuOpen ? "translateX(0px)" : "translateX(-6px)",
          transition:
            "max-width 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 180ms ease, transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
