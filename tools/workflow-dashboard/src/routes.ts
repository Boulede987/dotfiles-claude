/** HTTP routes shared by the server and the page's client script. */
export const ROUTES = {
  page: "/",
  fragment: "/fragment",
  events: "/events",
  files: "/files/",
} as const;

export const CHANGED_EVENT = "changed";
