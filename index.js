const log = require('signale').scope('Core');
const MailWatcher = require('./lib/MailWatcher');
const http = require('http');
const fetch = require('node-fetch');
const assign = require('assign-deep');

const VERSION = require('./package.json').version

let config = {
  secretPath: 'b50ff165-effa-45d6-b24b-6ff06a03e846',
  username: '',
  password: '',

  host: 'localhost',
  port: 993,
  tls: true,
  secure: false,
  keepalive: false,
  label: 'INBOX',

  markSeen: false,
  waitForId: 300,
  maxWaitForSession: 3,
  updateMailPerRequest: 3,
  updateDataPerRequest: 360,

  httpHost: 'localhost',
  httpPort: 8200,
};

log.info(`Starting garmin-livetrack-to-json v${VERSION}`);

try {
  assign(config, require('./config.js'));
} catch (e) {
  log.warn("You should create an config.js file based on the config.template.js template to overwrite the default values")
}

const fetchData = async (id, res, cache) => {
  if (typeof sessionData !== 'undefined' && cache || typeof id === 'undefined') {
    log.info('Skipping fetch, respond from cache or empty');
  } else {
    const url = `https://livetrack.garmin.com/services/session/${id}/trackpoints?requestTime=${Date.now()}`;
    log.info(`Fetching ${url}`);
    const response = await fetch(url);

    if (response.status !== 200) {
      log.warn("Invalid response received - The previous link may have expired and the new one hasn't been delivered yet?");
      dataText = await response.text();
      log.warn(`response: ${dataText}`);
      return;
    }

    log.info('Saving data to object');
    sessionData = await response.json();
    log.info('Got data, writing response');
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  finished = true;
  fetchedData = typeof sessionData !== 'undefined' && typeof sessionData.trackPoints !== 'undefined' && sessionData.trackPoints.length > 0 && typeof sessionData.trackPoints[sessionData.trackPoints.length-1].fitnessPointData !== 'undefined';
  if (fetchedData) {
    log.info('Data is fetched. Activity status check');
    finished = sessionData.trackPoints[sessionData.trackPoints.length-1].fitnessPointData.eventTypes[1] === 'END';
  } else {
    log.info('Data is not fetched or empty:');
    log.info(sessionData);
  }
  log.info(finished ? 'Activity is FINISHED' : 'Activity is ONGOING, update every minute');
  if (fetchedData) res.write(JSON.stringify(sessionData)); else res.write('{}');
  res.end();
  log.info('Waiting for next request...');
};

const mailWatcher = new MailWatcher(config);
let counter = 1;
let finished = false;
let fetchedData = false;
let sessionData = undefined;
let oldSessionId = undefined;

const requestListener = async (req, res) => {
  if (req.url === `/${config.secretPath}`) {
    log.info();
    log.info(`Request #${counter} from client`);
    if (counter === 1 || counter % config.updateMailPerRequest === 0) {
      log.info('Checking email for new session');
      oldSessionId = mailWatcher.sessionInfo.Id;
      delete mailWatcher.sessionInfo.Id;
      delete mailWatcher.sessionInfo.Token;
      try {
        mailWatcher.connect();
      }
      catch(error) {
        log.error(`Connection error: ${error}`);
        mailWatcher._imap.end();
      }
    }

    let waitCount = 0;
    const timer = setInterval(() => {
      if (!mailWatcher.sessionInfo.Id || !mailWatcher.sessionInfo.Token) {
        log.info("Waiting for session info...");
        waitCount++;
        if (waitCount >= config.maxWaitForSession) {
          log.info(`Session not found in ${waitCount} attemps`);
          waitCount = 0;
          clearInterval(timer);
          log.info('Waiting for next request...');
          res.write('{}');
          res.end();
          return;
        }
      } else {
        clearInterval(timer);
        log.info('Found Garmin session, comparing');
        log.info(`old: ${oldSessionId} vs new: ${mailWatcher.sessionInfo.Id} => ${oldSessionId === mailWatcher.sessionInfo.Id ? 'same' : 'new'} session`);
        log.info('Fetch data - we must output data');
        fetchData(mailWatcher.sessionInfo.Id, res, (finished || counter % config.updateDataPerRequest != 0 || (oldSessionId === mailWatcher.sessionInfo.Id && !finished)));
        return;
      };
    }, config.waitForId);
    counter++;
  } else {
    res.end();
  }
};

const httpServer = http.createServer(requestListener);
httpServer.listen(config.httpPort, config.httpHost, () => {
  log.info(`Server is running on http://${config.httpHost}:${config.httpPort}`);
});
