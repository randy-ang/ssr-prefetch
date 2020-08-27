import { useState, useContext, useMemo, useEffect } from "react";
import { DataContext } from "../shared/context";

const defaultParams = {};
const defaultInitialValue = {};

function usePrefetch(
  prefetchFunctions = {},
  {
    params = defaultParams,
    defaultValue,
    initialValue = defaultInitialValue,
    lazy = false,
  } = {}
) {
  let { data: contextData, requests } = useContext(DataContext);

  const initialState = useMemo(() => {
    return Object.keys(prefetchFunctions).reduce((total, currentKey) => {
      const { [currentKey]: currentData = {} } = contextData;
      return {
        ...total,
        [currentKey]: {
          data: currentData.data || initialValue[currentKey] || defaultValue,
          loading: !lazy && !currentData.data,
          error: null,
        },
      };
    }, {});
  }, [prefetchFunctions]);
  const [data, setData] = useState(initialState);

  useEffect(() => {
    // setting refetch function, called only at first call
    setData((data) => {
      return Object.keys(data).reduce((newData, key) => {
        newData[key].refetch = async (...params) => {
          setData((data) => {
            const { [key]: currentValue = {} } = data;
            return {
              ...data,
              [key]: {
                ...currentValue,
                loading: true,
              },
            };
          });
          const result = await prefetchFunctions[key](...(params[key] || []))
            .then((data) => ({ data }))
            .catch((error) => ({ error }));
          result.loading = false;
          setData((data) => {
            return { ...data, [key]: result };
          });
        };
        return newData;
      }, data);
    });
  }, [prefetchFunctions]);

  useEffect(() => {
    // refetching function client-side that failed during server-side
    // called only once
    Object.keys(initialState)
      .filter((key) => initialState[key].loading)
      .forEach(async (key) => {
        const result = await prefetchFunctions[key](...(params[key] || []))
          .then((data) => ({ data }))
          .catch((error) => ({ error }));
        result.loading = false;
        setData((data) => {
          const { [key]: currentValue = {} } = data;
          return { ...data, [key]: { ...currentValue, ...result } };
        });
      });
  }, [initialState, prefetchFunctions]);

  // for ssr prefetching
  if (requests) {
    requests.push(
      ...Object.keys(prefetchFunctions)
        .filter((key) => !lazy && !contextData[key])
        .map((key) =>
          prefetchFunctions[key](...(params[key] || []))
            .then((data) => (contextData[key] = { data }))
            .catch(() => (contextData[key] = {}))
        )
    );
  }

  return data;
}

export default usePrefetch;
