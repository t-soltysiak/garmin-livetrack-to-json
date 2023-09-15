# Garmin-livetrack-to-json

FORKED FROM: https://github.com/Novex/garmin-livetrack-obs

Automatically search for the Garmin Livetrack email in your inbox and output fields from the API to JSON http response e. g. to use in Home Assistant sensors.

![ha](https://github.com/t-soltysiak/garmin-livetrack-to-json/assets/68973012/d265d8be-58ac-40b9-9850-6e933eb50513)

## Usage
1. Clone/[download] this repo
2. Copy the `config.template.js` file to `config.js` and fill in your email address and password
3. run `npm install` in a command prompt to get the dependencies
4. run `npm start` in a command prompt to start searching for a Garmin email and output json data.
5. Access localhost:8200 to see live track activity respond

TIP: for Home Assistant sensors, use can use some rest templates like this:

1) Run as service:
create file /etc/systemd/system/garmin.service:
```
[Unit]
Description=Garmin Live Track monitor
After=multi-user.target
[Service]
Type=simple
Restart=always
WorkingDirectory=/home/homeassistant/garmin
ExecStart=/usr/bin/npm start

[Install]
WantedBy=multi-user.target
```
run
```
systemctl enable --now garmin
```

2) Edit configuration.yaml in HA - remember to update secretPath protection in resource url:
```
sensor:
  - platform: rest
    resource: http://127.0.0.1:8200/b50ff165-effa-45d6-b24b-6ff06a03e846
    name: Garmin LiveTrack
    value_template: "{% if value_json is defined %}{{ value_json.trackPoints[-1].dateTime if 'trackPoints' in value_json and (value_json.trackPoints | length) > 0 }}{% endif %}"
    headers:
      Content-Type: application/json
    json_attributes_path: "$.trackPoints[-1:]"
    json_attributes:
      - altitude
      - cadenceCyclesPerMin
      - dateTime
      - distanceMeters
      - heartRateBeatsPerMin
      - fitnessPointData
      - powerWatts
      - speed
  - platform: rest
    resource: http://127.0.0.1:8200/e20b7e03-01ed-4cd4-8f99-330a3d943ded
    name: Garmin LiveTrack URL
    value_template: "{% if 'sessionUrl' in value_json %}{{ value_json.sessionUrl }}{% endif %}"
    headers:
      Content-Type: application/json

template:
  - sensor:
    - name: Garmin LiveTrack - data
      unique_id: garmin_livetrack_data
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ 'available' if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
    - name: Garmin LiveTrack - created time
      unique_id: garmin_livetrack_created_time
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ states.sensor.garmin_livetrack.attributes.fitnessPointData.activityCreatedTime | as_timestamp | timestamp_custom('%d-%m-%Y %H:%M') if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
    - name: Garmin LiveTrack - activity
      unique_id: garmin_livetrack_activity
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ (states.sensor.garmin_livetrack.attributes.fitnessPointData.activityType if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes ) | lower }}{% endif %}"
    - name: Garmin LiveTrack - duration
      unique_id: garmin_livetrack_duration
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ states.sensor.garmin_livetrack.attributes.fitnessPointData.totalDurationSecs | timestamp_custom('%H:%M:%S', false) if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
    - name: Garmin LiveTrack - dateTime
      unique_id: garmin_livetrack_dateTime
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ states.sensor.garmin_livetrack.attributes.dateTime | as_timestamp | timestamp_custom('%d-%m-%Y %H:%M') if 'dateTime' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
    - name: Garmin LiveTrack - finished
      unique_id: garmin_livetrack_finished
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ ('finished' if states.sensor.garmin_livetrack.attributes.fitnessPointData.eventTypes[1] == 'END' else 'ONGOING!') if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
    - name: Garmin LiveTrack - distance
      unique_id: garmin_livetrack_distance
      unit_of_measurement: "km"
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ ((states.sensor.garmin_livetrack.attributes.fitnessPointData.distanceMeters | int(0))/1000) | round(2) if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
    - name: Garmin LiveTrack - altitude
      unique_id: garmin_livetrack_altitude
      unit_of_measurement: "m n.p.m."
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ states.sensor.garmin_livetrack.attributes.altitude | round(0) if 'altitude' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
    - name: Garmin LiveTrack - speed
      unique_id: garmin_livetrack_speed
      unit_of_measurement: "km/h"
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ ((states.sensor.garmin_livetrack.attributes.speed)*3.6) | round(1) if 'speed' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
    - name: Garmin LiveTrack - cadence
      unique_id: garmin_livetrack_cadence
      unit_of_measurement: "rpm"
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ states.sensor.garmin_livetrack.attributes.fitnessPointData.cadenceCyclesPerMin if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
    - name: Garmin LiveTrack - power watts
      unique_id: garmin_livetrack_powerwatts
      unit_of_measurement: "W"
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ (states.sensor.garmin_livetrack.attributes.fitnessPointData.powerWatts if 'powerWatts' in states.sensor.garmin_livetrack.attributes.fitnessPointData) if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
    - name: Garmin LiveTrack - heart beats
      unique_id: garmin_livetrack_heartbeats
      unit_of_measurement: "bpm"
      state: "{% if states.sensor.garmin_livetrack is defined %}{{ states.sensor.garmin_livetrack.attributes.fitnessPointData.heartRateBeatsPerMin if 'fitnessPointData' in states.sensor.garmin_livetrack.attributes }}{% endif %}"
```

