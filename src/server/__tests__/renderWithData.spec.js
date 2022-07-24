import React from "react";
import usePrefetch from "../../client/usePrefetch";
import { oneOfType, number, string } from "prop-types";
import renderWithData from "../renderWithData";

const mockNewsStory = "this is a story with id: ";
const mockUserData = "some-mockUserData";
const newsPrefetchFunction = {
  news: jest
    .fn()
    .mockName("mock-prefetch-news")
    .mockImplementation((newsID) =>
      newsID
        ? Promise.resolve({
            story: mockNewsStory + newsID,
          })
        : Promise.reject(new Error("no newsID provided"))
    ),
};

const userPrefetchFunction = {
  user: jest
    .fn()
    .mockName("mock-prefetch-story")
    .mockImplementation(() => Promise.resolve(mockUserData)),
};

const testPrefetchFunction = {
  test: jest.fn().mockName("mock-prefetch-test").mockImplementation(() => Promise.resolve("somedata")),
}

const prefetchFunctions = {
  ...newsPrefetchFunction,
  ...userPrefetchFunction,
};
const loadingComponent = "Loading";
const errorComponent = "Error Occured";

const Cmp = ({ newsID }) => {
  const params = { news: [newsID] };
  const {
    news: { data, loading, error },
    user: { data: userData },
  } = usePrefetch(prefetchFunctions, { params });
  if (loading) return <div>{loadingComponent}</div>;
  if (error) return <div>{errorComponent}</div>;
  return <div>news: {data?.story}<br/>user: {JSON.stringify(userData)}</div>;
};

Cmp.propTypes = {
  newsID: oneOfType([number, string]),
};

const MultiplePrefetchCmp = ({ newsID }) => {
  const params = { news: [newsID] };
  const {
    news: { data, loading, error },
  } = usePrefetch(newsPrefetchFunction, { params });
  const {
    user: { data: userData },
  } = usePrefetch(userPrefetchFunction, { params });
  if (loading) return <div>{loadingComponent}</div>;
  if (error) return <div>{errorComponent}</div>;
  return <div>news: {data?.story}<br/>user: {JSON.stringify(userData)}</div>;
};

MultiplePrefetchCmp.propTypes = {
  ...Cmp.propTypes,
}

const NestedCmp = ({ newsID }) => {
  const params = { news: [newsID] };
  const {
    test: { data, loading, error },
  } = usePrefetch(testPrefetchFunction, { params });
  if (loading) return <div>{loadingComponent}</div>;
  if (error) return <div>{errorComponent}</div>;
  return <div>test: {JSON.stringify(data)}<br/><Cmp newsID={newsID} /></div>;
};

NestedCmp.propTypes = {
  ...Cmp.propTypes,
}


const InnerPrefetchCmp = ({ newsID = 5 }) => {
  const params = { news: [newsID] };

  const newsPrefetchFunction = {
    news: (newsID) =>
        newsID
          ? Promise.resolve({
              story: mockNewsStory + newsID,
            })
          : Promise.reject(new Error("no newsID provided"))
  };

  const userPrefetchFunction = {
    user: () => Promise.resolve(mockUserData),
  };

  const {
    news: { data, loading, error },
  } = usePrefetch(newsPrefetchFunction, { params });
  const {
    user: { data: userData, loading: userLoading, error: userError },
  } = usePrefetch(userPrefetchFunction);
  if (loading || userLoading) return <div>{loadingComponent}</div>;
  if (error || userError) return <div>{errorComponent}</div>;
  return <div>news: {data?.story}<br/>user: {JSON.stringify(userData)}</div>;
};

InnerPrefetchCmp.propTypes = {
  ...Cmp.propTypes,
}

beforeEach(() => {
  prefetchFunctions.news.mockClear();
});

