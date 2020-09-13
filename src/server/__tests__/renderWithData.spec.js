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
    return renderWithData(App, context).then((html) => {
      expect(context.requests.length).toStrictEqual(
        Object.keys(prefetchFunctions).length
      );
      // ssr means that html should already contain the data
      return prefetchFunctions.news(newsID).then(({ story }) => {
        expect(html).toContain(story);
      });
    });
  });

  test("prefetch with error", () => {
    const context = { data: {}, requests: [] };
    const App = <Cmp />;
    return renderWithData(App, context).then((html) => {
      expect(context.requests.length).toStrictEqual(
        Object.keys(prefetchFunctions).length
      );
      // error in ssr, means it will try to load once again client-side
      return prefetchFunctions.news().catch(() => {
        expect(html).toContain(loadingComponent);
      });
    });
  });
});
