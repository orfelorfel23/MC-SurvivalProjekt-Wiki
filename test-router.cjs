const {
  createRouter,
  createRoute,
  createRootRoute,
  createMemoryHistory,
} = require("@tanstack/react-router");
const root = createRootRoute();
const api = createRoute({ getParentRoute: () => root, path: "/api/auth/*" });
const tree = root.addChildren([api]);
const router = createRouter({
  routeTree: tree,
  history: createMemoryHistory({ initialEntries: ["/api/auth/get-session"] }),
});
console.log(
  "match:",
  router.state.matches.map((m) => m.routeId),
);
