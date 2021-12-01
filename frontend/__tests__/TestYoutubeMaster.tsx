import React from "react";
import {mount} from "enzyme";
import YoutubeMaster from "../app/Master/YoutubeMaster";
import {
  createMemoryHistory,
  createLocation,
} from "history";
import moxios from "moxios";
import { act } from "react-dom/test-utils";

describe("YoutubeMaster", () => {
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

    const mockInfo:YoutubeMaster = {
      publication_date: "2010-01-02T03:04:05Z",
      youtube_description: "some description",
      youtube_id: "xyzabc123",
      youtube_tags: ["tag1","tag2"],
      youtube_title: "some title",
      youtube_category: "cat1",
      youtube_channel: "chan1"
    }
    const rendered = mount(<YoutubeMaster history={createMemoryHistory()}
                                            location={location}
                                            match={match}/>);

    moxios.wait(()=>{
      const result = act(async ()=>{
        const req = moxios.requests.mostRecent();
        expect(!!req).toBeTruthy();
        expect(req.url).toEqual("/api/bundle/1/asset/2/youtube");

        await req.respondWith({
          status: 200,
          response: mockInfo
        });
      });
      result.then(()=>{
        rendered.update();
        expect(rendered.find("input#yt-publication-date").props()["value"]).toEqual("2010-01-02T03:04:05Z")
        expect(rendered.find("p#yt-category").text()).toEqual("cat1");
        expect(rendered.find("p#yt-channel").text()).toEqual("chan1");
        expect(rendered.find("input#yt-id").props()["value"]).toEqual("xyzabc123");
        expect(rendered.find("input#yt-title").props()["value"]).toEqual("some title");
        expect(rendered.find("textarea#yt-description").props()["value"]).toEqual("some description");
        expect(rendered.find("span.MuiChip-label").length).toEqual(2);
        expect(rendered.find("span.MuiChip-label").at(0).text()).toEqual("tag1");
        expect(rendered.find("span.MuiChip-label").at(1).text()).toEqual("tag2");

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

    const rendered = mount(<YoutubeMaster history={createMemoryHistory()}
                                          location={location}
                                          match={match}/>);

    moxios.wait(()=>{
      const result = act(async ()=>{
        const req = moxios.requests.mostRecent();
        expect(!!req).toBeTruthy();
        expect(req.url).toEqual("/api/bundle/1/asset/2/youtube");

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
        expect(rendered.find("input#yt-publication-date").props()["value"]).toEqual("")
        expect(rendered.find("p#yt-category").text()).toEqual("");
        expect(rendered.find("p#yt-channel").text()).toEqual("");
        expect(rendered.find("input#yt-id").props()["value"]).toEqual("");
        expect(rendered.find("input#yt-title").props()["value"]).toEqual("");
        expect(rendered.find("textarea#yt-description").props()["value"]).toEqual("");
        expect(rendered.find("span.MuiChip-label").length).toEqual(0);

        done();
      }, (err)=>done.fail(err))
    })
  });
});
