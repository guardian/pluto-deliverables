import React from "react";
import { shallow, mount } from "enzyme";
import sinon from "sinon";
import moxios from "moxios";
import VidispineJobProgress from "../../app/ProjectDeliverables/VidispineJobProgress";
import fs from "fs";
import { act } from "react-dom/test-utils";

describe("VidispineJobProgress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    moxios.install();
  });
  afterEach(() => {
    jest.useRealTimers();
    moxios.uninstall();
  });

  function readFilePromise(path: string): Promise<string> {
    return new Promise((resolve, reject) =>
      fs.readFile(path, (err, buffer) => {
        if (err) reject(err);
        resolve(buffer.toString("utf-8"));
      })
    );
  }

  it("should callout to VS on mount to get information on the given job id and set up a timer", async () => {
    const openJobCb = sinon.spy();
    const needsUpdateCb = sinon.spy();

    const mockJobText = await readFilePromise(
      __dirname + "/../sample-job.json"
    );

    const rendered = mount(
      <VidispineJobProgress
        jobId="VX-1234"
        vidispineBaseUrl="https://vidispine.test"
        openJob={openJobCb}
        onRecordNeedsUpdate={needsUpdateCb}
      />
    );

    await moxios.wait(jest.fn);
    await act(async () => {
      const rq = moxios.requests.mostRecent();

      expect(rq.url).toEqual("https://vidispine.test/API/job/VX-1234");
      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 5000);

      jest.useRealTimers(); //respondWith needs a proper timer
      console.log("respondWith");

      await rq.respondWith({
        status: 200,
        response: mockJobText,
      });

      const rerendered = rendered.update();

      const container = rerendered.find("div#vs-job-VX-1234");
      expect(container.length).toEqual(1);
      const completedText = container.find("span#vs-job-VX-1234-completed");
      expect(completedText.length).toEqual(1);

      expect(needsUpdateCb.callCount).toEqual(0);
    });
  });
});
