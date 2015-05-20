'use strict';
var Reflux = require('reflux');
var $ = require('jquery');
var actions = require('../actions/actions');
var overlaps = require('turf-overlaps');

module.exports = Reflux.createStore({

  storage: {
    results: [],
    sqrSelected: null
  },

  // Called on creation.
  // Setup listeners.
  init: function() {
    this.listenTo(actions.mapMove, this.onMapMove);
    this.listenTo(actions.mapSquareSelected, this.onMapSquareSelected);
    this.listenTo(actions.mapSquareUnselected, this.onMapSquareUnselected);
  },

  // Actions listener.
  onMapMove: function(map) {
    var _this = this;

    if (map.getZoom() < 6) {
      this.trigger([]);
      return;
    }

    var bbox = map.getBounds().toBBoxString();
    // ?bbox=[lon_min],[lat_min],[lon_max],[lat_max]
    $.get('http://oam-catalog.herokuapp.com/meta?limit=400&bbox=' + bbox)
      .success(function(data) {
        _this.storage.results = data.results;
        _this.trigger(_this.storage.results);
      });
  },

  // Actions listener.
  onMapSquareSelected: function(sqrFeature) {
    console.log('onMapSquareSelected');
    this.storage.sqrSelected = sqrFeature;
    if (!this.storage.sqrSelected.properties) {
      this.storage.sqrSelected.properties = {};
    }
    this.storage.sqrSelected.properties.centroid = turf.centroid(sqrFeature).geometry.coordinates;
  },

  // Actions listener.
  onMapSquareUnselected: function() {
    this.storage.sqrSelected = null;
  },

  /**
   * Returns whether there's a map square selected.
   * @return {Boolean}
   */
  isSelectedSquare: function() {
    return this.storage.sqrSelected !== null;
  },

  /**
   * Returns the selected square feature.
   * @return Feature or null
   */
  getSelectedSquare: function() {
    return this.storage.sqrSelected;
  },

  /**
   * Returns the selected square centroid.
   * @return Array or null
   */
  getSelectedSquareCenter: function() {
    return this.storage.sqrSelected !== null ? this.storage.sqrSelected.properties.centroid : null;
  },

  /**
   * [forEachResultIntersecting description]
   * 
   * @param  feature
   *   The feature with which to check the intersection.
   * @param  iterator function(result)
   *   The function called for each result that intersects the feature
   * 
   */
  forEachResultIntersecting: function(feature, iterator) {
    // Centroid of the feature.
    // Why this is needed:
    // To check whether a footprint intersects a square, turf-overlap is
    // being used. (turf intersect computes the intersection and is too slow)
    // However turf-overlap returns false if the square is fully inside
    // the footprint. Don't know if this is the desired behavior?
    // To solve this we check if the square's centroid is inside the footprint.
    var featureCenter = turf.centroid(feature);

    this.storage.results.forEach(function(o) {
      var footprint = {
        type: 'Feature',
        geometry: {
          type: "Polygon",
          coordinates: o.geojson.coordinates
        }
      };
      if (turf.inside(featureCenter, footprint) || overlaps(footprint, feature)) {
        iterator(o);
      }
    });
  },

  /**
   * Returns the results that intersect with the given feature.
   * 
   * @param  feature
   *  The feature with which to check the intersection.
   *  
   * @return Array
   *   Intersecting results
   */
  getResultsIntersect: function(feature) {
    var intersected = [];

    this.forEachResultIntersecting(feature, function(result) {
      intersected.push(result);
    });
    
    return intersected;
  },

});