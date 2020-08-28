import React from "react";
import { mount } from "enzyme";
import MasterList from "../app/MasterList/MasterList";
import moment from "moment";
import moxios from "moxios";
import { act } from "react-dom/test-utils";

(global as any).deploymentRootPath = "";

describe("MasterList", () => {
  let deliverable: Deliverable;

  beforeEach(() => {
    deliverable = {
      id: BigInt(1),
      type: 1,
      job_id: "",
      item_id: "",
      has_ongoing_job: false,
      type_string: "",
      version: BigInt(1),
      duration: "",
      filename: "",
      size: BigInt(1),
      access_dt: "",
      modified_dt: "",
      changed_dt: "",
      deliverable: BigInt(1),
      status: BigInt(1),
      size_string: "",
      status_string: "",
    };
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("should render empty masters", () => {
    const wrapper = mount(<MasterList deliverable={deliverable} />);
    const masterElements = wrapper
      .find(".MuiTableRow-root")
      .not(".MuiTableRow-head");

    expect(masterElements).toHaveLength(4);
    masterElements.forEach((masterElement) => {
      expect(
        masterElement
          .find(".MuiTableCell-root.MuiTableCell-body.publication-text")
          .text()
      ).toEqual("");
    });
  });

  it("should render one fetched master data in the masterList", (done) => {
    const masterList: Master[] = [
      {
        id: 1,
        group: "gnmwebsite",
        sent: true,
        sentDate: new Date().toISOString(),
        platform: "Atom headline",
        link: "https://www.theguardian.com/international",
        tags: ["primary tag", "source"],
      },
    ];

    const wrapper = mount(<MasterList deliverable={deliverable} />);

    return moxios.wait(async () => {
      await act(async () => {
        const request = moxios.requests.at(0);
        const secondRequest = moxios.requests.at(1);
        const thirdRequest = moxios.requests.at(2);
        const fourthRequest = moxios.requests.at(3);
        expect(request.config.url).toEqual(
          `/api/bundle/${deliverable.id}/asset/${deliverable.id}/gnmwebsite/logs`
        );
        Promise.all([
          request.respondWith({
            status: 200,
            response: masterList[0],
          }),
          secondRequest.respondWith({
            status: 200,
            response: {},
          }),
          thirdRequest.respondWith({
            status: 200,
            response: {},
          }),
          fourthRequest.respondWith({
            status: 200,
            response: {},
          }),
        ])
          .then(() => {
            const masterElements = wrapper
              .find(".MuiTableRow-root")
              .not(".MuiTableRow-head");

            expect(masterElements).toHaveLength(4);

            masterElements.slice(0, 1).forEach((masterElement) => {
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.publication-text")
                  .text()
              ).toEqual(
                `Published since ${moment(masterList[0].sentDate).format(
                  "ddd Do MMM, HH:mm"
                )}`
              );
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.link")
                  .text()
              ).toEqual(masterList[0].link);
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.platform")
                  .text()
              ).toEqual(masterList[0].platform);
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.tags")
                  .text()
              ).toEqual(
                `${(masterList[0].tags as string[])[0]}${
                  (masterList[0].tags as string[])[1]
                }`
              );
            });

            masterElements
              .slice(1, masterElements.length)
              .forEach((masterElement) => {
                expect(
                  masterElement
                    .find(
                      ".MuiTableCell-root.MuiTableCell-body.publication-text"
                    )
                    .text()
                ).toEqual("");
              });

            done();
          })
          .catch((error) => {
            console.error(error);
            done.fail(error);
          });
      });
    });
  });

  it("should render correct length of items in the masterList", (done) => {
    const masterList: Master[] = [
      {
        id: 1,
        group: "gnmwebsite",
        sent: true,
        sentDate: new Date().toISOString(),
        platform: "Atom headline",
        link: "https://www.theguardian.com/international",
        tags: ["primary tag", "source"],
      },
      {
        id: 2,
        group: "youtube",
        sent: true,
        sentDate: new Date().toISOString(),
        platform: "Youtube title",
        link: "https://www.youtube.com/",
        tags: ["secondary tag", "origin"],
      },
    ];

    const wrapper = mount(<MasterList deliverable={deliverable} />);

    return moxios.wait(async () => {
      await act(async () => {
        const request = moxios.requests.at(0);
        const secondRequest = moxios.requests.at(1);
        const thirdRequest = moxios.requests.at(2);
        const fourthRequest = moxios.requests.at(3);
        expect(request.config.url).toEqual(
          `/api/bundle/${deliverable.id}/asset/${deliverable.id}/gnmwebsite/logs`
        );
        Promise.all([
          request.respondWith({
            status: 200,
            response: masterList[0],
          }),
          secondRequest.respondWith({
            status: 200,
            response: masterList[1],
          }),
          thirdRequest.respondWith({
            status: 200,
            response: {},
          }),
          fourthRequest.respondWith({
            status: 200,
            response: {},
          }),
        ])
          .then(() => {
            const masterElements = wrapper
              .find(".MuiTableRow-root")
              .not(".MuiTableRow-head");

            expect(masterElements).toHaveLength(4);

            masterElements.slice(0, 2).forEach((masterElement, index) => {
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.publication-text")
                  .text()
              ).toEqual(
                `Published since ${moment(masterList[index].sentDate).format(
                  "ddd Do MMM, HH:mm"
                )}`
              );
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.link")
                  .text()
              ).toEqual(masterList[index].link);
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.platform")
                  .text()
              ).toEqual(masterList[index].platform);
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.tags")
                  .text()
              ).toEqual(
                `${(masterList[index].tags as string[])[0]}${
                  (masterList[index].tags as string[])[1]
                }`
              );
            });

            masterElements
              .slice(2, masterElements.length)
              .forEach((masterElement) => {
                expect(
                  masterElement
                    .find(
                      ".MuiTableCell-root.MuiTableCell-body.publication-text"
                    )
                    .text()
                ).toEqual("");
              });

            done();
          })
          .catch((error) => {
            console.error(error);
            done.fail(error);
          });
      });
    });
  });
});
