import { useEffect, useCallback, useRef } from "react";
import type { RefObject } from "react";

type KeyCombination = string | string[];
type Handler = () => void;

interface UseHotkeysOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  target?: RefObject<HTMLElement>;
}

export function useHotkeys(
  keys: KeyCombination,
  handler: Handler,
  options: UseHotkeysOptions = {}
): void {
  const { enabled = true, preventDefault = false, target } = options;
  const handlerRef = useRef(handler);
  const keysRef = useRef(keys);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    keysRef.current = keys;
  }, [keys]);

  const handleKeyDown = useCallback((event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    
    if (!enabled) return;

    const keyArray = Array.isArray(keysRef.current)
      ? keysRef.current
      : [keysRef.current];

    const isMatch = keyArray.some((key) => {
      const keyParts = key.toLowerCase().split("+");
      const modifiers = keyParts.slice(0, -1);
      const mainKey = keyParts[keyParts.length - 1];

      const isCtrl = modifiers.includes("ctrl") || modifiers.includes("control");
      const isAlt = modifiers.includes("alt");
      const isShift = modifiers.includes("shift");
      const isMeta = modifiers.includes("meta") || modifiers.includes("cmd");

      const ctrlMatch = keyboardEvent.ctrlKey === isCtrl || (!isCtrl && !keyboardEvent.ctrlKey);
      const altMatch = keyboardEvent.altKey === isAlt || (!isAlt && !keyboardEvent.altKey);
      const shiftMatch = keyboardEvent.shiftKey === isShift || (!isShift && !keyboardEvent.shiftKey);
      const metaMatch = keyboardEvent.metaKey === isMeta || (!isMeta && !keyboardEvent.metaKey);

      const keyMatch =
        keyboardEvent.key.toLowerCase() === mainKey.toLowerCase() ||
        keyboardEvent.code.toLowerCase() === mainKey.toLowerCase();

      return ctrlMatch && altMatch && shiftMatch && metaMatch && keyMatch;
    });

    if (isMatch) {
      if (preventDefault) {
        event.preventDefault();
      }
      handlerRef.current();
    }
  }, [enabled, preventDefault]);

  useEffect(() => {
    const element = target?.current ?? window;

    element.addEventListener("keydown", handleKeyDown);
    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, target]);
}

export default useHotkeys;