3) Install by HACS this plugin https://github.com/iantrich/config-template-card for custom iframe (preview with map etc.) cause default webpage card does not support passing dynamic urls

4) Edit dashboard Yaml:
```
type: vertical-stack
cards:
  - type: conditional
    conditions:
      - entity: sensor.garmin_livetrack_data
        state: available
    card:
      type: entities
      title: 'LiveTrack: Tomasz'
      entities:
        - entity: sensor.garmin_livetrack_finished
          name: Status aktywności
          icon: mdi:progress-check
        - entity: sensor.garmin_livetrack_activity
          name: Rodzaj aktywności
          icon: mdi:bike-fast
        - entity: sensor.garmin_livetrack_created_time
          name: Czas rozpoczęcia
          icon: mdi:av-timer
        - entity: sensor.garmin_livetrack_duration
          name: Czas trwania
          icon: mdi:av-timer
        - entity: sensor.garmin_livetrack_distance
          name: Dystans
          icon: mdi:arrow-up-down-bold
        - entity: sensor.garmin_livetrack_altitude
          name: Wysokość
          icon: mdi:altimeter
        - entity: sensor.garmin_livetrack_speed
          name: Prędkość
          icon: mdi:speedometer
        - entity: sensor.garmin_livetrack_cadence
          name: Kadencja
          icon: mdi:reload
        - entity: sensor.garmin_livetrack_power_watts
          name: Moc
          icon: mdi:shoe-cleat
        - entity: sensor.garmin_livetrack_heart_beats
          name: Tętno
          icon: mdi:heart-multiple
        - entity: sensor.garmin_livetrack_datetime
          name: Czas aktualizacji
          icon: mdi:av-timer
  - type: conditional
    conditions:
      - entity: sensor.garmin_livetrack_data
        state: available
    card:
      type: custom:config-template-card
      variables:
        URL: states['sensor.garmin_livetrack_url'].state
      entities:
        - sensor.garmin_livetrack_url
      card:
        type: iframe
        url: ${URL}
        aspect_ratio: 100%
```

Above HA Conditional Card https://www.home-assistant.io/dashboards/conditional/ automatically will show when LiveTrack status is on going or recently finished.
If not data is fetched from Garmin servers (see logs e. g. with systemctl status garmin -n 50) card will be not visible to not take up space on the dashboards.
