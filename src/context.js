import React, { createContext } from "react";
import PropTypes from "prop-types";

// This is to ensure hooks and server-side function uses the same context.
// Otherwise, since we split hooks and server-side functions,
// they will each get their data from different contexts (because they are built differently).

// If Symbol's aren't available, we'll use a fallback string as the context
// property (we're looking at you, IE11).
const contextSymbol =
  typeof Symbol === "function" && Symbol.for
    ? Symbol.for("PREFETCH_CONTEXT")
    : "PREFETCH_CONTEXT";

function createPrefetchContext() {
  Object.defineProperty(React, contextSymbol, {
    value: createContext({}),
    enumerable: false,
    configurable: true,
    writable: false,
  });
}

export function getPrefetchContext() {
  if (!React[contextSymbol]) {
    createPrefetchContext();
  }
  return React[contextSymbol];
}

export const PrefetchProvider = ({ data, requests, children }) => {
  const DataContext = getPrefetchContext();
  return (
    <DataContext.Provider value={{ requests, data }}>
      {children}
    </DataContext.Provider>
  );
};

PrefetchProvider.propTypes = {
  data: PropTypes.any,
  requests: PropTypes.arrayOf(
    PropTypes.shape({
      data: PropTypes.any,
    })
  ),
  children: PropTypes.node,
};
