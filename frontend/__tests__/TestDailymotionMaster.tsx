import React from "react";
import { mount, ReactWrapper } from "enzyme";
import DailymotionMaster from "../app/Master/DailymotionMaster";
import {
  Location,
  createMemoryHistory,
  createLocation,
  History,
} from "history";
import { match } from "react-router";
import moxios from "moxios";
import { act } from "react-dom/test-utils";

describe("DailymotionMaster", () => {
  describe("Create Form", () => {
    let wrapper: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
    let location: Location<History.UnknownFacade>;
    let match: match<{
      projectid: string;
      assetid: string;
    }>;
    beforeEach(async () => {
      moxios.install();
      const path = "/project/:projectid/asset/:assetid/dailymotion";

      match = {
        isExact: false,
        path,
        url: path,
        params: {
          projectid: "1",
          assetid: "1",
        },
      };
      location = createLocation(match.url);

      wrapper = mount(
        <DailymotionMaster
          history={createMemoryHistory()}
          location={location}
          match={match}
        />
      );

      await moxios.wait(jest.fn);
      await act(async () => {
        await moxios.requests.mostRecent().respondWith({
          status: 404,
          response: {},
        });
      });
      // Needed otherwise enzyme doesn't find the updated elements.
      wrapper.update();
    });
    afterEach(() => {
      moxios.uninstall();
      wrapper.unmount();
    });

    it("should render Create Form of DailymotionMaster", () => {
      const heading = wrapper.find("h4");
      expect(heading.exists()).toEqual(true);
      expect(heading.text()).toEqual("Create Dailymotion master");
    });

    it("should expect the fields to be read and write", () => {
      const fields = wrapper
        .find("input.MuiInputBase-input.MuiInput-input")
        .not(".MuiAutocomplete-input");

      fields.forEach((field) => {
        expect(field.prop("disabled")).toEqual(false);
      });
      const autocomplete = wrapper.find(
        ".MuiInputBase-input.MuiInput-input.MuiAutocomplete-input"
      );
      expect(autocomplete.prop("disabled")).toEqual(false);
      const textArea = wrapper.find("textarea");
      expect(textArea.prop("disabled")).toEqual(false);
      const button = wrapper.find(`button[type="submit"]`);
      expect(button.prop("disabled")).toEqual(false);
    });

    it("should render errors when required fields are not set", () => {
      const button = wrapper.find(`button[type="submit"]`);

      button.simulate("submit");

      const errors = wrapper.find(
        ".MuiFormHelperText-root.Mui-error.Mui-required"
      );
      expect(errors).toHaveLength(2);
      expect(errors.at(0).text()).toEqual("Dailymotion URL is required");
      expect(errors.at(1).text()).toEqual("Dailymotion title is required");
    });

    it("should not render errors when required fields are set", () => {
      const textFields = wrapper.find(
        "input.MuiInputBase-input.MuiInput-input"
      );

      textFields.at(0).simulate("change", { target: { value: "url" } });
      textFields.at(1).simulate("change", { target: { value: "title" } });

      const button = wrapper.find(`button[type="submit"]`);

      button.simulate("submit");

      const errors = wrapper.find(
        ".MuiFormHelperText-root.Mui-error.Mui-required"
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("Edit Form", () => {
    let wrapper: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
    let location: Location<History.UnknownFacade>;
    let match: match<{
      projectid: string;
      assetid: string;
    }>;
    beforeEach(async () => {
      moxios.install();
      const path = "/project/:projectid/asset/:assetid/dailymotion";

      match = {
        isExact: false,
        path,
        url: path,
        params: {
          projectid: "1",
          assetid: "1",
        },
      };
      location = createLocation(match.url);

      wrapper = mount(
        <DailymotionMaster
          history={createMemoryHistory()}
          location={location}
          match={match}
        />
      );

      await moxios.wait(jest.fn);
      await act(async () => {
        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: {},
        });
      });
      // Needed otherwise enzyme doesn't find the updated elements.
      wrapper.update();
    });
    afterEach(() => {
      moxios.uninstall();
      wrapper.unmount();
    });

    it("should render Edit Form of DailymotionMaster", () => {
      const heading = wrapper.find("h4");
      expect(heading.exists()).toEqual(true);
      expect(heading.text()).toEqual("Edit Dailymotion master");
    });

    it("should expect the fields to be read and write", () => {
      const fields = wrapper
        .find("input.MuiInputBase-input.MuiInput-input")
        .not(".MuiAutocomplete-input");
      const readonlyFields = fields.slice(0, 3);
      const formFields = fields.slice(3, fields.length);

      readonlyFields.forEach((readonlyField) => {
        expect(readonlyField.prop("disabled")).toEqual(true);
      });

      formFields.forEach((field) => {
        expect(field.prop("disabled")).toEqual(false);
      });
      const autocomplete = wrapper.find(
        ".MuiInputBase-input.MuiInput-input.MuiAutocomplete-input"
      );
      expect(autocomplete.prop("disabled")).toEqual(false);
      const textArea = wrapper.find("textarea");
      expect(textArea.prop("disabled")).toEqual(false);
      const button = wrapper.find(`button[type="submit"]`);
      expect(button.prop("disabled")).toEqual(false);
    });
  });
});
