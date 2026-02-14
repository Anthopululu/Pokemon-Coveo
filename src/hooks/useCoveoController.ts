import { useEffect, useState, useRef } from "react";

/**
 * Thin wrapper around Coveo Headless controllers.
 * Subscribes to state changes and returns the latest state.
 */
export function useCoveoController<S>(controller: { state: S; subscribe: (cb: () => void) => () => void }) {
  const ref = useRef(controller);
  const [state, setState] = useState<S>(ref.current.state);

  useEffect(() => {
    const unsub = ref.current.subscribe(() => setState(ref.current.state));
    return unsub;
  }, []);

  return { controller: ref.current, state };
}
