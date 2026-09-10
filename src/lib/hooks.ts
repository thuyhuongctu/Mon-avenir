import { useEffect, useState } from "react";
import { usePlanner } from "./store";

export function useNow(ms = 20000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function usePlannerHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const api = usePlanner.persist;
    if (!api) {
      setHydrated(true);
      return;
    }
    void api.rehydrate();
    if (api.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return api.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
