import moxios from "moxios";
import { createProjectDeliverable } from "../../app/CreateBundle/CreateBundleService";

describe("CreateBundleService.createProjectDeliverable", () => {
  beforeEach(() => {
    moxios.install();
    Object.defineProperty(window.document, "cookie", {
      writable: true,
      value: "csrftoken=omnomnom",
    });
  });
  afterEach(() => {
    moxios.uninstall();
  });

  it("should make an axios REST call and return the given Deliverable", async () => {
    const resultPromise = createProjectDeliverable(123, 456, "test project");
    const fakeServerResponse: Deliverable = {
      absolute_path: null,
      archive_item_id: null,
      atom_id: null,
      duration: null,
      has_ongoing_job: null,
      job_id: null,
      linked_to_lowres: null,
      nearline_item_id: null,
      online_item_id: null,
      type: null,
      type_string: null,
      version: null,
      access_dt: "",
      changed_dt: "",
      deliverable: BigInt(12),
      filename: "",
      modified_dt: "",
      size: BigInt(123),
      size_string: "",
      status: BigInt(1),
      status_string: "",
      id: BigInt(1234),
    };

    moxios.wait(() => {
      const req = moxios.requests.mostRecent();
      expect(req.url).toEqual("/api/bundle/new");
      expect(req.config.method).toEqual("post");
      expect(req.config.data).toEqual(
        JSON.stringify({
          pluto_core_project_id: 123,
          commission_id: 456,
          name: "test project",
        })
      );

      req.respondWith({
        status: 200,
        response: fakeServerResponse,
      });
    });

    const callResult = await resultPromise;
    expect(callResult).toEqual(fakeServerResponse);
  });

  it("should return the project id if the server responds with 409", async () => {
    const resultPromise = createProjectDeliverable(123, 456, "test project");

    moxios.wait(() => {
      const req = moxios.requests.mostRecent();
      expect(req.url).toEqual("/api/bundle/new");
      expect(req.config.method).toEqual("post");
      expect(req.config.data).toEqual(
        JSON.stringify({
          pluto_core_project_id: 123,
          commission_id: 456,
          name: "test project",
        })
      );

      req.respondWith({
        status: 409,
        response: {
          status: "conflict",
          detail: "that thing is there already",
        },
      });
    });

    const callResult = await resultPromise;
    expect(callResult).toEqual(123);
  });

  it("should reject if the server responds 400", async () => {
    const resultPromise = createProjectDeliverable(123, 456, "test project");
    const fakeServerResponse = {
      status: "bad_request",
      detail: "go away",
    };

    moxios.wait(() => {
      const req = moxios.requests.mostRecent();
      expect(req.url).toEqual("/api/bundle/new");
      expect(req.config.method).toEqual("post");
      expect(req.config.data).toEqual(
        JSON.stringify({
          pluto_core_project_id: 123,
          commission_id: 456,
          name: "test project",
        })
      );

      req.respondWith({
        status: 400,
        response: fakeServerResponse,
      });
    });

    await expect(resultPromise).rejects;
  });
});
