import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Geolocation, Position } from '@capacitor/geolocation';
import Feature from 'ol/Feature';
import MultiLineString from 'ol/geom/MultiLineString';
import Point from 'ol/geom/Point';


@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  knooppunten = [];

  debugLog = '';
  googleMapsURL = '';

  constructor(
    private http: HttpClient,
    private domSanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef,
  ) {


    [3].forEach(x => {
      this.http.get(`https://www.meldpuntroutes.nl/meldtool/getSubjectsByCategory?body={%22params%22:[${x}]}`)
        .subscribe(async (response: { result: any[] }) => {
          console.log('Result ', x, response.result.filter(item => item.geom_line === null)
          );
        });
    });

    /*
      1 - Wandelroute (57) "Nederlands Kustpad 2"
      2 - niks
      3-  Wandelknooppunten (73777)
      4 - 45 wandelroutes - "Landgoed Groeneveld"
      5-  60 wandelroutes ""Savelsbos""
      6 - 40 wandelroutes - "Lingezegen te Voet - Ommetje Welderen"
      7 - 95 routes (wander/fiets?) - "Rondje Beesd" "Rondje Loonse en Drunense Duinen", Wandelnet
      8 - Fietsknoppunten (10346)
      9 - Landelijke Fietsroutes (17)- "LF4 Midden-Nederlandroute"

    */
    // https://www.meldpuntroutes.nl/meldtool/getSubjectsByCategory?body={"params":[8]}
    // https://www.meldpuntroutes.nl/meldtool/getSubjectsByCategory?body={%22params%22:[1]} -> wandelroutes
    // https://www.meldpuntroutes.nl/meldtool/getSubjectsByCategory?body={%22params%22:[3]} -> wandelpunten??
    // https://www.meldpuntroutes.nl/meldtool/getSubjectsByCategory?body={%22params%22:[4]} -> NS wandelroutes?
    // https://www.meldpuntroutes.nl/meldtool/getSubjectsByCategory?body={%22params%22:[5]}

    this.http.get('assets/json/route-cat8.json')
      .subscribe(async (response: { result: any[] }) => {


        this.knooppunten = response.result
          .filter(item => item.geom_line === null);
        //  .filter(item => item.name.includes('knooppunt'))
        //   .filter(item => !item.name.includes('naar'));

        this.knooppunten.forEach((subject) => {
          if (subject.geom_point !== null) {
            const point = new Feature({
              geometry: new Point(subject.geom_point),
              name: subject.name.replace('knooppunt ', ''),
              type: 'Generalized',
            });
            const geom = point.getGeometry().transform('EPSG:3857', 'EPSG:4326');
            subject.latlon = geom as Point;
            const flatCoordinates = subject.latlon.flatCoordinates;
            if (Array.isArray(flatCoordinates) && flatCoordinates.length === 2) {
              subject.latitude = flatCoordinates[1];
              subject.longitude = flatCoordinates[0];
              subject.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${subject.latitude},${subject.longitude}`;
            }
          } else if (subject.geom_line !== null) {
            const line = new Feature({
              geometry: new MultiLineString(subject.geom_line),
              name: 'LineString',
              type: 'Generalized',
            });
          }
        });



        const zlimburg = this.knooppunten
          .filter(item => item.geom_line === null)
          .filter(item => item.name.includes('85'))
          .filter(item => (item.latitude < 50.826608));
        console.log('ZUID LIMBURG', zlimburg);

        // https://www.google.com/maps/search/?api=1&query=50.81108707895007,5.8890316091853
        // Gulpen
        this.findClosest()
          .then(console.log);
      });
  }

  // https://www.google.com/maps/search/?api=1&query=52.18173272818194,5.369149604806808


  async findClosest() {
    const coordinates = await Geolocation.getCurrentPosition()
      .catch(error => {
        console.log('ERrror', error);
        this.debugLog += JSON.stringify(error, null, 2);
      });
    const currentPosition = coordinates as Position;

    if (currentPosition) {
      console.log('Your current post = ', currentPosition.coords);

      this.debugLog = this.debugLog + ' headig ' + currentPosition.coords.heading;
      let closestKnooppunt = this.knooppunten[0];

      const closestKnooppunten = {};

      const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      items.forEach(i => {
        closestKnooppunten[i] = {
          distance: 10000
        };
      });

      console.log('SADSD', closestKnooppunten, closestKnooppunt);
      this.knooppunten.forEach(kp => {
        const distance = this.getDistanceFromLatLonInKm(currentPosition.coords.latitude,
          currentPosition.coords.longitude, kp.latitude, kp.longitude);
        const bearing = this.bearing(currentPosition.coords.latitude,
          currentPosition.coords.longitude, closestKnooppunt.latitude, closestKnooppunt.longitude);

        kp.distance = distance;
        kp.bearing = bearing;

        if (distance < closestKnooppunt.distance) {
          closestKnooppunt = kp;
        }

        for (const el of items) {
          //      console.log('dsfsdfd', el, kp, distance,  distance < closestKnooppunten[el]);
          if (distance < closestKnooppunten[el].distance) {

            closestKnooppunten[el] = kp;
            break;
          }
        }
      });

      console.log('Routes found', this.knooppunten, closestKnooppunt, closestKnooppunt.bearing, closestKnooppunten);

      this.debugLog = this.debugLog + '  ' + JSON.stringify(closestKnooppunt, null, 2) + '--' + closestKnooppunt.bearing;

      this.googleMapsURL = closestKnooppunt.googleMapsUrl;



    }
  }

  openGoogleMapURL() {
    window.open(this.googleMapsURL, '_new');
  }

  async ionViewDidEnter() {
    // this.domSanitizer.bypassSecurityTrustUrl('http://sampleUrl.com');
    // const coordinates = await Geolocation.getCurrentPosition()
    //     .catch(error => {
    //      console.log('ERrror', error);
    //     this.debugLog += JSON.stringify(error, null, 2);
    //    });


    //  const coord2 = coordinates as Position;

    // console.log('Current position:', coord2.coords.latitude);
    // this.debugLog = this.debugLog + JSON.stringify(coord2.coords.latitude);

    //  const d = this.getDistanceFromLatLonInKm(coord2.coords.latitude, coord2.coords.longitude, 0, 0);
    // console.log('Current position:', this.debugLog, d);


    /*

    const watch = Geolocation.watchPosition().subscribe(position => {
      if ((position as Geoposition).coords != undefined) {
        const geoposition = (position as Geoposition);
        console.log('Latitude: ' + geoposition.coords.latitude + ' - Longitude: ' + geoposition.coords.longitude);
      } else {
        var positionError = (position as PositionError);
        console.log('Error ' + positionError.code + ': ' + positionError.message);
      }
    });

    */
    /*
  timestamp	number	Creation timestamp for coords	1.0.0
  coords	{ latitude: number; longitude: number; accuracy: number;
  altitudeAccuracy: number | null; altitude: number | null; speed: number | null; heading: number | null; }

    */

    //  const d = this.getDistanceFromLatLonInKm(coordinates?.coords.latitude, coordinates?.longitude, 0, 0);


    Geolocation.checkPermissions()
      .then(permissions => {
        console.log('Permissions', permissions); // premissions.location  - granted, prompt, denied
        this.debugLog = this.debugLog + JSON.stringify(permissions, null, 2);
      });
    const options = {
      enableHighAccuracy: false,
      timeout: 1000,
      maximumAge: 0
    };

    const callback = (input) => {
      console.log('Input', input);
      if (input !== null) {
        /*
            this.debugLog = this.debugLog + ' HEADING: ' +
              input.coords.heading + ' (' + input.coords.longitude + '.' +
              input.coords.latitude + ') SPEED:' + input.coords.speed;
            this.changeDetector.detectChanges();
          */
      }
    };
    const watcher = await Geolocation.watchPosition(options, callback);

    window.addEventListener('deviceorientation', (e) => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      console.log(e['webkitCompassHeading']);
      console.log(e.alpha + ' : ' + e.beta + ' : ' + e.gamma);
      this.debugLog = this.debugLog + ' --- ' + e.alpha + ' : ' + e.beta + ' : ' + e.gamma + '---';
      this.changeDetector.detectChanges();
    }, false);

    console.log('Watcher id', watcher);
    setTimeout(() => {
      Geolocation.clearWatch({ id: watcher });
    }, 15000);



    /*

  if(window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', function(event) {
        var alpha;
        // Check for iOS property
        if(event.webkitCompassHeading) {
          alpha = event.webkitCompassHeading;
        }
        // non iOS
        else {
          alpha = event.alpha;
          if(!window.chrome) {
            // Assume Android stock
            alpha = alpha-270;
          }
        }
      }
    }

    */
  }


  getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);  // deg2rad below
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }



  bearing(startLat, startLng, destLat, destLng) {
    // Converts from degrees to radians.
    const toRadians = (degrees) => degrees * Math.PI / 180;

    // Converts from radians to degrees.
    const toDegrees = (radians) => radians * 180 / Math.PI;

    startLat = toRadians(startLat);
    startLng = toRadians(startLng);
    destLat = toRadians(destLat);
    destLng = toRadians(destLng);

    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
      Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    let brng = Math.atan2(y, x);
    brng = toDegrees(brng);
    return (brng + 360) % 360;
  }



  blobToSaveAs(fileName: string, blob: Blob) {

    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      if (link.download !== undefined) { // feature detection
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error('BlobToSaveAs error', e);
    }
  }

  download() {

    let exportText = '';

    exportText =
      'name,latitude,longitude\n';


    this.knooppunten.forEach(kp => {
      const { latitude, longitude, name } = kp;
      exportText = exportText + `${name},${latitude},${longitude}\n`;

    });


    this.saveKPChunk(this.knooppunten, 1);
    // const blob = new Blob([exportText], { type: 'text/csv' });
    // this.blobToSaveAs('stuff.csv', blob);
  }

  saveKPChunk(list: any[], i: number) {
    let count = 0;
    let exportText = 'name,latitude,longitude\n';
    let subcount = 0;
    do {
      const kp = list[count];
      const { latitude, longitude, name } = kp;
      exportText = exportText + `${name},${latitude},${longitude}\n`;

      if (subcount === 1999 || (count === list.length - 1)) {


        const blob = new Blob([exportText], { type: 'text/csv' });
        subcount = 0;
        exportText = 'name,latitude,longitude\n';
        setTimeout(() => {
          // if (i === 6) {
          console.log('CRAP', i, list, list.length, count, subcount, exportText);
          this.blobToSaveAs(`stuff${i}.csv`, blob);
          //  }
          i++;
        }, 5000 * (i));
      }

      subcount++;
      count++;
    } while (count < list.length);
  }

}
