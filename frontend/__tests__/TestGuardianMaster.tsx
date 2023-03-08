import React from "react";
import { mount, ReactWrapper } from "enzyme";
import GuardianMaster from "../app/Master/GuardianMaster";
import {
  Location,
  createMemoryHistory,
  createLocation,
  History,
} from "history";
import { match } from "react-router";
import { validProductionOffices } from "../app/utils/constants";
import { Select } from "@material-ui/core";
import moxios from "moxios";
import { act } from "react-dom/test-utils";

describe("GuardianMaster", () => {
  describe("Admin User", () => {
    describe("Create Form", () => {
      let wrapper: ReactWrapper<
        any,
        Readonly<{}>,
        React.Component<{}, {}, any>
      >;
      let location: Location<History.UnknownFacade>;
      let match: match<{
        projectid: string;
        assetid: string;
      }>;
      beforeEach(async () => {
        moxios.install();
        const path = "/project/:projectid/asset/:assetid/atom";

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
          <GuardianMaster
            history={createMemoryHistory()}
            location={location}
            match={match}
            isAdmin={true}
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

      it("should render Create Form of GuardianMaster", () => {
        const heading = wrapper.find("h4");
        expect(heading.exists()).toEqual(true);
        expect(heading.text()).toEqual("Create GNM website");
      });

      it("should expect the fields to be read and write", () => {
        const fields = wrapper
          .find("input.MuiInputBase-input.MuiInput-input")
          .not(".MuiAutocomplete-input");

        const selectFields = wrapper.find(".MuiSelect-select");

        selectFields.forEach((field) => {
          expect(field.prop("aria-disabled")).toEqual(undefined);
        });

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
        expect(errors.at(0).text()).toEqual("Production Office is required");
        expect(errors.at(1).text()).toEqual("Website title is required");
      });

      it("should not render errors when required fields are set", () => {
        const selectField = wrapper.find(Select).at(0);
        const textFields = wrapper.find(
          "input.MuiInputBase-input.MuiInput-input"
        );

        selectField
          .find("input")
          .simulate("change", { target: { value: validProductionOffices[0] } });
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
      let wrapper: ReactWrapper<
        any,
        Readonly<{}>,
        React.Component<{}, {}, any>
      >;
      let location: Location<History.UnknownFacade>;
      let match: match<{
        projectid: string;
        assetid: string;
      }>;
      beforeEach(async () => {
        moxios.install();
        const path = "/project/:projectid/asset/:assetid/atom";

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
          <GuardianMaster
            history={createMemoryHistory()}
            location={location}
            match={match}
            isAdmin={true}
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

      it("should render Edit Form of GuardianMaster", () => {
        const heading = wrapper.find("h4");
        expect(heading.exists()).toEqual(true);
        expect(heading.text()).toEqual("Edit GNM website");
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

        const selectFields = wrapper.find(".MuiSelect-select");

        selectFields.forEach((field) => {
          expect(field.prop("aria-disabled")).toEqual(undefined);
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

  describe("Normal User", () => {
    describe("Create Form", () => {
      let wrapper: ReactWrapper<
        any,
        Readonly<{}>,
        React.Component<{}, {}, any>
      >;
      let location: Location<History.UnknownFacade>;
      let match: match<{
        projectid: string;
        assetid: string;
      }>;
      beforeEach(async () => {
        moxios.install();
        const path = "/project/:projectid/asset/:assetid/atom";

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
          <GuardianMaster
            history={createMemoryHistory()}
            location={location}
            match={match}
            isAdmin={false}
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

      it("should render Create Form of GuardianMaster", () => {
        const heading = wrapper.find("h4");
        expect(heading.exists()).toEqual(true);
        expect(heading.text()).toEqual("Create GNM website");
      });

      it("should expect the fields to be read only", () => {
        const fields = wrapper
          .find("input.MuiInputBase-input.MuiInput-input")
          .not(".MuiAutocomplete-input");

        const selectFields = wrapper.find(".MuiSelect-select");

        selectFields.forEach((field) => {
          expect(field.prop("aria-disabled")).toEqual("true");
        });

        fields.forEach((field) =>
          expect(field.prop("disabled")).toEqual(true)
        );
        const autocomplete = wrapper.find(
          ".MuiInputBase-input.MuiInput-input.MuiAutocomplete-input"
        );
        expect(autocomplete.prop("disabled")).toEqual(true);
        const textArea = wrapper.find("textarea");
        expect(textArea.prop("disabled")).toEqual(true);
        const button = wrapper.find(`button[type="submit"]`);
        expect(button.prop("disabled")).toEqual(true);
      });
    });
    describe("Edit Form", () => {
      let wrapper: ReactWrapper<
        any,
        Readonly<{}>,
        React.Component<{}, {}, any>
      >;
      let location: Location<History.UnknownFacade>;
      let match: match<{
        projectid: string;
        assetid: string;
      }>;
      beforeEach(async () => {
        moxios.install();
        const path = "/project/:projectid/asset/:assetid/atom";

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
          <GuardianMaster
            history={createMemoryHistory()}
            location={location}
            match={match}
            isAdmin={false}
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

      it("should render Edit Form of GuardianMaster", () => {
        const heading = wrapper.find("h4");
        expect(heading.exists()).toEqual(true);
        expect(heading.text()).toEqual("Edit GNM website");
      });

      it("should expect the fields to be read-only", () => {
        const fields = wrapper
          .find("input.MuiInputBase-input.MuiInput-input")
          .not(".MuiAutocomplete-input");
        const selectFields = wrapper.find(".MuiSelect-select");

        selectFields.forEach((field) => {
          expect(field.prop("aria-disabled")).toEqual("true");
        });

        fields.forEach((field) => {
          expect(field.prop("disabled")).toEqual(true);
        });
        const autocomplete = wrapper.find(
          ".MuiInputBase-input.MuiInput-input.MuiAutocomplete-input"
        );
        expect(autocomplete.prop("disabled")).toEqual(true);
        const textArea = wrapper.find("textarea");
        expect(textArea.prop("disabled")).toEqual(true);
        const button = wrapper.find(`button[type="submit"]`);
        expect(button.prop("disabled")).toEqual(true);
      });
    });
  });
});
