import { useCallback, useRef, useState } from "react";

import { continueComposerPathTrigger } from "@t3tools/shared/composerTrigger";
import { detectComposerTrigger, type ComposerTrigger } from "../../composer-logic";

/** Keep a dismissed suggestion closed until the caret leaves its token. */
export function useComposerTriggerState(initialTrigger: () => ComposerTrigger | null) {
  const [trigger, setActiveTrigger] = useState(initialTrigger);
  const previousTriggerRef = useRef(trigger);
  const dismissedTriggerRef = useRef<ComposerTrigger | null>(null);

  const detectTrigger = useCallback((text: string, cursor: number) => {
    return (
      detectComposerTrigger(text, cursor) ??
      continueComposerPathTrigger(text, cursor, previousTriggerRef.current)
    );
  }, []);

  const resolveTrigger = useCallback((candidate: ComposerTrigger | null) => {
    const dismissed = dismissedTriggerRef.current;
    return candidate &&
      dismissed &&
      candidate.kind === dismissed.kind &&
      candidate.rangeStart === dismissed.rangeStart
      ? null
      : candidate;
  }, []);

  const setTrigger = useCallback(
    (candidate: ComposerTrigger | null) => {
      previousTriggerRef.current = candidate;
      const activeTrigger = resolveTrigger(candidate);
      if (candidate === null || activeTrigger !== null) {
        dismissedTriggerRef.current = null;
      }
      setActiveTrigger(activeTrigger);
    },
    [resolveTrigger],
  );

  const dismissTrigger = useCallback((candidate: ComposerTrigger | null) => {
    dismissedTriggerRef.current = candidate;
    setActiveTrigger(null);
  }, []);

  const resetTrigger = useCallback((candidate: ComposerTrigger | null) => {
    previousTriggerRef.current = candidate;
    dismissedTriggerRef.current = null;
    setActiveTrigger(candidate);
  }, []);

  return { trigger, detectTrigger, setTrigger, resolveTrigger, dismissTrigger, resetTrigger };
}
