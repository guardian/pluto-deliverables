import React from "react";
import { render } from "react-dom";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { CssBaseline } from "@material-ui/core";
import ProjectsListComponent from "./ProjectsListComponent";
import axios from "axios";
import ProjectDeliverablesComponent from "./ProjectDeliverablesComponent";
import CreateDeliverable from "./CreateDeliverable";
import {
  Header,
  AppSwitcher,
  handleUnauthorized,
  PlutoThemeProvider,
} from "pluto-headers";
import NotLoggedIn from "./NotLoggedIn";
import GuardianMaster from "./Master/GuardianMaster";
import YoutubeMaster from "./Master/YoutubeMaster";
import MainstreamMaster from "./Master/MainstreamMaster";
import DailymotionMaster from "./Master/DailymotionMaster";
import { SystemNotification } from "pluto-headers";
import { Helmet } from "react-helmet";
import AssetSearchComponent from "./AssetSearchComponent";
import BundleRedirect from "./BundleRedirect";
import InvalidDeliverablesComponent from "./InvalidDeliverablesComponent";
import DeliverablesDashFront from "./DeliverablesDash/DeliverablesDashFront";
import DeliverableItem from "./DeliverableItem/DeliverableItem";

require("./app.css");

axios.interceptors.request.use(function (config) {
  const token = window.localStorage.getItem("pluto:access-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Only apply deployment root when url begins with /api
  if (config.url.startsWith("/api")) {
    //deploymentRootPath is set in the index template from server-side configuration and referenced here
    config.baseURL = deploymentRootPath;
  }

  return config;
});

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      isLoggedIn: false,
      isAdmin: false,
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
    let config;
    try {
      const response = await fetch("/meta/oauth/config.json");
      if (response.status === 200) {
        config = await response.json();
        this.setState({ plutoConfig: config });
      }
    } catch (error) {
      console.error(error);
    }

    this.setState(
      {
        isLoggedIn: valid,
        isAdmin:
          loginData ??
          (config && loginData.hasOwnProperty(config.adminClaimName)),
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
      <PlutoThemeProvider>
        <CssBaseline />
        <Helmet>
          <title>Pluto – Deliverables</title>
        </Helmet>
        <>
          <Header />
          <AppSwitcher onLoginValid={this.onLoginValid} />
        </>
        <div className="main-body">
          <Switch>
            <Route path="/item/:assetId" component={DeliverableItem} />
            <Route
              path="/project/:projectid/new"
              component={CreateDeliverable}
            />
            <Route path="/project/new" component={CreateDeliverable} />
            <Route
              path="/project/:projectid/asset/:assetid/atom"
              render={(props) => (
                <GuardianMaster {...props} isAdmin={this.state.isAdmin} />
              )}
            />
            <Route
              path="/project/:projectid/asset/:assetid/youtube"
              render={(props) => (
                <YoutubeMaster {...props} isAdmin={this.state.isAdmin} />
              )}
            />
            <Route
              path="/project/:projectid/asset/:assetid/mainstream"
              render={(props) => <MainstreamMaster {...props} />}
            />
            <Route
              path="/project/:projectid/asset/:assetid/dailymotion"
              render={(props) => <DailymotionMaster {...props} />}
            />
            <Route
              path="/project/:projectid"
              component={ProjectDeliverablesComponent}
            />
            <Route
              path="/invalid/date/:date"
              component={(props) => (
                <InvalidDeliverablesComponent
                  {...props}
                  key={window.location.pathname}
                />
              )}
            />
            <Route
              path="/invalid/type/:kind"
              component={(props) => (
                <InvalidDeliverablesComponent
                  {...props}
                  key={window.location.pathname}
                />
              )}
            />
            <Route
              path="/invalid/status/:status"
              component={(props) => (
                <InvalidDeliverablesComponent
                  {...props}
                  key={window.location.pathname}
                />
              )}
            />
            <Route
              path="/invalid"
              component={(props) => (
                <InvalidDeliverablesComponent
                  {...props}
                  key={window.location.pathname}
                />
              )}
            />
            <Route path="/bundle/:bundleId" component={BundleRedirect} />
            <Route path="/search" component={AssetSearchComponent} />
            <Route path="/dash" component={DeliverablesDashFront} />
            <Route exact path="/" component={ProjectsListComponent} />
          </Switch>
        </div>
        <SystemNotification />
      </PlutoThemeProvider>
    );
  }
}

render(
  <BrowserRouter basename={deploymentRootPath}>
    <App />
  </BrowserRouter>,
  document.getElementById("app")
);
