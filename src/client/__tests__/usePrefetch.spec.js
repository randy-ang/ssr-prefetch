import React, { useEffect } from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import usePrefetch from "../usePrefetch";
import { PrefetchProvider } from "../../context";
import { oneOfType, number, string } from "prop-types";

const defaultProps = {};

const mockNewsStory = "this is a story with id: ";
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

describe("usePrefetch behaviour", () => {
  // for rerendering
  const getCmp = (props = {}, initialData = {}) => {
    const Cmp = ({ newsID }) => {
      const params = { news: [newsID] };
      const {
        news: { data, loading, error },
      } = usePrefetch(prefetchFunctions, { params });
      if (loading) return <div>{loadingComponent}</div>;
      if (error) return <div>{errorComponent}</div>;
      return <div>{data.story}</div>;
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
  describe("testing without initial data", () => {
    it("should start with loading state, then renders data", async () => {
      const props = {
        newsID: 1,
      };
      const { getByText, rerender } = setup(props);
      expect(getByText(loadingComponent)).toBeTruthy();
      const { story } = await prefetchFunctions.news(props.newsID);
      waitFor(() => {
        expect(getByText(story)).toBeTruthy();
      });

      // test changing params
      const secondProps = {
        newsID: 2,
      };

      rerender(getCmp(secondProps));
      const { story: secondStory } = await prefetchFunctions.news(
        secondProps.newsID
      );
      waitFor(() => {
        expect(getByText(secondStory)).toBeTruthy();
      });

      // test changing error params
      const errorProps = {};

      rerender(getCmp(errorProps));
      waitFor(() => {
        expect(getByText(errorComponent)).toBeTruthy();
      });
    });

    it("should render error", () => {
      const props = {};
      const { getByText } = setup(props);

      waitFor(() => {
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
        expect(getByText(initialNewsData)).toBeTruthy();
      });
    });
  });
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
