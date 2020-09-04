import React, { createContext, useContext } from "react";

export const DataContext = createContext({});

export const PrefetchProvider = ({ data, requests, children }) => {
  // if parent provider exists, use the topmost value
  const dataContext = useContext(DataContext);
  return (
    <DataContext.Provider value={{ requests, data, ...dataContext }}>
      {children}
    </DataContext.Provider>
  );
};
