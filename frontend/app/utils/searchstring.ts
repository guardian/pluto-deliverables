function break_down_searchstring(searchstring: string): Map<string, string> {
  const bareString = searchstring.startsWith("?")
    ? searchstring.slice(1)
    : searchstring;

  return bareString
    .split("&")
    .map((arg) => arg.split("="))
    .reduce(
      (acc, elem) =>
        acc.set(
          decodeURIComponent(elem[0]),
          elem
            .slice(1)
            .map((part) => decodeURIComponent(part))
            .join("=")
        ),
      new Map<string, string>()
    );
}

export { break_down_searchstring };
