import { useRef } from "react";
import isDeepEqual from "@wry/equality";

export default function useDeepMemo(value) {
  const valueRef = useRef();

  if (!valueRef.current || !isDeepEqual(value, valueRef.current)) {
    valueRef.current = value;
  }

  return valueRef.current;
}
