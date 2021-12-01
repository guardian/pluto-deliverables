import React from "react";
import { mount, ReactWrapper } from "enzyme";
import DailymotionMaster from "../app/Master/DailymotionMaster";
import { createMemoryHistory, createLocation } from "history";
import moxios from "moxios";
import { act } from "react-dom/test-utils";

describe("DailymotionMaster", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("should populate data on load", (done) => {
    const path = "/project/:projectid/asset/:assetid/mainstream/new";

    const match = {
      isExact: false,
      path,
      url: path,
      params: {
        projectid: "1",
        assetid: "2",
      },
    };
    const location = createLocation(match.url);

    const mockInfo: DailymotionMaster = {
      daily_motion_category: "News",
      daily_motion_contains_adult_content: true,
      daily_motion_description: "some description",
      daily_motion_no_mobile_access: true,
      daily_motion_tags: ["tag1", "tag2"],
      daily_motion_title: "some title",
      daily_motion_url: "https://some/url",
      etag: "dsfasfasfsad",
      publication_date: "2010-01-02T03:04:05Z",
      upload_status: "Published",
    };

    const rendered = mount(
      <DailymotionMaster
        history={createMemoryHistory()}
        location={location}
        match={match}
      />
    );

    moxios.wait(() => {
      const result = act(async () => {
        const req = moxios.requests.mostRecent();
        expect(!!req).toBeTruthy();
        expect(req.url).toEqual("/api/bundle/1/asset/2/dailymotion");

        await req.respondWith({
          status: 200,
          response: mockInfo,
        });
      });

      result.then(
        () => {
          rendered.update();
          expect(rendered.find("input#dm-title").props()["value"]).toEqual(
            "some title"
          );
          expect(
            rendered.find("textarea#dm-description").props()["value"]
          ).toEqual("some description");
          expect(
            rendered.find("input#dm-upload-status").props()["value"]
          ).toEqual("Published");
          expect(
            rendered.find("input#dm-publication-date").props()["value"]
          ).toEqual("2010-01-02T03:04:05Z");
          expect(rendered.find("input#dm-url").props()["value"]).toEqual(
            "https://some/url"
          );
          expect(rendered.find("span.MuiChip-label").length).toEqual(2);
          expect(rendered.find("span.MuiChip-label").at(0).text()).toEqual(
            "tag1"
          );
          expect(rendered.find("span.MuiChip-label").at(1).text()).toEqual(
            "tag2"
          );
          expect(
            rendered.find("input#dm-no-mobile").props()["checked"]
          ).toEqual(true);

          done();
        },
        (err) => done.fail(err)
      );
    });
  });

  it("should present an empty form if a 404 is returned", (done) => {
    const path = "/project/:projectid/asset/:assetid/dailymotion/new";

    const match = {
      isExact: false,
      path,
      url: path,
      params: {
        projectid: "1",
        assetid: "2",
      },
    };
    const location = createLocation(match.url);

    const rendered = mount(
      <DailymotionMaster
        history={createMemoryHistory()}
        location={location}
        match={match}
      />
    );

    moxios.wait(() => {
      const result = act(async () => {
        const req = moxios.requests.mostRecent();
        expect(!!req).toBeTruthy();
        expect(req.url).toEqual("/api/bundle/1/asset/2/dailymotion");

        await req.respondWith({
          status: 404,
          response: {
            status: "notfound",
            detail: "so there",
          },
        });
      });
      result.then(
        () => {
          rendered.update();

          expect(rendered.find("span.MuiTypography-caption").text()).toEqual(
            "No Daily Motion data available for this item"
          );

          done();
        },
        (err) => done.fail(err)
      );
    });
  });
});
