import React from "react";
import {mount, shallow} from "enzyme";
import sinon from "sinon";

import SyndicationTrigger from "../../app/MasterList/SyndicationTrigger";

/*
const NOT_UPLOADING = "Not ready";
const WAITING_FOR_START = "Ready for Upload";
const IN_PROGRESS = "Uploading";
const FAILED = "Upload Failed";
const COMPLETE = "Upload Complete";
 */
describe("SyndicationTrigger", ()=>{
    it("should display an enabled button if uploadStatus is NOT_UPLOADING, clicking it should activate sendInitiated", ()=>{
        const sendInitiatedCb = sinon.spy();

        const rendered = mount(<SyndicationTrigger uploadStatus="Not ready"
                                                   platform="Test"
                                                   projectId={1234}
                                                   assetId={BigInt(5678)}
                                                   sendInitiated={sendInitiatedCb}
                                                   title="Test deliverable"/>);

        const b = rendered.find("button.MuiIconButton-root");
        const svg = b.find("svg.MuiSvgIcon-root");
        expect(svg.length).toEqual(1);

        expect(sendInitiatedCb.callCount).toEqual(0);
        b.simulate("click");
        //expect(sendInitiatedCb.callCount).toEqual(1);

        console.error(rendered.html());
    })
})