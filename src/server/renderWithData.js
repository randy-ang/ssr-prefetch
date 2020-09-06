import React from "react";
import { PrefetchProvider } from "../context";

export default async function renderWithData(
  Component,
  context = { requests: [] },
  renderFunction = require("react-dom/server").renderToString
) {
  const requests = [];
  const App = React.createElement(
    PrefetchProvider,
    { ...context, requests },
    Component
  );
  const html = renderFunction(App);
  if (requests.length) {
    return Promise.all(context.requests).then(() => {
      context.requests.push(...requests);
      return renderWithData(Component, context, renderFunction);
    });
  }

  return html;
}
