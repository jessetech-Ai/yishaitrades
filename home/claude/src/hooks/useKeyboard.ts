import { useEffect, useCallback } from "react";

interface KeyboardActions {
  onNewTrade: () => void;
  onSearch: () => void;
  onExport: () => void;
  onHelp: () => void;
  onEscape: () => void;
  onNavigate: (page: string) => void;
}

export const useKeyboard = (actions: KeyboardActions) => {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;

      // Always handle Escape
      if (e.key === "Escape") {
        actions.onEscape();
        return;
      }

      // Only handle shortcuts when NOT in an input
      if (inInput) return;

      // ? = help
      if (e.key === "?") {
        e.preventDefault();
        actions.onHelp();
        return;
      }

      // Ctrl/Cmd combos
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "n":
            e.preventDefault();
            actions.onNewTrade();
            break;
          case "f":
            e.preventDefault();
            actions.onSearch();
            break;
          case "e":
            e.preventDefault();
            actions.onExport();
            break;
        }
        return;
      }

      // Quick nav: g + key
      switch (e.key.toLowerCase()) {
        case "1": actions.onNavigate("dashboard"); break;
        case "2": actions.onNavigate("trades"); break;
        case "3": actions.onNavigate("analytics"); break;
        case "4": actions.onNavigate("calendar"); break;
        case "5": actions.onNavigate("journal"); break;
        case "6": actions.onNavigate("playbook"); break;
        case "7": actions.onNavigate("goals"); break;
        case "8": actions.onNavigate("insights"); break;
        case "9": actions.onNavigate("tools"); break;
      }
    },
    [actions]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
};
