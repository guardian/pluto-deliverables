import React from "react";
import { render } from "react-dom";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import { ThemeProvider, createMuiTheme } from "@material-ui/core";
import { config, library } from "@fortawesome/fontawesome-svg-core";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import ProjectsListComponent from "./ProjectsListComponent";
import axios from "axios";
import ProjectDeliverablesComponent from "./ProjectDeliverablesComponent";

const theme = createMuiTheme({
  typography: {
    fontFamily: [
      "sans-serif",
      '"Helvetica Neue"',
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
    fontWeight: 400,
  },
});

//this is set in the html template file and gives us the value of deployment-root from the server config
axios.defaults.baseURL = deploymentRootPath;
axios.interceptors.request.use(function (config) {
  const token = window.sessionStorage.getItem("pluto:access-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

class App extends React.Component {
  render() {
    return (
      <ThemeProvider theme={theme}>
        <Switch>
          <Route
              path="/project/:projectid"
              component={ProjectDeliverablesComponent}
          />
          <Route exact path="/" component={ProjectsListComponent} />
        </Switch>
      </ThemeProvider>
    );
  }
}

render(
  <BrowserRouter basename={deploymentRootPath}>
    <App />
  </BrowserRouter>,
  document.getElementById("app")
);
