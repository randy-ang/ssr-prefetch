# react-ssr-prefetch

This is a library to help prefetch data and then render the app alongside the data. The client side must be implemented. As for the server side, if it is not implemented, then it will just be a normal client side data fetching.

## Installing

### Using yarn

`yarn add react-ssr-prefetch`

### Using npm

`npm install react-ssr-prefetch`

## Hooks

### usePrefetch

> usage: usePrefetch(prefetchFunctions, { lazy, params, defaultValue, initialValue })

| Params            | Type                | Description                                                                                           |
| ----------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| prefetchFunctions | Object of functions | this is a map of functions that you would like to execute.                                            |
| lazy              | Boolean             | if true, it will not fetch on server-side, defaults to `false`                                        |
| params            | Object of arrays    | this is a map of array which will be passed to the functions defined in the prefetchFunctions         |
| initialValue      | Object              | this is a map that defines the initial value of the data of the keys defined in the prefetchFunctions |
| defaultValue      | any                 | this is the absolute fallback initial value for every keys in the prefetchFunctions                   |

> the response of this function is an object of object with keys that are defined in prefetchFunctions. Each key is structured in the following way: { [key]: { data, loading, error } }

| Key     | Type    | Description                                               |
| ------- | ------- | --------------------------------------------------------- |
| data    | any     | the result of the prefetch function of the respective key |
| loading | Boolean | loading state of the respective key                       |
| error   | Object  | error object if prefetch function ends with error         |

#### Example

```
import React from 'react'
import { usePrefetch, PrefetchProvider } from 'react-ssr-prefetch/client'

const prefetchFunctions = {
  news: (newsID) =>
    Promise.resolve({
      story: 'this is a story with id: ' + newsID,
    }), // do api call here
  user: () =>
    Promise.resolve({
      name: 'my-name',
    }),
}

const App = ({newsID) => {
  const {
    news: { data, loading, error, refetch },
    user,
  } = usePrefetch(prefetchFunctions, { params: { news: [newsID] } })

  if (loading) return 'Loading'
  if (error) return 'error'

  return <div>data.story</div>
}


```

## Server Side Utils

### renderWithData

Render component to string server side alongside prefetched data

> Usage: renderWithData(ReactComponent, context, renderToStringFunction)

| Params                 | Type            | Description                                                                              |
| ---------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| ReactComponent         | React Component | your React App                                                                           |
| context                | Object          | all requests values will be stored here                                                  |
| renderToStringFunction | Function        | function to render to string, by default uses require('react-dom/server').renderToString |

```
import React from 'react'
import { renderWithData } from 'react-ssr-prefetch/server'

const prefetchContext = {}
const htmlBody = await renderWithData(App, prefetchContext)
const textHtml = `<!doctype html>
<html>
  <head></head><body>
  <div id="main">${htmlBody}</div>
  <script type="text/javascript">
    window.__data=${JSON.stringify(data)}
  </script>
</body>
</html>`
res.send(textHtml)

```

## Client Side Utils

### Prefetch Provider

> Usage: `<PrefetchProvider data={window._data}><App/></PrefetchProvider>`

| Params | Type   | Description                                                                                                  |
| ------ | ------ | ------------------------------------------------------------------------------------------------------------ |
| data   | Object | this is the data that will be used client side, and will be used by any value that uses the prefetch context |
