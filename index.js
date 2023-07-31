const log = require('signale').scope('Core');
const MailWatcher = require('./lib/MailWatcher');
const http = require('http');
const fetch = require('node-fetch');
const assign = require('assign-deep');
const { getUnpackedSettings } = require('http2');

const VERSION = require('./package.json').version

let config = {
    username: '',
    password: '',

    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    secure: true,
    label: 'INBOX',

    markSeen: false,
    waitForId: 1000,

    httpHost: 'localhost',
    httpPort: 8200,
};

log.info(`Starting garmin-livetrack-to-json v${VERSION}`);

try {
    assign(config, require('./config.js'));
} catch (e) {
    log.warn("You should create an config.js file based on the config.template.js template to overwrite the default values")
}

let data = {};

const fetchData = async (id, res) => {
  const url = `https://livetrack.garmin.com/services/session/${id}/trackpoints?requestTime=${Date.now()}`;
  log.info(`Fetching ${url}`);
  const response = await fetch(url);

  if (response.status !== 200) {
    log.warn("Invalid response received - The previous link may have expired and the new one hasn't been delivered yet?");
    
    data = await response.text();
    log.warn(`response: ${data}`);
    
    return;
  }

  data = await response.json();
  log.info('Got data, writing response');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.write(JSON.stringify(data));
  res.end();
  log.info('Waiting for next request...');
};


const mailWatcher = new MailWatcher(config);

const requestListener = async (req, res, data) => {
  if (req.url === '/') { // prevent favicon second request
    log.info();
    log.info(`New request, clean old and check for new Id/Token`);
    delete mailWatcher.sessionInfo.Id;
    delete mailWatcher.sessionInfo.Token;
    mailWatcher.connect();
    const timer = setInterval(() => {
      if (!mailWatcher.sessionInfo.Id || !mailWatcher.sessionInfo.Token) {
        log.info("Waiting for session info...");
      } else {
        log.info("Found Garmin Livetrack Session Id/Token");
        data = fetchData(mailWatcher.sessionInfo.Id, res);
        clearInterval(timer);
        return;
      };  
    }, 300);
  }
};

const httpServer = http.createServer(requestListener);
httpServer.listen(config.httpPort, config.httpHost, () => {
  log.info(`Server is running on http://${config.httpHost}:${config.httpPort}`);
});
