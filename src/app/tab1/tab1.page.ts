import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Style, Fill, Circle, Stroke, Text } from 'ol/style';
// import Vector from 'ol/layer/Vector';

import VectorLayer from 'ol/layer/Vector';

import VectorSource from 'ol/source/Vector';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import MultiLineString from 'ol/geom/MultiLineString';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  map: Map;
  drawLayer: VectorLayer<any>;
  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit() {

  }

  ionViewDidEnter() {
    this.map = new Map({
      view: new View({
        center: [0, 0],
        zoom: 1,
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      target: 'ol-map'
    });

    const style2 = () => new Style({
      fill: new Fill({
        color: 'red'
      })
    });

    const style = new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.6)',
      }),
      stroke: new Stroke({
        color: '#319FD3',
        width: 1,
      }),
      text: new Text({
        font: '12px Calibri,sans-serif',
        fill: new Fill({
          color: '#000',
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 3,
        }),
      }),
    });

    this.drawLayer = new VectorLayer({
      source: new VectorSource(),
      style,
      zIndex: 50,
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      visible: true,
      // map: this.map
    });



    this.http.get('assets/json/route-cat8.json')
      .subscribe((response: { result: any[] }) => {
        console.log('Routes found', response.result);

        const features: Feature<any>[] = this.initGeneralizedNetwork(response.result); // .slice(0, 100)

        this.drawLayer.getSource().addFeatures(features);
        this.drawLayer.getSource().changed();


        const ext = this.drawLayer.getSource().getExtent();
        const properties = {
          extent: ext,
          label: 'nl'
        };
        const zoomControl = new ZoomToExtent();
        this.map.addControl(zoomControl);

      });
  }


  initGeneralizedNetwork(subjects: any[]): Feature<any>[] {

    const features = [];
    subjects.forEach((subject) => {
      if (subject.geom_point !== null) {
        const point = new Feature({
          geometry: new Point(subject.geom_point),
          name: 'Point',
          type: 'Generalized',
        });
        // filterLayer.getSource().addFeature(point);
        features.push(point);
      } else if (subject.geom_line !== null) {
        const line = new Feature({
          geometry: new MultiLineString(subject.geom_line),
          name: 'LineString',
          type: 'Generalized',
        });
        // filterLayer.getSource().addFeature(line);
        features.push(line);
      }
    });

    console.log('FEATURES', features);

    return features;
    //   filterLayer.getSource().addFeatures(features);
    //   filterLayer.getSource().changed();
    //   IimMap.updateZoomExtent(_map, filterLayer.getSource().getExtent(), true);
  }

  // https://openlayers.org/en/latest/examples/vector-layer.html




}

/*

var _map = null; // openlayers instance
    var OLH = OpenlayersHelper;

    var drawLayer = OLH.createLayer(getStyle, 50, true, true);
    var filterLayer = OLH.createLayer(getStyle, 50, true, true);
    var locationLayer = OLH.createLayer(getStyle, 60, true, true);
    var markerLayer = OLH.createLayer(getStyle, 70, true, true);

    var init = function() {
        _map = IimMap.createMap("x-map");
        _map.addLayer(drawLayer);
        _map.addLayer(filterLayer);
        _map.addLayer(locationLayer);
        _map.addLayer(markerLayer);

         $scope.initGeneralizedNetwork = function(subjects) {

        var features = [];

        _.forEach(subjects, function(subject) {
            if (subject.geom_point !== null) {
                var point = new ol.Feature({
                    geometry: new ol.geom.Point(subject.geom_point),
                    name: 'Point',
                    type: 'Generalized'
                });
                // filterLayer.getSource().addFeature(point);
                features.push(point);
            } else if (subject.geom_line !== null) {
                var line = new ol.Feature({
                    geometry: new ol.geom.MultiLineString(subject.geom_line),
                    name: 'LineString',
                    type: 'Generalized'
                });
                // filterLayer.getSource().addFeature(line);
                features.push(line);
            }
        });

        filterLayer.getSource().addFeatures(features);
        filterLayer.getSource().changed();
        IimMap.updateZoomExtent(_map, filterLayer.getSource().getExtent(), true);
    };



     $scope.initLines = function(subjects) {

        if (subjects.length === 0) {
            return;
        }

        var features = [];

        _.forEach(subjects, function(subject) {
            if (subject.geom_type === 'LineString' || subject.geom_type === 'MultiLineString') {
                var line = new ol.Feature({
                    geometry: new ol.geom.MultiLineString(subject.geom_line),
                    name: subject.geom_type,
                    label: subject.name,
                    type: 'Line'
                });
                line.setId(subject.id);
                features.push(line);
                // filterLayer.getSource().addFeature(line);
            }
        });

        filterLayer.getSource().addFeatures(features);
        filterLayer.getSource().changed();
        IimMap.updateZoomExtent(_map, filterLayer.getSource().getExtent(), true);
    };
*/
