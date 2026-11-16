import { createContext, useContext, useState } from "react";
import { TARGETS_BY_TAB as INITIAL } from "../data/targets";

const TargetsContext = createContext(null);

export function TargetsProvider({ children }) {
  const [targets, setTargets] = useState(INITIAL);

  function addTarget(tab, target) {
    setTargets((prev) => ({
      ...prev,
      [tab]: [...(prev[tab] ?? []), { ...target, id: Date.now() }],
    }));
  }

  function updateTarget(id, changes) {
    setTargets((prev) => {
      const next = {};
      for (const tab of Object.keys(prev)) {
        next[tab] = prev[tab].map((target) =>
          target.id === id ? { ...target, ...changes } : target,
        );
      }
      return next;
    });
  }

  function removeTarget(id) {
    setTargets((prev) => {
      const next = {};
      for (const tab of Object.keys(prev)) {
        next[tab] = prev[tab].filter((t) => t.id !== id);
      }
      return next;
    });
  }

  return (
    <TargetsContext.Provider value={{ targets, addTarget, updateTarget, removeTarget }}>
      {children}
    </TargetsContext.Provider>
  );
}

export function useTargets() {
  return useContext(TargetsContext);
}
