import React from "react";
import { mount, ReactWrapper } from "enzyme";
import YoutubeMaster from "../app/Master/YoutubeMaster";
import {
  Location,
  createMemoryHistory,
  createLocation,
  History,
} from "history";
import { match } from "react-router";

describe("YoutubeMaster", () => {
  describe("Admin User", () => {
    describe("Create Form", () => {
      let wrapper: ReactWrapper<
        any,
        Readonly<{}>,
        React.Component<{}, {}, any>
      >;
      let location: Location<History.UnknownFacade>;
      let match: match<{ masterid?: string }>;
      beforeEach(() => {
        const path = `/route/new`;

        match = {
          isExact: false,
          path,
          url: path,
          params: {},
        };
        location = createLocation(match.url);

        wrapper = mount(
          <YoutubeMaster
            history={createMemoryHistory()}
            location={location}
            match={match}
            isAdmin={true}
          />
        );
      });
      afterEach(() => {
        wrapper.unmount();
      });

      it("should render Create Form of YoutubeMaster", () => {
        const heading = wrapper.find("h4");
        expect(heading.exists()).toEqual(true);
        expect(heading.text()).toEqual("Create Youtube master");
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
        expect(errors.at(0).text()).toEqual("Youtube ID is required");
        expect(errors.at(1).text()).toEqual("Youtube title is required");
      });

      it("should not render errors when required fields are set", () => {
        const textFields = wrapper.find(".MuiInput-input");
        textFields.at(0).simulate("change", { target: { value: "id" } });
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
      let wrapper: ReactWrapper<
        any,
        Readonly<{}>,
        React.Component<{}, {}, any>
      >;
      let location: Location<History.UnknownFacade>;
      let match: match<{ masterid?: string }>;
      beforeEach(() => {
        const path = `/route/:masterid`;

        match = {
          isExact: false,
          path,
          url: path.replace(":masterid", "1"),
          params: {
            masterid: "1",
          },
        };
        location = createLocation(match.url);

        wrapper = mount(
          <YoutubeMaster
            history={createMemoryHistory()}
            location={location}
            match={match}
            isAdmin={true}
          />
        );
      });
      afterEach(() => {
        wrapper.unmount();
      });

      it("should render Edit Form of YoutubeMaster", () => {
        const heading = wrapper.find("h4");
        expect(heading.exists()).toEqual(true);
        expect(heading.text()).toEqual("Edit Youtube master");
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

  describe("Normal User", () => {
    describe("Create Form", () => {
      let wrapper: ReactWrapper<
        any,
        Readonly<{}>,
        React.Component<{}, {}, any>
      >;
      let location: Location<History.UnknownFacade>;
      let match: match<{ masterid?: string }>;
      beforeEach(() => {
        const path = `/route/new`;

        match = {
          isExact: false,
          path,
          url: path,
          params: {},
        };
        location = createLocation(match.url);

        wrapper = mount(
          <YoutubeMaster
            history={createMemoryHistory()}
            location={location}
            match={match}
            isAdmin={false}
          />
        );
      });
      afterEach(() => {
        wrapper.unmount();
      });

      it("should render Create Form of YoutubeMaster", () => {
        const heading = wrapper.find("h4");
        expect(heading.exists()).toEqual(true);
        expect(heading.text()).toEqual("Create Youtube master");
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
    });

    describe("Edit Form", () => {
      let wrapper: ReactWrapper<
        any,
        Readonly<{}>,
        React.Component<{}, {}, any>
      >;
      let location: Location<History.UnknownFacade>;
      let match: match<{ masterid?: string }>;
      beforeEach(() => {
        const path = `/route/:masterid`;

        match = {
          isExact: false,
          path,
          url: path.replace(":masterid", "1"),
          params: {
            masterid: "1",
          },
        };
        location = createLocation(match.url);

        wrapper = mount(
          <YoutubeMaster
            history={createMemoryHistory()}
            location={location}
            match={match}
            isAdmin={false}
          />
        );
      });
      afterEach(() => {
        wrapper.unmount();
      });

      it("should render Edit Form of YoutubeMaster", () => {
        const heading = wrapper.find("h4");
        expect(heading.exists()).toEqual(true);
        expect(heading.text()).toEqual("Edit Youtube master");
      });

      it("should expect the fields to be read-only", () => {
        const fields = wrapper
          .find("input.MuiInputBase-input.MuiInput-input")
          .not(".MuiAutocomplete-input");

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
