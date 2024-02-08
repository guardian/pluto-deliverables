import React, { useMemo } from "react";
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
  UserContextProvider,
  SystemNotification,
  Header,
  JwtDataShape,
  OAuthContextData,
  OAuthContextProvider,
  SystemNotification,
  verifyExistingLogin,
  UserContextProvider,
} from "@guardian/pluto-headers";
import NotLoggedIn from "./NotLoggedIn";
import GuardianMaster from "./Master/GuardianMaster";
import YoutubeMaster from "./Master/YoutubeMaster";
import MainstreamMaster from "./Master/MainstreamMaster";
import DailymotionMaster from "./Master/DailymotionMaster";
import { Helmet } from "react-helmet";
import AssetSearchComponent from "./AssetSearchComponent";
import BundleRedirect from "./BundleRedirect";
import InvalidDeliverablesComponent from "./InvalidDeliverablesComponent";
import DeliverablesDashFront from "./DeliverablesDash/DeliverablesDashFront";
import DeliverableItem from "./DeliverableItem/DeliverableItem";
import DeliverablesFront from "./DeliverablesFront/DeliverablesFront";

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

function parseBool(str) {
  return /^true$/i.test(str);
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      isLoggedIn: false,
      tokenExpired: false,
      plutoConfig: {},
      userProfile: undefined,
      isAdmin: false,
    };

    this.handleUnauthorizedFailed = this.handleUnauthorizedFailed.bind(this);
    this.onLoginValid = this.onLoginValid.bind(this);
    this.oAuthConfigLoaded = this.oAuthConfigLoaded.bind(this);

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
    this.setState(
      {
        isLoggedIn: valid,
        userProfile: loginData,
      },
      () => {
        this.setState({ loading: false });
      }
    );
  }

  componentDidMount() {
    setTimeout(() => {
      if (!this.state.isLoggedIn) {
        console.log("Not logged in, redirecting to pluto-start.");
        window.location.assign(
            "/refreshLogin?returnTo=" + window.location.pathname
        );
      }
    }, 3000);
  }

  haveToken() {
    return window.localStorage.getItem("pluto:access-token");
  }

  isUserAdmin(profile, adminClaim) {
    if (profile.roles) {
      if (profile.roles.includes(adminClaim)) {
        return true;
      }
    }
    if (profile[adminClaim]) {
      if (parseBool(profile[adminClaim])) {
        return true;
      }
    }
    return false;
  }

  oAuthConfigLoaded(oAuthConfig) {
    //If we already have a user token at mount, verify it and update our internal state.
    //If we do not, ignore for the time being; it will be set dynamically when the login occurs.
    console.log("Loaded oAuthConfig: ", oAuthConfig);
    if (this.haveToken()) {
      verifyExistingLogin(oAuthConfig)
        .then((profile) => {
          const adminValue = this.isUserAdmin(
            profile,
            oAuthConfig.adminClaimName
          );
          this.setState({
            userProfile: profile,
            isLoggedIn: true,
            isAdmin: adminValue,
          });
        })
        .catch((err) => {
          console.error("Could not verify existing user profile: ", err);
        });
    }
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
        <OAuthContextProvider onLoaded={this.oAuthConfigLoaded}>
          <UserContextProvider
            value={{
              profile: this.state.userProfile,
              updateProfile: (newValue) =>
                this.setState({ userProfile: newValue }),
            }}
          >
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
                <Route path="/projects" component={ProjectsListComponent} />
                <Route exact path="/" component={DeliverablesFront} />
              </Switch>
            </div>
            <SystemNotification />
          </UserContextProvider>
        </OAuthContextProvider>
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
