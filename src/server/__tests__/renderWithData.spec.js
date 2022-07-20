import React from "react";
import usePrefetch from "../../client/usePrefetch";
import { oneOfType, number, string } from "prop-types";
import renderWithData from "../renderWithData";

const mockNewsStory = "this is a story with id: ";
const mockUserData = "some-mockUserData";
const prefetchFunctions = {
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
  user: jest
    .fn()
    .mockName("mock-prefetch-story")
    .mockImplementation(() => Promise.resolve(mockUserData)),
};
const loadingComponent = "Loading";
const errorComponent = "Error Occured";

const Cmp = ({ newsID }) => {
  const params = { news: [newsID] };
  const {
    news: { data, loading, error },
  } = usePrefetch(prefetchFunctions, { params });
  if (loading) return <div>{loadingComponent}</div>;
  if (error) return <div>{errorComponent}</div>;
  return <div>{data?.story}</div>;
};

Cmp.propTypes = {
  newsID: oneOfType([number, string]),
};

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
});
