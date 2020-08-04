import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  IconButton,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import {
  RouteComponentProps,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";

interface HeaderTitles {
  label: string;
  key?: keyof Project;
}

declare var deploymentRootPath: string;

const tableHeaderTitles: HeaderTitles[] = [
  { label: "Project title", key: "name" },
  { label: "Project ID", key: "project_id" },
  { label: "Created", key: "created" },
  { label: "Open" },
];

interface ProjectsListProps {}

interface ProjectsListState {
  loading?: boolean;
  lastError?: object | null;
  projectsList?: Array<object>;
}

interface Project {
  project_id: string;
  name: string;
  created: string;
}

const useStyles = makeStyles({
  table: {
    maxWidth: "100%",
  },
  createButton: {
    display: "flex",
    marginLeft: "auto",
    marginBottom: "0.625rem",
  },
  visuallyHidden: {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    top: 20,
    width: 1,
  },
});
const pageSizeOptions = [25, 50, 100];

/*

 */
type SortDirection = "asc" | "desc";

const ActionIcons: React.FC<{ id: string }> = (props) => (
  <span className="icons">
    <IconButton href={`${deploymentRootPath}project/${props.id}`}>
      <EditIcon />
    </IconButton>
  </span>
);

const ProjectsListComponent: React.FC<RouteComponentProps> = () => {
  // React Router
  const history = useHistory();
  const { search } = useLocation();

  // React state
  const [order, setOrder] = useState<SortDirection>("asc");
  const [orderBy, setOrderBy] = useState<keyof Project>("name");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastError, setLastError] = useState<object | null>(null);
  // Material-UI
  const classes = useStyles();

  const fetchProjectsOnPage = async () => {
    await setLoading(true);

    try {
      const server_response = await axios.get("/api/bundle");
      return Promise.all([
        setProjects(server_response.data),
        setLoading(false),
        setLastError(null),
      ]);
    } catch (error) {
      return Promise.all([setLastError(error), setLoading(false)]);
    }
  };

  useEffect(() => {
    fetchProjectsOnPage();
  }, []); //empty array => call on component startup not modify

  return (
    <>
      <h2>Deliverables</h2>
      <Button
        className={classes.createButton}
        variant="outlined"
        onClick={() => history.push("/project/new")}
      >
        New
      </Button>
      <Paper elevation={3}>
        <TableContainer>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                {tableHeaderTitles.map((title, idx) => (
                  <TableCell key={title.label ?? idx}>{title.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((entry, idx) => (
                <TableRow key={idx}>
                  <TableCell>{entry.name}</TableCell>
                  <TableCell>{entry.project_id}</TableCell>
                  <TableCell>{entry.created}</TableCell>
                  <TableCell>
                    <ActionIcons id={entry.project_id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};
export default ProjectsListComponent;
