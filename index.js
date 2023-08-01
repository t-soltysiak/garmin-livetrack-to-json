const log = require('signale').scope('Core');
const MailWatcher = require('./lib/MailWatcher');
const http = require('http');
const fetch = require('node-fetch');
const assign = require('assign-deep');

const VERSION = require('./package.json').version

let config = {
  username: '',
  password: '',

  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  secure: true,
  keepalive: true,
  label: 'INBOX',

  markSeen: false,
  waitForId: 300,
  updateMailPerRequest: 5,
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
  if (typeof sessionData !== 'undefined' && cache) {
    log.info('Skipping fetch, respond from cache');
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
  if (typeof sessionData !== 'undefined' && typeof sessionData.trackPoints !== 'undefined') {
    finished = sessionData.trackPoints[sessionData.trackPoints.length-1].fitnessPointData.eventTypes[1] === 'END';
  }
  log.info(finished ? 'Activity is FINISHED' : 'Activity is ONGOING, update every minute');
  res.write(JSON.stringify(sessionData));
  res.end();
  log.info('Waiting for next request...');
};

const mailWatcher = new MailWatcher(config);
let counter = 1;
let finished = false;
let sessionData = undefined;
let oldSessionId = undefined;

const requestListener = async (req, res, data) => {
  if (req.url === '/') { // prevent favicon second request
    log.info();
    log.info(`Request #${counter} from client`);
    if (counter === 1 || counter % config.updateMailPerRequest === 0) {
      log.info('Checking email for new session');
      delete mailWatcher.sessionInfo.Id;
      delete mailWatcher.sessionInfo.Token;
      mailWatcher.connect();
    }    
    
    const timer = setInterval(() => {
      if (!mailWatcher.sessionInfo.Id || !mailWatcher.sessionInfo.Token) {
        log.info("Waiting for session info...");
      } else {
        log.info('Found Garmin session, comparing');
        log.info(`old: ${oldSessionId} vs new: ${mailWatcher.sessionInfo.Id} => ${oldSessionId === mailWatcher.sessionInfo.Id ? 'same' : 'new'} session`);        
        oldSessionId = mailWatcher.sessionInfo.Id;
        fetchData(mailWatcher.sessionInfo.Id, res, (finished || counter % config.updateDataPerRequest != 0 || oldSessionId === mailWatcher.sessionInfo.Id));
        clearInterval(timer);
        return;
      };
    }, config.waitForId);
    counter++;
  }
};

const httpServer = http.createServer(requestListener);
httpServer.listen(config.httpPort, config.httpHost, () => {
  log.info(`Server is running on http://${config.httpHost}:${config.httpPort}`);
});
