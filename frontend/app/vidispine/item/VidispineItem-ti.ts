/**
 * This module was automatically generated by `ts-interface-builder`
 */
import * as t from "ts-interface-checker";
// tslint:disable:object-literal-key-quotes

export const MetadataValue = t.iface([], {
  value: "string",
  uuid: t.opt("string"),
  user: t.opt("string"),
  timestamp: t.opt("string"),
  change: t.opt("string"),
});

export const MetadataField = t.iface([], {
  name: "string",
  value: t.array("MetadataValue"),
  uuid: t.opt("string"),
  user: t.opt("string"),
  timestamp: t.opt("string"),
  change: t.opt("string"),
});

export const MetadataGroup = t.iface([], {
  name: "string",
  field: t.array("MetadataField"),
});

export const MetadataTimespan = t.iface([], {
  field: t.array("MetadataField"),
  group: t.array("MetadataGroup"),
  start: "string",
  end: "string",
});

export const ItemMetadata = t.iface([], {
  revision: "string",
  timespan: t.array("MetadataTimespan"),
});

export const ItemIF = t.iface([], {
  metadata: "ItemMetadata",
  id: "string",
});

export const ItemResponse = t.iface([], {
  item: t.array("ItemIF"),
});

const exportedTypeSuite: t.ITypeSuite = {
  MetadataValue,
  MetadataField,
  MetadataGroup,
  MetadataTimespan,
  ItemMetadata,
  ItemIF,
  ItemResponse,
};
export default exportedTypeSuite;
