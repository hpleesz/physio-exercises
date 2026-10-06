import { SITE_TITLE } from "../config.js";

// Bar at the top of every page. Visitors (e.g. someone opening a shared list) only see the
// site name and a small "Log in" link.
export default function Nav({ route, user, onLogOut }) {
  const current = (page) => (route.page === page ? "page" : undefined);
  return (
    <nav className="topnav">
      {user ? (
        <>
          <a href="#/" aria-current={current("library")}>{SITE_TITLE}</a>
          <a href="#/lists" aria-current={current("lists")}>My lists</a>
        </>
      ) : (
        <span className="brand">{SITE_TITLE}</span>
      )}
      <span className="spacer" />
      {user ? (
        <button className="link-btn" onClick={onLogOut}>Log out</button>
      ) : (
        user === null && route.page === "view" && <a href="#/" className="quiet">Log in</a>
      )}
    </nav>
  );
}
