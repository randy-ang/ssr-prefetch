import React, { useEffect } from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import usePrefetch from "../usePrefetch";
import { PrefetchProvider } from "../../context";
import { oneOfType, number, string, node, bool, object } from "prop-types";


const mockNewsStory = "this is a story with id: ";
const mockWeatherStory = "this is a weather with id: ";
const prefetchFunctions = {
  news: jest
    .fn()
    .mockName("mock-prefetch-news")
    .mockImplementation((newsID) =>
      newsID
        ? Promise.resolve({
          story: mockNewsStory + newsID,
        })
        : Promise.reject("no newsID provided")
    ),
};
const loadingComponent = "Loading";
const errorComponent = "Error Occured";
const defaultProps = {
  loadingComponent: loadingComponent,
  errorComponent: errorComponent,
};

describe("usePrefetch behaviour", () => {
  const BaseCmp = ({ loadingComponent, errorComponent, loading, data, error }) => {
    if (loading) return <div>{loadingComponent}</div>;
    if (error) return <div>{errorComponent}</div>;
    return <div>{JSON.stringify(data)}</div>;
  };

  BaseCmp.propTypes = {
    loadingComponent: node.isRequired,
    errorComponent: node.isRequired,
    loading: bool.isRequired,
    data: object,
    error: oneOfType([string, object]),
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('single usePrefetch usage', () => {
    // for rerendering
    const getCmp = (props = {}, initialData = {}) => {

      const Cmp = ({ newsID }) => {
        const params = { news: [newsID] };
        const {
          news,
        } = usePrefetch(prefetchFunctions, { params });
        return <BaseCmp {...news} loadingComponent={loadingComponent} errorComponent={errorComponent} />
      };

      Cmp.propTypes = {
        newsID: oneOfType([number, string]),
      };

      return (
        <PrefetchProvider data={initialData}>
          <Cmp {...defaultProps} {...props} />;
        </PrefetchProvider>
      );
    };

    const setup = (props = {}, initialData = {}) => {
      return render(getCmp(props, initialData));
    };

    describe("testing without initial data", () => {
      it("should start with loading state, then renders data", async () => {
        const props = {
          newsID: 1,
        };
        const { getByText } = setup(props);
        expect(getByText(loadingComponent)).toBeTruthy();
        await waitFor(() => {
          expect(prefetchFunctions.news).toHaveBeenCalledTimes(1);
          expect(getByText(new RegExp(mockNewsStory+props.newsID, 'i'))).toBeTruthy();
        });
      });

      test("rerendering usePrefetch with different params", async () => {
        const props = {
          newsID: 1,
        };
        const { getByText, rerender } = setup(props);
        expect(getByText(loadingComponent)).toBeTruthy();
        await waitFor(() => {
          expect(prefetchFunctions.news).toHaveBeenCalledTimes(1);
          expect(getByText(new RegExp(mockNewsStory+props.newsID, 'i'))).toBeTruthy();
        });

        // test changing params
        const secondProps = {
          newsID: 2,
        };

        rerender(getCmp(secondProps));
        await waitFor(() => {
          expect(prefetchFunctions.news).toHaveBeenCalledTimes(2);
          expect(getByText(new RegExp(mockNewsStory+secondProps.newsID, 'i'))).toBeTruthy();
        });

        // test changing error params
        const errorProps = {};

        rerender(getCmp(errorProps));
        await waitFor(() => {
          expect(prefetchFunctions.news).toHaveBeenCalledTimes(3);
          expect(getByText(new RegExp(errorComponent, 'i'))).toBeTruthy();
        });
      });

      test("render with no data & error when fetching", async () => {
        const props = {};
        const { getByText } = setup(props);

        await waitFor(() => {
          expect(getByText(errorComponent)).toBeTruthy();
        });
      });

      describe("testing with initial data", () => {
        it("should render data without loading", () => {
          const initialNewsData = "some-story";
          const initialData = {
            news: { data: { story: initialNewsData } },
          };

          const props = {};
          const { queryByText, getByText } = setup(props, initialData);
          expect(queryByText(loadingComponent)).toBeNull();
          expect(getByText(new RegExp(initialNewsData, 'i'))).toBeTruthy();
        });
      });
    });
  })

  describe('multiple usePrefetch usage in one component', () => {
    const newsPrefetchFunctions = {
      news: jest
        .fn()
        .mockName("mock-prefetch-news")
        .mockImplementation((newsID) =>
          newsID
            ? Promise.resolve({
              story: mockNewsStory + newsID,
            })
            : Promise.reject("no newsID provided")
        ),
    };
    const weatherPrefetchFunctions = {
      weather: jest
        .fn()
        .mockName("mock-prefetch-weather")
        .mockImplementation((weatherID) =>
          weatherID
            ? Promise.resolve({
              story: mockWeatherStory + weatherID,
            })
            : Promise.reject("no weatherID provided")
        ),
    };
    describe('multiple usePrefetch in one component', () => {
      const newsLoader = 'news' + loadingComponent;
      const newsError = 'news' + errorComponent;
      const weatherLoader = 'weather' + loadingComponent;
      const weatherError = 'weather' + errorComponent;
      const getCmp = (props = {}, initialData = {}) => {
        const Cmp = ({ newsID, weatherID }) => {
          const newsParams = { news: [newsID] };
          const weatherParams = { weather: [weatherID] };
          const {
            news,
          } = usePrefetch(newsPrefetchFunctions, { params: newsParams });
          const {
            weather,
          } = usePrefetch(weatherPrefetchFunctions, { params: weatherParams });
          return (<div>
            <BaseCmp {...news} loadingComponent={newsLoader} errorComponent={newsError} />
            <BaseCmp {...weather} loadingComponent={weatherLoader} errorComponent={weatherError} />
          </div>)
        };

        Cmp.propTypes = {
          newsID: oneOfType([number, string]),
          weatherID: oneOfType([number, string]),
        };

        return (
          <PrefetchProvider data={initialData}>
            <Cmp {...defaultProps} {...props} />;
          </PrefetchProvider>
        );
      }

      const setup = (props = {}, initialData = {}) => {
        return render(getCmp(props, initialData));
      }

      describe("testing without initial data", () => {
        it("should start with loading state, then renders data", async () => {
          const props = {
            newsID: 1,
            weatherID: 2,
          };

          const { getByText } = setup(props);
          expect(getByText(new RegExp(newsLoader, 'i'))).toBeTruthy();
          expect(getByText(new RegExp(weatherLoader, 'i'))).toBeTruthy();
          await waitFor(() => {
            expect(weatherPrefetchFunctions.weather).toHaveBeenCalledTimes(1);
            expect(newsPrefetchFunctions.news).toHaveBeenCalledTimes(1);
            expect(getByText(new RegExp(mockNewsStory + props.newsID, 'i'))).toBeTruthy();
            expect(getByText(new RegExp(mockWeatherStory + props.weatherID, 'i'))).toBeTruthy();
          });
        });

        it("should render both success & error fetch", async () => {
          const props = {
            weatherID: 5,
          };
          const { getByText } = setup(props);
          await waitFor(() => {
            expect(weatherPrefetchFunctions.weather).toHaveBeenCalledTimes(1);
            expect(newsPrefetchFunctions.news).toHaveBeenCalledTimes(1);
            expect(getByText(new RegExp(newsError, 'i'))).toBeTruthy();
            expect(getByText(new RegExp(mockWeatherStory + props.weatherID, 'i'))).toBeTruthy();
          });
        });

        describe("testing with initial data", () => {
          it("should render data without loading", async () => {
            const initialNewsData = "some-story";
            const initialData = {
              news: { data: { story: initialNewsData } },
              weather: { data: { story: mockWeatherStory + 1 } },
            };

            const props = {};
            const { queryByText, getByText } = setup(props, initialData);
            expect(queryByText(new RegExp(newsLoader, 'i'))).toBeNull();
            expect(queryByText(new RegExp(weatherLoader, 'i'))).toBeNull();
            expect(getByText(new RegExp(initialNewsData, 'i'))).toBeTruthy();
            expect(getByText(new RegExp(mockWeatherStory + 1, 'i'))).toBeTruthy();

            await waitFor(() => {
              expect(weatherPrefetchFunctions.weather).not.toHaveBeenCalled();
              expect(newsPrefetchFunctions.news).not.toHaveBeenCalled();
            })
          });
        });
      });
    })
  })
});


// TODO: refetch is still a bit buggy
describe.skip("refetching behaviour", () => {
  const refetchID = "refetchID";
  const customNoTextPlaceholder = "some-customNoTextPlaceholder";
  // for rerendering
  const getCmp = (props = {}, initialData = {}) => {
    const Cmp = ({ newsID }) => {
      const params = { news: [newsID] };
      const {
        news: { data, loading, error, refetch },
      } = usePrefetch(prefetchFunctions, { params, lazy: true });
      useEffect(() => {
        if (refetch) refetch(newsID);
      }, [refetch, newsID]);
      if (loading) return <div>{loadingComponent}</div>;
      if (error) return <div>{errorComponent}</div>;
      return (
        <div>
          {data?.story || (
            <div id={refetchID} onClick={() => refetch && refetch(newsID)}>
              {customNoTextPlaceholder}
            </div>
          )}
        </div>
      );
    };

    Cmp.propTypes = {
      newsID: oneOfType([number, string]),
    };

    return (
      <PrefetchProvider data={initialData}>
        <Cmp {...defaultProps} {...props} />;
      </PrefetchProvider>
    );
  };

  const setup = (props = {}, initialData = {}) => {
    return render(getCmp(props, initialData));
  };

  beforeEach(() => {
    prefetchFunctions.news.mockClear();
  });

  it("should render correctly", async () => {
    const props = {
      newsID: 1,
    };
    const { getByText, container } = setup(props);

    expect(getByText(customNoTextPlaceholder)).toBeTruthy();

    await waitFor(
      () => {
        const refetchBtn = container.querySelector(`#${refetchID}`);
        fireEvent.click(refetchBtn);
        expect(getByText(loadingComponent)).toBeTruthy();
      },
      { timeout: 3000 }
    );

    // await waitFor(() => {
    //   expect(getByText(mockNewsStory + props.newsID)).toBeTruthy();
    // });
  });
});
