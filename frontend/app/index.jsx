import React from "react";
import { render } from "react-dom";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import { ThemeProvider, createMuiTheme } from "@material-ui/core";
import { config, library } from "@fortawesome/fontawesome-svg-core";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import ProjectsListComponent from "./ProjectsListComponent";
import axios from "axios";
import ProjectDeliverablesComponent from "./ProjectDeliverablesComponent";
import CreateDeliverable from "./CreateDeliverable";
import { Header, AppSwitcher, handleUnauthorized } from "pluto-headers";
import NotLoggedIn from "./NotLoggedIn";

require("./app.css");

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
  const token = window.localStorage.getItem("pluto:access-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      isLoggedIn: false,
      tokenExpired: false,
      plutoConfig: {},
    };

    this.handleUnauthorizedFailed = this.handleUnauthorizedFailed.bind(this);
    this.onLoginValid = this.onLoginValid.bind(this);

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        handleUnauthorized(
          this.state.plutoConfig,
          error,
          this.handleUnauthorizedFailed
        );

        return Promise.reject(error);
      }
    );
  }

  handleUnauthorizedFailed() {
    this.setState({
      isLoggedIn: false,
      tokenExpired: true,
    });
  }

  async onLoginValid(valid, loginData) {
    // Fetch the oauth config
    try {
      const response = await fetch("/meta/oauth/config.json");
      if (response.status === 200) {
        const data = await response.json();
        this.setState({ plutoConfig: data });
      }
    } catch (error) {
      console.error(error);
    }

    this.setState(
      {
        isLoggedIn: valid,
      },
      () => {
        this.setState({ loading: false });
      }
    );
  }

  render() {
    if (!this.state.loading && !this.state.isLoggedIn) {
      console.log("not logged in, redirecting to route");
      return <NotLoggedIn tokenExpired={this.state.tokenExpired} timeOut={5} />;
    }

    return (
      <ThemeProvider theme={theme}>
        <>
          <Header></Header>
          <AppSwitcher onLoginValid={this.onLoginValid}></AppSwitcher>
        </>
        <div className="main-body">
          <Switch>
            <Route
              path="/project/:projectid/new"
              component={CreateDeliverable}
            />
            <Route path="/project/new" component={CreateDeliverable} />
            <Route
              path="/project/:projectid"
              component={ProjectDeliverablesComponent}
            />
            <Route exact path="/" component={ProjectsListComponent} />
          </Switch>
        </div>
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
