import { VidispineJob } from "../app/vidispine/job/VidispineJob";
import fs from "fs";

describe("VidispineJob", () => {
  it("should validate data from the server correctly", (done) => {
    fs.readFile(__dirname + "/sample-job.json", (err, data) => {
      if (err) done.fail(err);

      try {
        const parsedJson = JSON.parse(data.toString());
        console.log(parsedJson);
        const vsJob = new VidispineJob(parsedJson);
        expect(vsJob.didFinish()).toBeTruthy();
        done();
      } catch (err) {
        done.fail(err);
      }
    });
  });

  it("should validate data from the server correctly when no total number of steps is present", (done) => {
    fs.readFile(__dirname + "/sample-job-no-total-steps.json", (err, data) => {
      if (err) done.fail(err);

      try {
        const parsedJson = JSON.parse(data.toString());
        console.log(parsedJson);
        const vsJob = new VidispineJob(parsedJson);
        expect(vsJob.didFinish()).toBeTruthy();
        done();
      } catch (err) {
        done.fail(err);
      }
    });
  });
});
