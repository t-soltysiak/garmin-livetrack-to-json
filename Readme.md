# Garmin-livetrack-to-json

FORKED FROM: https://github.com/Novex/garmin-livetrack-obs

Automatically search for the Garmin Livetrack email in your inbox and output fields from the API to JSON http response e. g. to use in Home Assistant sensors.

## Usage
1. Clone/[download] this repo
2. Copy the `config.template.js` file to `config.js` and fill in your email address and password
3. run `npm install` in a command prompt to get the dependencies
4. run `npm start` in a command prompt to start searching for a Garmin email and output json data.
5. Access localhost:8200 to see live track activity respond

TIP: for Home Assistant sensors, use can use some rest templates like this:

```
sensor:
  - platform: rest
    resource: http://127.0.0.1:8200
    scan_interval: 300
    name: Garmin LiveTrack
    value_template: "{{ value_json.trackPoints[-1].dateTime if 'trackPoints' in value_json and (value_json.trackPoints | length) > 0 }}"
    headers:
      Content-Type: application/json
    json_attributes_path: "$.trackPoints[-1:]"
    json_attributes:
      - cadenceCyclesPerMin
      - dateTime
      - distanceMeters
      - heartRateBeatsPerMin
      - fitnessPointData
      - powerWatts
      - speed

template:
  - sensor:
    - name: Garmin LiveTrack - created time
      unique_id: garmin_livetrack_created_time
      state: "{{ states.sensor.garmin_livetrack.attributes.fitnessPointData.activityCreatedTime | as_timestamp | timestamp_custom('%d-%m-%Y %H:%M') if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}"
    - name: Garmin LiveTrack - activity
      unique_id: garmin_livetrack_activity
      state: "{{ (states.sensor.garmin_livetrack.attributes.fitnessPointData.activityType if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes ) | lower }}"
    - name: Garmin LiveTrack - duration
      unique_id: garmin_livetrack_duration
      state: "{{ states.sensor.garmin_livetrack.attributes.fitnessPointData.totalDurationSecs | timestamp_custom('%H:%M:%S', false) if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}"
    - name: Garmin LiveTrack - dateTime
      unique_id: garmin_livetrack_dateTime
      state: "{{ states.sensor.garmin_livetrack.attributes.dateTime | as_timestamp | timestamp_custom('%d-%m-%Y %H:%M') if 'dateTime' in states.sensor.garmin_livetrack.attributes }}"
    - name: Garmin LiveTrack - finished
      unique_id: garmin_livetrack_finished
      state: "{{ ('finished' if states.sensor.garmin_livetrack.attributes.fitnessPointData.eventTypes[1] == 'END' else 'ONGOING!') if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}"
    - name: Garmin LiveTrack - distance
      unique_id: garmin_livetrack_distance
      state: "{{ (states.sensor.garmin_livetrack.attributes.fitnessPointData.distanceMeters | int(0) )/1000 | round(1) if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}"
    - name: Garmin LiveTrack - speed.
      unique_id: garmin_livetrack_speed
      state: "{{ (states.sensor.garmin_livetrack.attributes.speed)*3.6 if 'speed' in states.sensor.garmin_livetrack.attributes }}"
    - name: Garmin LiveTrack - cadence
      unique_id: garmin_livetrack_cadence
      state: "{{ states.sensor.garmin_livetrack.attributes.fitnessPointData.cadenceCyclesPerMin if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}"
    - name: Garmin LiveTrack - power watts
      unique_id: garmin_livetrack_powerwatts
      state: "{{ (states.sensor.garmin_livetrack.attributes.fitnessPointData.powerWatts if 'powerWatts' in states.sensor.garmin_livetrack.attributes.fitnessPointData) if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}"
    - name: Garmin LiveTrack - heart beats
      unique_id: garmin_livetrack_heartbeats
      state: "{{ states.sensor.garmin_livetrack.attributes.fitnessPointData.heartRateBeatsPerMin if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}"
```
