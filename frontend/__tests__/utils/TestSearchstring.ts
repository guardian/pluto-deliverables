import { break_down_searchstring } from "../../app/utils/searchstring";

describe("break_down_searchstring", () => {
  it("should return a map of keys and values", () => {
    const result = break_down_searchstring(
      "?key1=value1&key2=value2&key3=malformatted=key"
    );
    expect(result.get("key1")).toEqual("value1");
    expect(result.get("key2")).toEqual("value2");
    expect(result.get("key3")).toEqual("malformatted=key");
    expect(result.size).toEqual(3);
  });
});