describe("render with data behaviour", () => {
  it("should prepopulate requests", () => {
    const newsID = 5;
    const context = { data: {}, requests: [] };
    const App = <Cmp newsID={newsID} />;
    return renderWithData(App, context).then(async (html) => {
      expect(context.requests.length).toStrictEqual(
        Object.keys(prefetchFunctions).length
      );

      // successful prefetch means that html & context data should contain the data
      await prefetchFunctions.user().then((userData) => {
        expect(context.data.user.data).toEqual(userData);
      });

      return prefetchFunctions.news(newsID).then((newsResult) => {
        const { story } = newsResult;
        expect(html).toContain(story);
        expect(context.data.news.data).toEqual(newsResult);
      });
    });
  });

  test("prefetch with error", () => {
    const context = {};
    const App = <Cmp />;
    return renderWithData(App, context).then(async (html) => {
      expect(context.requests.length).toStrictEqual(
        Object.keys(prefetchFunctions).length
      );
      // error in ssr, means it will try to load once again client-side
      await prefetchFunctions.news().catch(() => {});
      expect(html).toContain(loadingComponent);
    });
  });

  test("not passing data & requests via context should work as normal", () => {
    const newsID = 5;
    const context = {};
    const App = <Cmp newsID={newsID} />;
    return renderWithData(App, context).then(async (html) => {
      expect(context.requests.length).toStrictEqual(
        Object.keys(prefetchFunctions).length
      );

      // successful prefetch means that html & context data should contain the data
      await prefetchFunctions.user().then((userData) => {
        expect(context.data.user.data).toEqual(userData);
      });

      return prefetchFunctions.news(newsID).then((newsResult) => {
        const { story } = newsResult;
        expect(html).toContain(story);
        expect(context.data.news.data).toEqual(newsResult);
      });
    });
  });

  test("using multiple usePrefetch hooks", () => {
    const newsID = 5;
    const context = {};
    const App = <MultiplePrefetchCmp newsID={newsID} />;
    return renderWithData(App, context).then(async (html) => {
      expect(context.requests.length).toStrictEqual(
        Object.keys(prefetchFunctions).length
      );

      return Promise.all([
        prefetchFunctions.user(),
        prefetchFunctions.news(newsID),
      ]).then(([userData, newsResult]) => {
        expect(context.data.user.data).toEqual(userData);
        const { story } = newsResult;
        expect(html).toContain(story);
        expect(html).toContain(userData);
        expect(context.data.news.data).toEqual(newsResult);
      })
    });
  });

  test("using nested components each with usePrefetch hooks", () => {
    const newsID = 5;
    const context = {};
    const App = <NestedCmp newsID={newsID} />;
    return renderWithData(App, context).then(async (html) => {
      expect(context.requests.length).toStrictEqual(
        Object.keys(prefetchFunctions).length + Object.keys(testPrefetchFunction).length
      );

      return Promise.all([
        prefetchFunctions.user(),
        prefetchFunctions.news(newsID),
        testPrefetchFunction.test(),
      ]).then(([userData, newsResult, testResult]) => {
        expect(context.data.user.data).toEqual(userData);
        const { story } = newsResult;
        expect(html).toContain(story);
        expect(html).toContain(userData);
        expect(html).toContain(testResult);
        expect(context.data.news.data).toEqual(newsResult);
        expect(context.data.test.data).toEqual(testResult);
      })
    });
  });
  
  test("using usePrefetch hook that is declared within the component", () => {
    const newsID = 5;
    const context = {};
    const App = <InnerPrefetchCmp newsID={newsID} />;
    return renderWithData(App, context).then(async (html) => {
      expect(context.requests.length).toStrictEqual(
        Object.keys(prefetchFunctions).length
      );

      return Promise.all([
        prefetchFunctions.user(),
        prefetchFunctions.news(newsID),
      ]).then(([userData, newsResult]) => {
        expect(context.data.user.data).toEqual(userData);
        const { story } = newsResult;
        expect(html).toContain(story);
        expect(html).toContain(userData);
        expect(context.data.news.data).toEqual(newsResult);
      })
    });
  });
});
