import React, { ReactComponentElement, useState } from "react";
import { RouteComponentProps } from "react-router";
import { useHistory, useLocation } from "react-router-dom";
import Select from "@material-ui/core/Select";
import { MenuItem, ListSubheader } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";

interface DeliverableTypeSelectorProps {
  content: DeliverableTypes;
  value: number | null;
  onChange: (newvalue: number) => void;
  showTip: boolean;
}

const DeliverableTypeSelector: React.FC<DeliverableTypeSelectorProps> = (
  props
) => {
  const [deliverableType, setDeliverableType] = useState<number | null>(
    props.value
  );

  const renderMenuGroups = (section: string) => {
    const items = props.content[section].map((entry) => (
      <MenuItem key={entry[0]} value={entry[0]} style={{ marginLeft: "20px" }}>
        {entry[1]}
      </MenuItem>
    ));
    return [<ListSubheader>{section}</ListSubheader>, items];
  };

  return (
    <FormControl>
      <Select
        value={deliverableType ?? ""}
        onChange={(evt) => {
          const type = parseInt(evt.target.value as string);

          props.onChange(type);

          setDeliverableType(type);
        }}
      >
        {Object.keys(props.content).map((section_name) =>
          renderMenuGroups(section_name)
        )}
      </Select>
      {props.showTip ? (
        <FormHelperText>Select a type to begin media ingest</FormHelperText>
      ) : (
        ""
      )}
    </FormControl>
  );
};

export default DeliverableTypeSelector;
