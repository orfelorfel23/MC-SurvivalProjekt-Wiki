import { createFileRoute } from "@tanstack/react-router";
import { MapPage } from "./karte";

export const Route = createFileRoute("/map")({
  component: MapPage,
});
