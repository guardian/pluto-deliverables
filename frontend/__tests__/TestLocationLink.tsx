import React from "react";
import { mount, shallow } from "enzyme";
import sinon from "sinon";
import moxios from "moxios";
import LocationLink from "../app/LocationLink";

jest.mock("pluto-headers", () => ({
    SystemNotification: {
        open: jest.fn(),
    },
    SystemNotifcationKind: {
        Success: "success",
        Error: "error",
    },
}));

describe("LocationLink", ()=>{
    beforeEach(()=>{
        moxios.install();
    });

    afterEach(()=>{
        moxios.uninstall();
    });

    it("should present a local upload button which verifies folder existence", (done)=>{
        window.open = sinon.spy();
        const networkUploadSelectedCb = sinon.spy();
        const fakeBundle:Project = {
            project_id: "1234",
            pluto_core_project_id: 2345,
            commission_id: 567,
            name: "test",
            created: "2019-01-02T03:04:05Z",
            local_open_uri: "pluto:openfolder:/path/to/something",
            local_path: "/path/to/something"
        }
        const rendered = mount(<LocationLink bundleInfo={fakeBundle} networkUploadSelected={networkUploadSelectedCb}/>);

        const localButton = rendered.find("button#local-open");

        localButton.simulate("click");

        moxios.wait(async ()=>{
            try {
                const req = moxios.requests.mostRecent();
                expect(req.url).toEqual("/api/bundle/2345/dropfolder");
                const response = await req.respondWith({
                    status: 200,
                    response: {
                        status: "ok",
                        clientpath: "/Volumes/shared/something"
                    }
                });
                // @ts-ignore
                expect(window.open.callCount).toEqual(1);
                // @ts-ignore
                expect(window.open.firstCall.args[0]).toEqual("pluto:openfolder:/Volumes/shared/something");

                expect(networkUploadSelectedCb.callCount).toEqual(0);
                done();
            } catch(err) {
                done.fail(err);
            }
        })
    });

    it("should still attempt to open the default uri if the call fails", (done)=>{
        window.open = sinon.spy();
        const networkUploadSelectedCb = sinon.spy();
        const fakeBundle:Project = {
            project_id: "1234",
            pluto_core_project_id: 2345,
            commission_id: 567,
            name: "test",
            created: "2019-01-02T03:04:05Z",
            local_open_uri: "pluto:openfolder:/path/to/something",
            local_path: "/path/to/something"
        }
        const rendered = mount(<LocationLink bundleInfo={fakeBundle} networkUploadSelected={networkUploadSelectedCb}/>);

        const localButton = rendered.find("button#local-open");

        localButton.simulate("click");

        moxios.wait(async ()=>{
            try {
                const req = moxios.requests.mostRecent();
                expect(req.url).toEqual("/api/bundle/2345/dropfolder");
                const response = await req.respondWith({
                    status: 500,
                    response: {
                        status: "error"
                    }
                });
                // @ts-ignore
                expect(window.open.callCount).toEqual(1);
                // @ts-ignore
                expect(window.open.firstCall.args[0]).toEqual("pluto:openfolder:/path/to/something");

                expect(networkUploadSelectedCb.callCount).toEqual(0);
                done();
            } catch(err) {
                done.fail(err);
            }
        })
    });

    it("should not attempt to open anything if the bundle does not exist", (done)=>{
        window.open = sinon.spy();
        const networkUploadSelectedCb = sinon.spy();
        const fakeBundle:Project = {
            project_id: "1234",
            pluto_core_project_id: 2345,
            commission_id: 567,
            name: "test",
            created: "2019-01-02T03:04:05Z",
            local_open_uri: "pluto:openfolder:/path/to/something",
            local_path: "/path/to/something"
        }
        const rendered = mount(<LocationLink bundleInfo={fakeBundle} networkUploadSelected={networkUploadSelectedCb}/>);

        const localButton = rendered.find("button#local-open");

        localButton.simulate("click");

        moxios.wait(async ()=>{
            try {
                const req = moxios.requests.mostRecent();
                expect(req.url).toEqual("/api/bundle/2345/dropfolder");
                const response = await req.respondWith({
                    status: 404,
                    response: {
                        status: "error"
                    }
                });
                // @ts-ignore
                expect(window.open.callCount).toEqual(0);

                expect(networkUploadSelectedCb.callCount).toEqual(0);
                done();
            } catch(err) {
                done.fail(err);
            }
        })
    });

    it("should present a remote upload button that invokes the callback when clicked", ()=>{
        window.open = sinon.spy();
        const networkUploadSelectedCb = sinon.spy();
        const fakeBundle:Project = {
            project_id: "1234",
            pluto_core_project_id: 2345,
            commission_id: 567,
            name: "test",
            created: "2019-01-02T03:04:05Z",
            local_open_uri: "pluto:openfolder:/path/to/something",
            local_path: "/path/to/something"
        }
        const rendered = mount(<LocationLink bundleInfo={fakeBundle} networkUploadSelected={networkUploadSelectedCb}/>);

        const remoteButton = rendered.find("button#remote-upload");
        remoteButton.simulate("click");
        expect(networkUploadSelectedCb.callCount).toEqual(1);
        // @ts-ignore
        expect(window.open.callCount).toEqual(0);
    })
})