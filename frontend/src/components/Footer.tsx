import React from "react";
import { Shield } from "lucide-react";

// This app shell is a fixed h-screen layout (Navbar + scrollable content pane),
// not a scrolling marketing page - so this bar is deliberately compact and
// always-visible, not a footer that scrolls into view. A full multi-column
// link directory here would just sit permanently pinned below the content
// pane and never move, which is confusing in a fixed layout.
export const Footer: React.FC = () => {
  return (
    <footer className="bg-bg-panel border-t border-border w-full font-mono text-[10px] text-text-faint shrink-0 select-none px-5 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shield className="w-3 h-3 text-emerald-500" />
        <span className="font-bold text-text-dim">DRISHTIRAKSHAK AI</span>
      </div>
      <span>Dashcam evidence review console</span>
    </footer>
  );
};