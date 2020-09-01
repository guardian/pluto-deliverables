import React from "react";
import { mount, ReactWrapper } from "enzyme";
import MainstreamMaster from "../app/Master/MainstreamMaster";
import {
  Location,
  createMemoryHistory,
  createLocation,
  History,
} from "history";
import { match } from "react-router";
import moxios from "moxios";
import { act } from "react-dom/test-utils";

describe("MainstreamMaster", () => {
  describe("Create Form", () => {
    let wrapper: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
    let location: Location<History.UnknownFacade>;
    let match: match<{
      projectid: string;
      assetid: string;
    }>;
    beforeEach(async () => {
      moxios.install();
      const path = "/project/:projectid/asset/:assetid/mainstream/new";

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
        <MainstreamMaster
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

    it("should render Create Form of MainstreamMaster", () => {
      const heading = wrapper.find("h4");
      expect(heading.exists()).toEqual(true);
      expect(heading.text()).toEqual("Create Mainstream master");
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
      expect(errors).toHaveLength(1);
      expect(errors.at(0).text()).toEqual("Mainstream title is required");
    });

    it("should not render errors when required fields are set", () => {
      const textFields = wrapper.find(
        "input.MuiInputBase-input.MuiInput-input"
      );

      textFields.at(0).simulate("change", { target: { value: "title" } });

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
      const path = "/project/:projectid/asset/:assetid/mainstream";

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
        <MainstreamMaster
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

    it("should render Edit Form of MainstreamMaster", () => {
      const heading = wrapper.find("h4");
      expect(heading.exists()).toEqual(true);
      expect(heading.text()).toEqual("Edit Mainstream master");
    });

    it("should expect the fields to be read and write", () => {
      const fields = wrapper
        .find("input.MuiInputBase-input.MuiInput-input")
        .not(".MuiAutocomplete-input");
      const readonlyFields = fields.slice(0, 1);
      const formFields = fields.slice(1, fields.length);

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
