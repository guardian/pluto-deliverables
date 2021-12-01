import React from "react";
import { mount } from "enzyme";
import MainstreamMaster from "../app/Master/MainstreamMaster";
import {
  createMemoryHistory,
  createLocation,
} from "history";
import moxios from "moxios";
import { act } from "react-dom/test-utils";

describe("MainstreamMaster", () => {
  beforeEach(()=>{
    moxios.install();
  });

  afterEach(()=>{
    moxios.uninstall();
  })

  it("should populate data on load",  (done)=>{
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

    const mockInfo:MainstreamMaster = {
      etag: "asfasdfsadfs",
      mainstream_description: "some description",
      mainstream_rules_contains_adult_content: true,
      mainstream_tags: ["tag1", "tag2"],
      mainstream_title: "some title",
      publication_date: "2010-01-02T03:04:05Z",
      upload_status: "Published"
    };

    const rendered = mount(<MainstreamMaster history={createMemoryHistory()}
                                          location={location}
                                          match={match}/>);

    moxios.wait(()=>{
      const result = act(async ()=>{
        const req = moxios.requests.mostRecent();
        expect(!!req).toBeTruthy();
        expect(req.url).toEqual("/api/bundle/1/asset/2/mainstream");

        await req.respondWith({
          status: 200,
          response: mockInfo
        });
      });

      result.then(()=>{
        rendered.update();
        expect(rendered.find("input#ms-title").props()["value"]).toEqual("some title");
        expect(rendered.find("textarea#ms-description").props()["value"]).toEqual("some description");
        expect(rendered.find("input#ms-title").props()["value"]).toEqual("some title");
        expect(rendered.find("span.MuiChip-label").length).toEqual(2);
        expect(rendered.find("span.MuiChip-label").at(0).text()).toEqual("tag1");
        expect(rendered.find("span.MuiChip-label").at(1).text()).toEqual("tag2");
        expect(rendered.find("input#ms-restricted").props()["checked"]).toEqual(true);
        done();
      }, (err)=>done.fail(err))
    })
  });

  it("should present an empty form if a 404 is returned",  (done)=>{
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

    const rendered = mount(<MainstreamMaster history={createMemoryHistory()}
                                          location={location}
                                          match={match}/>);

    moxios.wait(()=>{
      const result = act(async ()=>{
        const req = moxios.requests.mostRecent();
        expect(!!req).toBeTruthy();
        expect(req.url).toEqual("/api/bundle/1/asset/2/mainstream");

        await req.respondWith({
          status: 404,
          response: {
            status: "notfound",
            detail: "so there"
          }
        });
      });
      result.then(()=>{
        rendered.update();

        expect(rendered.find("span.MuiTypography-caption").text()).toEqual("No Mainstream data available for this item");

        done();
      }, (err)=>done.fail(err))
    })
  });
});
