import React from "react";
import { mount, shallow } from "enzyme";
import sinon from "sinon";
import moxios from "moxios";

jest.mock("pluto-headers", () => ({
  SystemNotification: {
    open: jest.fn(),
  },
  SystemNotifcationKind: {
    Success: "success",
    Error: "error",
  },
}));

import SyndicationTrigger from "../../app/MasterList/SyndicationTrigger";
import { act } from "react-dom/test-utils";

describe("SyndicationTrigger", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("should display an enabled button if uploadStatus is NOT_UPLOADING, clicking it should activate send and call sendInitiated", (done) => {
    const sendInitiatedCb = sinon.spy();

    const rendered = mount(
      <SyndicationTrigger
        uploadStatus={null}
        platform="Test"
        projectId={1234}
        link="https://test.location/"
        assetId={BigInt(5678)}
        sendInitiated={sendInitiatedCb}
        title="Test deliverable"
      />
    );

    const b = rendered.find("button.MuiIconButton-root");
    const svg = b.find("svg.MuiSvgIcon-root");
    expect(svg.length).toEqual(1);

    expect(sendInitiatedCb.callCount).toEqual(0);
    b.simulate("click");

    moxios.wait(async () => {
      try {
        const req = moxios.requests.mostRecent();
        expect(req.url).toEqual("/api/bundle/1234/asset/5678/Test/send");

        await req.respondWith({
          status: 200,
          response: {
            status: "ok",
          },
        });
        expect(sendInitiatedCb.callCount).toEqual(1);
        done();
      } catch (err) {
        done.fail(err);
      }
    });
  });

  it("should display an enabled button if uploadStatus is WAITING_FOR_START, clicking it should display logs", (done) => {
    const sendInitiatedCb = sinon.spy();

    const rendered = mount(
      <SyndicationTrigger
        uploadStatus="Ready for Upload"
        platform="Test"
        projectId={1234}
        link="https://test.location/"
        assetId={BigInt(5678)}
        sendInitiated={sendInitiatedCb}
        title="Test deliverable"
      />
    );

    const b = rendered.find("button.MuiIconButton-root");
    const svg = b.find("svg.MuiSvgIcon-root");
    expect(svg.length).toEqual(1);

    expect(sendInitiatedCb.callCount).toEqual(0);
    b.simulate("click");

    moxios.wait(async () => {
      try {
        const req = moxios.requests.mostRecent();
        expect(req.url).toEqual("/api/bundle/1234/asset/5678/Test/logs?full");

        await act(async () =>
          req
            .respondWith({
              status: 200,
              response: {
                status: "ok",
              },
            })
            .then(() => undefined)
        );
        expect(sendInitiatedCb.callCount).toEqual(0);
        done();
      } catch (err) {
        done.fail(err);
      }
    });
  });

  it("should display an enabled button if uploadStatus is IN_PROGRESS, clicking it should display logs", (done) => {
    const sendInitiatedCb = sinon.spy();

    const rendered = mount(
      <SyndicationTrigger
        uploadStatus="Uploading"
        platform="Test"
        projectId={1234}
        link="https://test.location/"
        assetId={BigInt(5678)}
        sendInitiated={sendInitiatedCb}
        title="Test deliverable"
      />
    );

    const b = rendered.find("button.MuiIconButton-root");
    const svg = b.find("svg.MuiSvgIcon-root");
    expect(svg.length).toEqual(0);
    const throbber = b.find("div.MuiCircularProgress-root");
    expect(throbber.length).toEqual(1);

    expect(sendInitiatedCb.callCount).toEqual(0);
    act(() => {
      b.simulate("click");
    });

    moxios.wait(async () => {
      try {
        const req = moxios.requests.mostRecent();
        expect(req.url).toEqual("/api/bundle/1234/asset/5678/Test/logs?full");

        await act(async () =>
          req
            .respondWith({
              status: 200,
              response: {
                status: "ok",
              },
            })
            .then(() => undefined)
        );

        expect(sendInitiatedCb.callCount).toEqual(0);
        done();
      } catch (err) {
        done.fail(err);
      }
    });
  });

  it("should display an enabled button if uploadStatus is FAILED, clicking it should activate send and call sendInitiated", (done) => {
    const sendInitiatedCb = sinon.spy();

    const rendered = mount(
      <SyndicationTrigger
        uploadStatus="Upload Failed"
        platform="Test"
        link="https://test.location/"
        projectId={1234}
        assetId={BigInt(5678)}
        sendInitiated={sendInitiatedCb}
        title="Test deliverable"
      />
    );

    expect(rendered.find("button#output-failed-logs").length).toEqual(1);
    const b = rendered.find("button#syndication-trigger");
    const svg = b.find("svg.MuiSvgIcon-root");
    expect(svg.length).toEqual(1);

    expect(sendInitiatedCb.callCount).toEqual(0);
    b.simulate("click");

    moxios.wait(async () => {
      try {
        const req = moxios.requests.mostRecent();
        expect(req.url).toEqual("/api/bundle/1234/asset/5678/Test/send");

        await req.respondWith({
          status: 200,
          response: {
            status: "ok",
          },
        });
        expect(sendInitiatedCb.callCount).toEqual(1);
        done();
      } catch (err) {
        done.fail(err);
      }
    });
  });

  it("should display an upload and enabled log button if uploadStatus is COMPLETE, clicking it should display logs", (done) => {
    const sendInitiatedCb = sinon.spy();

    const rendered = mount(
      <SyndicationTrigger
        uploadStatus="Upload Complete"
        platform="Test"
        link="https://test.location/"
        projectId={1234}
        assetId={BigInt(5678)}
        sendInitiated={sendInitiatedCb}
        title="Test deliverable"
      />
    );

    const b = rendered.find("button#output-complete-logs");
    const svg = b.find("svg.MuiSvgIcon-root");
    expect(svg.length).toEqual(1);

    expect(sendInitiatedCb.callCount).toEqual(0);
    b.simulate("click");

    moxios.wait(async () => {
      try {
        const req = moxios.requests.mostRecent();
        expect(req.url).toEqual("/api/bundle/1234/asset/5678/Test/logs?full");

        await act(async () =>
          req
            .respondWith({
              status: 200,
              response: {
                status: "ok",
              },
            })
            .then(() => undefined)
        );
        expect(sendInitiatedCb.callCount).toEqual(0);
        done();
      } catch (err) {
        done.fail(err);
      }
    });
  });

  it("should not allow upload if metadata is not defined", () => {
    const sendInitiatedCb = sinon.spy();

    const rendered = mount(
      <SyndicationTrigger
        uploadStatus={null}
        platform="Test"
        link="https://test.location/"
        projectId={1234}
        assetId={BigInt(5678)}
        sendInitiated={sendInitiatedCb}
        title={null}
      />
    );

    const trigger = rendered.find("button#syndication-trigger");
    expect(trigger.props().disabled).toBeTruthy();

    const b = rendered.find("button#output-complete-logs");
    expect(b.length).toEqual(0);
  });
});
