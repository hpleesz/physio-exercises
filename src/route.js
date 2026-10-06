import { useEffect, useState } from "react";

// Pages live after the "#" in the address, so they work on GitHub Pages:
//   #/                 exercise library
//   #/lists            your saved lists
//   #/lists/new        new list
//   #/list/<id>        a list, for anyone with the link
//   #/list/<id>/edit   editing a list
export function parseRoute(hash) {
  const [a, b, c] = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (a === "lists" && b === "new") return { page: "edit", id: null };
  if (a === "lists") return { page: "lists" };
  if (a === "list" && b) return { page: c === "edit" ? "edit" : "view", id: b };
  return { page: "library" };
}

export function useRoute() {
  // n changes on every move, so a page opened again starts fresh.
  const [route, setRoute] = useState(() => ({ ...parseRoute(window.location.hash), n: 0 }));
  useEffect(() => {
    const update = () => {
      setRoute((r) => ({ ...parseRoute(window.location.hash), n: r.n + 1 }));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}

// Full address of a list, to send to someone.
export const listLink = (id) =>
  `${window.location.origin}${window.location.pathname}#/list/${id}`;
