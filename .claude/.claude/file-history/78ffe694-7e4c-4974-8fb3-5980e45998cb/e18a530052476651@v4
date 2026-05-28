import { type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, children }: Props) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`bts-overlay ${open ? "bts-overlay-open" : ""}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div className={`bts-sheet ${open ? "bts-sheet-open" : ""}`}>
        {/* Drag handle */}
        <div style={{
          display: "flex", justifyContent: "center", padding: "0.5rem 0 0.25rem",
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: "var(--border)", opacity: .6,
          }} />
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflow: "hidden",
          display: "flex", flexDirection: "column",
          padding: "0.25rem 0.875rem 1rem",
          gap: "0.875rem",
        }}>
          {children}
        </div>
      </div>
    </>
  );
}
