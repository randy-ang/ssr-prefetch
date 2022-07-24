import { useState, useContext, useMemo, useEffect, useRef } from "react";
import { getPrefetchContext } from "../context";
import deepEqual from "@wry/equality";

const defaultParams = {};
const defaultInitialValue = {};

function usePrefetch(
  prefetchFunctions,
  {
    params = defaultParams,
    defaultValue,
    initialValue = defaultInitialValue,
    lazy = false,
  } = {}
) {
  let { data: prefetchedData, requests } = useContext(
    getPrefetchContext()
  );
  const memo = useRef();

  const initialState = useMemo(() => {
    return Object.keys(prefetchFunctions).reduce((total, currentKey) => {
      const { [currentKey]: currentData = {} } = prefetchedData || {};
      return {
        ...total,
        [currentKey]: {
          data: currentData.data || initialValue[currentKey] || defaultValue,
          loading: !lazy && !currentData.data,
          error: null,
        },
      };
    }, {});
  }, [prefetchFunctions, defaultValue, initialValue, lazy, prefetchedData]);
  const [data, setData] = useState(initialState);

  useEffect(() => {
    // setting refetch function, called only at first call
    setData((data) => {
      return Object.keys(data).reduce((newData, key) => {
        newData[key].refetch = async () => {
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
          const usedParams = params[key] || [];
          const result = await prefetchFunctions[key](...usedParams)
            .then((data) => ({ data }))
            .catch((error) => ({ error }));
          result.loading = false;
          result.params = usedParams;
          setData((data) => {
            const { [key]: currentValue = {} } = data;
            return { ...data, [key]: { ...currentValue, ...result } };
          });
        };
        return newData;
      }, data);
    });
  }, [prefetchFunctions]);

  const isFirstPrefetch = !memo.current;
  // refetching function client-side that failed during server-side
  // called only once
  useEffect(() => {
    // if memo.current is true, means that this render is not from ssr
    // but from other page, so it will not be called
    if (isFirstPrefetch) {
      for (const key in initialState) {
        if (initialState[key].loading) {
          prefetchFunctions[key](...(params[key] || []))
            .then((data) => ({ data }))
            .catch((error) => ({ error }))
            .then((result) => {
              result.loading = false;
              result.params = params[key];
              setData((data) => {
                const { [key]: currentValue = {} } = data;
                return { ...data, [key]: { ...currentValue, ...result } };
              });
            });
        }
      }

      memo.current = {
        params,
      };
    }
  }, [prefetchFunctions, initialState, params, isFirstPrefetch, memo]);

  useEffect(() => {
    // if new params and functions compared to memoized one,
    // probably means a new function/params, so fetch those first, then memoize them
    if (
      memo.current &&
      !deepEqual(memo.current, { params })
    ) {
      for (const key in prefetchFunctions) {
        prefetchFunctions[key](...(params[key] || []))
          .then((data) => ({ data }))
          .catch((error) => ({ error }))
          .then((result) => {
            result.loading = false;
            setData((data) => {
              const { [key]: currentValue = {} } = data;
              return { ...data, [key]: { ...currentValue, ...result } };
            });
          });
      }

      memo.current = {
        params,
      };
    }
  }, [memo, params, prefetchFunctions]);

  // for ssr prefetching
  if (requests) {
    requests.push(
      ...Object.keys(prefetchFunctions)
        .filter((key) => !lazy && !prefetchedData[key])
        .map((key) => ({
          func: () =>
            prefetchFunctions[key](...(params[key] || []))
              .then((data) => (prefetchedData[key] = { data }))
              .catch(() => (prefetchedData[key] = {})),
        }))
    );
  }

  return data;
}

export default usePrefetch;
