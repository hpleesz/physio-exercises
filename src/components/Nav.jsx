// Bar at the top of every page. Visitors only see the library and a small "Log in" link.
export default function Nav({ route, user, onLogOut }) {
  const current = (page) => (route.page === page ? "page" : undefined);
  return (
    <nav className="topnav">
      <a href="#/" aria-current={current("library")}>Exercise library</a>
      {user && <a href="#/lists" aria-current={current("lists")}>My lists</a>}
      <span className="spacer" />
      {user ? (
        <button className="link-btn" onClick={onLogOut}>Log out</button>
      ) : (
        <a href="#/lists" className="quiet">Log in</a>
      )}
    </nav>
  );
}
