import { Component } from '@angular/core';
import 'ol/ol.css';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import { Fill, Stroke, Style, Text, Circle } from 'ol/style';
import { HttpClient } from '@angular/common/http';
import Feature from 'ol/Feature';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import Point from 'ol/geom/Point';
import MultiLineString from 'ol/geom/MultiLineString';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  constructor(
    private http: HttpClient,

  ) { }

  ionViewDidEnter() {

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


    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        url: 'assets/json/countries.geojson',
        format: new GeoJSON(),
      }),
      style: (feature) => {
        style.getText().setText(feature.get('name'));
        return style;
      },
      zIndex: 100
    });

    const osmLayer = new TileLayer({
      source: new OSM(),
      zIndex: 0
    });

    const map = new Map({
      layers: [vectorLayer, osmLayer
      ],
      target: 'map',
      view: new View({
        center: [0, 0], // [52.3676, 4.9041],
        zoom: 1,
      }),
    });

    this.http.get('assets/json/route-cat8.json')
      .subscribe((response: { result: any[] }) => {
        console.log('Routes found', response.result);

        const features: Feature<any>[] = this.initGeneralizedNetwork(response.result); // .slice(0, 100)

        vectorLayer.getSource().addFeatures(features);
        vectorLayer.getSource().changed();


        const ext = vectorLayer.getSource().getExtent();
        const properties = {
          extent: ext,
          label: 'nl'
        };
        const zoomControl = new ZoomToExtent();
        map.addControl(zoomControl);

      });


  }

  initGeneralizedNetwork(subjects: any[]): Feature<any>[] {

    const style3 = new Style({
      image: new Circle({
        radius: 10,
        fill: new Fill({
          color: 'rgba(' + 233 + ', ' + 12 + ', ' + 5 + ', 1)',
        }),
        stroke: new Stroke({
          color: 'rgba(0,190,212,1)',
          width: 34
        })
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
    const features = [];
    subjects.forEach((subject) => {
      if (subject.geom_point !== null) {
        const point = new Feature({
          geometry: new Point(subject.geom_point),
          name: subject.name.replace('knooppunt ', ''),
          type: 'Generalized',

        });
        point.setStyle(style3)
        // filterLayer.getSource().addFeature(point);
        features.push(point);
      } else if (subject.geom_line !== null) {
        const line = new Feature({
          geometry: new MultiLineString(subject.geom_line),
          name: 'LineString',
          type: 'Generalized',
        });
        // filterLayer.getSource().addFeature(line);
        //   features.push(line);
      }
    });

    console.log('FEATURES', features);

    return features;
    //   filterLayer.getSource().addFeatures(features);
    //   filterLayer.getSource().changed();
    //   IimMap.updateZoomExtent(_map, filterLayer.getSource().getExtent(), true);
  }

}
