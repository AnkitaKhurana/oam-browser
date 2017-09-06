import "isomorphic-fetch"
import mockery from "mockery";

// All tests here should be shallow rendered and not need something
// like jsdom. So keep DOM stubs here to a minimum.
global.window = {
  document: {},
  location: {
    href: ''
  }
};

// Stub all the Leaflet code
mockery.registerMock("mapbox.js", {});
mockery.enable({
  warnOnUnregistered: false
});

global.L = {
  Control: {
    extend: () => {}
  },
  mapbox: {
    accessToken: ""
  }
};

global.OAM_UP = {};
