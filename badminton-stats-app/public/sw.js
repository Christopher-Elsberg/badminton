const CACHE_NAME =
  "badminton-stats-v1";

const STATIC_ASSETS =
  new Set([
    "/Badminton-logo.png",
    "/icon-192.png",
    "/icon-512.png",
    "/icon-512-maskable.png",
    "/apple-touch-icon.png",
    "/favicon-32.png",
  ]);


/*
========================================
INSTALL
========================================
*/

self.addEventListener(
  "install",
  () => {
    self.skipWaiting();
  }
);


/*
========================================
ACTIVATE
========================================
*/

self.addEventListener(
  "activate",
  (event) => {

    event.waitUntil(

      caches
        .keys()

        .then((keys) =>

          Promise.all(

            keys

              .filter(
                (key) =>
                  key.startsWith(
                    "badminton-stats-"
                  ) &&
                  key !== CACHE_NAME
              )

              .map(
                (key) =>
                  caches.delete(key)
              )

          )

        )

        .then(() =>
          self.clients.claim()
        )

    );

  }
);


/*
========================================
FETCH
========================================
*/

self.addEventListener(
  "fetch",
  (event) => {

    /*
    Kun GET requests
    */

    if (
      event.request.method !==
      "GET"
    ) {
      return;
    }


    const url =
      new URL(
        event.request.url
      );


    /*
    Vi cacher IKKE Supabase
    eller andre eksterne requests.
    */

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }


    /*
    Vi cacher kun appens
    statiske billeder.
    */

    if (
      !STATIC_ASSETS.has(
        url.pathname
      )
    ) {
      return;
    }


    event.respondWith(

      caches
        .open(CACHE_NAME)

        .then(
          async (cache) => {

            const cached =
              await cache.match(
                event.request
              );


            if (cached) {
              return cached;
            }


            const response =
              await fetch(
                event.request
              );


            if (
              response.ok
            ) {

              await cache.put(
                event.request,
                response.clone()
              );

            }


            return response;

          }
        )

    );

  }
);
