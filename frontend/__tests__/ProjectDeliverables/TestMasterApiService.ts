import { resyncToPublished } from "../../app/utils/master-api-service";
import moxios from "moxios";

describe("master-api-service.resyncToPublished", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("should resolve an empty promise when request succeeds", async (done) => {
    const resultPromise = resyncToPublished("123", "456");
    await moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          status: "ok",
        },
      });
    });

    resultPromise.then(() => done()).catch((err) => done.fail(err));
  });

  it("should reject the promise if an error is returned", async (done) => {
    const resultPromise = resyncToPublished("123", "456");
    await moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 400,
        response: {
          status: "error",
        },
      });
    });

    resultPromise
      .then(() => done.fail("expected the promise to reject"))
      .catch((err) => {
        if (err == "see browser console for details") {
          done();
        } else {
          done.fail(`got unexpected error message: ${err.toString()}`);
        }
      });
  });

  it("should reject the promise with the error detail if a 200 is returned with an error body", async (done) => {
    const resultPromise = resyncToPublished("123", "456");
    await moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          status: "error",
          detail: "something went splat",
        },
      });
    });

    resultPromise
      .then(() => done.fail("expected the promise to reject"))
      .catch((err) => {
        if (err == "something went splat") {
          done();
        } else {
          done.fail(`got unexpected error message: ${err.toString()}`);
        }
      });
  });
});
