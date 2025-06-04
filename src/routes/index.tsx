import { createFileRoute } from "@tanstack/react-router";
import StarWarsTrivia from "../components/StarWarsTrivia";

export const Route = createFileRoute("/")({
  component: StarWarsTrivia,
});

