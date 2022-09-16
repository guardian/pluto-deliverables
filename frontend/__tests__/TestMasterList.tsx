import React from "react";
import { mount } from "enzyme";
import MasterList from "../app/MasterList/MasterList";
import moxios from "moxios";
import { act } from "react-dom/test-utils";
import sinon from "sinon";
import mock = jest.mock;
import { format, parseISO } from "date-fns";

(global as any).deploymentRootPath = "";

describe("MasterList", () => {
  let deliverable: Deliverable;

  beforeEach(() => {
    deliverable = {
      id: BigInt(1),
      type: 1,
      job_id: "",
      online_item_id: "",
      nearline_item_id: null,
      archive_item_id: null,
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
      atom_id: null,
      absolute_path: null,
      linked_to_lowres: null,
    };
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("should render empty masters", () => {
    const mockOnSyndicationInitiated = sinon.spy();

    const wrapper = mount(
      <MasterList
        deliverable={deliverable}
        project_id={1}
        onSyndicationInitiated={mockOnSyndicationInitiated}
      />
    );
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
    const mockOnSyndicationInitiated = sinon.spy();
    const masterList: GuardianMaster[] = [
      {
        publication_date: new Date().toISOString(),
        website_title: "Atom headline",
        media_atom_id: "atom-2",
        tags: ["primary tag", "source"],
        upload_status: "",
        production_office: "",
        website_description: "",
        primary_tone: "",
        publication_status: "",
      },
    ];

    const wrapper = mount(
      <MasterList
        deliverable={deliverable}
        project_id={2}
        onSyndicationInitiated={mockOnSyndicationInitiated}
      />
    );

    return moxios.wait(async () => {
      const request = moxios.requests.at(0);
      expect(request.config.url).toEqual(
        `/api/bundle/2/asset/${deliverable.id}/gnmwebsite`
      );

      request
        .respondWith({
          status: 200,
          response: masterList[0],
        })
        .then(async () => {
          await act(async () => {
            await moxios.requests.at(1).respondWith({
              status: 200,
              response: {},
            });

            await moxios.requests.at(2).respondWith({
              status: 200,
              response: {},
            });
            await moxios.requests.at(3).respondWith({
              status: 200,
              response: {},
            });

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
                `Published since ${format(
                  parseISO(masterList[0].publication_date),
                  "EEE do MMM, HH:mm"
                )}`
              );
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.link")
                  .text()
              ).toEqual(
                `https://video.gutools.co.uk/${masterList[0].media_atom_id}`
              );
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.platform")
                  .text()
              ).toEqual(masterList[0].website_title);
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
          });
        })
        .catch((error) => {
          console.error(error);
          done.fail(error);
        });
    });
  });

  it("should render correct length of items in the masterList", (done) => {
    const mockOnSyndicationInitiated = sinon.spy();
    const guardianMaster: GuardianMaster = {
      publication_date: new Date().toISOString(),
      website_title: "Atom headline",
      media_atom_id: "atom-2",
      tags: ["primary tag", "source"],
      upload_status: "",
      production_office: "",
      website_description: "",
      primary_tone: "",
      publication_status: "",
    };
    const youtubeMaster: YoutubeMaster = {
      publication_date: new Date().toISOString(),
      youtube_title: "Youtube title",
      youtube_id: "https://www.youtube.com/",
      youtube_tags: ["secondary tag", "origin"],
      youtube_description: "",
    };
    const wrapper = mount(
      <MasterList
        deliverable={deliverable}
        project_id={3}
        onSyndicationInitiated={mockOnSyndicationInitiated}
      />
    );

    return moxios.wait(async () => {
      const request = moxios.requests.at(0);
      expect(request.config.url).toEqual(
        `/api/bundle/3/asset/${deliverable.id}/gnmwebsite`
      );

      request
        .respondWith({
          status: 200,
          response: guardianMaster,
        })
        .then(async () => {
          await act(async () => {
            await moxios.requests.at(1).respondWith({
              status: 200,
              response: youtubeMaster,
            });

            await moxios.requests.at(2).respondWith({
              status: 200,
              response: {},
            });
            await moxios.requests.at(3).respondWith({
              status: 200,
              response: {},
            });
            const masterElements = wrapper
              .find(".MuiTableRow-root")
              .not(".MuiTableRow-head");

            expect(masterElements).toHaveLength(4);

            masterElements.slice(0, 2).forEach((masterElement, index) => {
              const isMaster = index === 0;
              const publication_date = isMaster
                ? guardianMaster.publication_date
                : youtubeMaster.publication_date;
              const link = isMaster
                ? `https://video.gutools.co.uk/${guardianMaster.media_atom_id}`
                : `https://www.youtube.com/watch?v=${youtubeMaster.youtube_id}`;
              const title = isMaster
                ? guardianMaster.website_title
                : youtubeMaster.youtube_title;
              const tags = isMaster
                ? guardianMaster.tags
                : youtubeMaster.youtube_tags;
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.publication-text")
                  .text()
              ).toEqual(
                `Published since ${format(
                  parseISO(publication_date),
                  "EEE do MMM, HH:mm"
                )}`
              );
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.link")
                  .text()
              ).toEqual(link);
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.platform")
                  .text()
              ).toEqual(title);
              expect(
                masterElement
                  .find(".MuiTableCell-root.MuiTableCell-body.tags")
                  .text()
              ).toEqual(`${(tags as string[])[0]}${(tags as string[])[1]}`);
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
          });
        })
        .catch((error) => {
          console.error(error);
          done.fail(error);
        });
    });
  });
});
