import React from "react";
import { mount } from "enzyme";
import sinon from "sinon";

import CreateBundleDialogContent from "../../app/CreateBundle/CreateBundleDialogContent";
import moxios from "moxios";
import { act } from "react-dom/test-utils";

describe("CreateBundleDialogContent", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("should load and verify data then display completion", (done) => {
    const didCompleteSpy = sinon.spy();
    const rendered = mount(
      <CreateBundleDialogContent projectid={123} didComplete={didCompleteSpy} />
    );
    const fakeServerResponse = {
      title: "Fallen in the water",
      status: "In production",
      created: "2020-01-02T03:04:05Z",
      user: "little_jim",
      commissionId: 3,
    };

    expect(rendered.find("#spinner").length).toEqual(3);

    moxios.wait(async () => {
      try {
        const req = moxios.requests.mostRecent();
        expect(req.url).toEqual("/pluto-core/api/project/123");
        expect(req.config.method).toEqual("get");

        await act(async () => {
          await req.respondWith({
            status: 200,
            response: {
              status: "ok",
              result: fakeServerResponse,
            },
          });
        });
        const updated = rendered.update();
        console.log(updated.html());

        expect(updated.find("#spinner").length).toEqual(0);
        const textBody = updated.find(".MuiTypography-body1");
        expect(textBody.at(0).text()).toEqual(
          "You are about to add deliverables to Fallen in the water for the first time. Are you sure you want to continue?"
        );
        const createButton = updated.find("button#create-button");
        expect(createButton.prop("disabled")).toBeFalsy();
        expect(createButton.hasClass("Mui-disabled")).toBeFalsy();
        done();
      } catch (err) {
        done.fail(err);
      }
    });
  });

  it("should not enable the create button if we don't have the right data", (done) => {
    const didCompleteSpy = sinon.spy();
    const rendered = mount(
      <CreateBundleDialogContent projectid={123} didComplete={didCompleteSpy} />
    );
    const fakeServerResponse = {
      title: "Fallen in the water",
      status: "In production",
      created: "2020-01-02T03:04:05Z",
      user: "little_jim",
    };

    expect(rendered.find("#spinner").length).toEqual(3);

    moxios.wait(async () => {
      try {
        const req = moxios.requests.mostRecent();
        expect(req.url).toEqual("/pluto-core/api/project/123");
        expect(req.config.method).toEqual("get");

        await act(async () => {
          await req.respondWith({
            status: 200,
            response: {
              status: "ok",
              result: fakeServerResponse,
            },
          });
        });
        const updated = rendered.update();

        expect(updated.find("#spinner").length).toEqual(0);
        const createButton = updated.find("button#create-button");
        expect(createButton.hasClass("Mui-disabled")).toBeTruthy();
        done();
      } catch (err) {
        done.fail(err);
      }
    });
  });

  it("should display an error if the server responds with an error", (done) => {
    const didCompleteSpy = sinon.spy();
    const rendered = mount(
      <CreateBundleDialogContent projectid={123} didComplete={didCompleteSpy} />
    );

    expect(rendered.find("#spinner").length).toEqual(3);

    moxios.wait(async () => {
      try {
        const req = moxios.requests.mostRecent();
        expect(req.url).toEqual("/pluto-core/api/project/123");
        expect(req.config.method).toEqual("get");

        await act(async () => {
          await req.respondWith({
            status: 500,
            response: {
              status: "error",
              detail: "kaboom",
            },
          });
        });
        const updated = rendered.update();

        expect(updated.find("#spinner").length).toEqual(0);
        const createButton = updated.find("button#create-button");
        expect(createButton.hasClass("Mui-disabled")).toBeTruthy();
        const alert = updated.find("div.MuiAlert-message");
        expect(alert.text()).toEqual(
          "There was a server error: kaboom, please go back and try again."
        );
        done();
      } catch (err) {
        done.fail(err);
      }
    });
  });
});
