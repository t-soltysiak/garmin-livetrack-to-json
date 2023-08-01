module.exports = {
  // Mail credentials
  username: 'your.email@gmail.com',
  password: 'your_password',

  // IMAP host to connect to to read the email from garmin, defaults to gmail
  // host: 'imap.gmail.com',
  // port: 993,
  // tls: true,
  // secure: true,
  // keepalive: true,
  
  // Folder to look for the email in, defaults to INBOX but if you're using gmail and it doesn't find it try uncommenting the All Mail folder
  // label: '[Gmail]/All Mail',
  
  // Should we mark the garmin email seen after getting the link from it?
  // markSeen: false,

  // httpHost: 'localhost',
  // httpPort: 8200,
  // waitForId: 300,

  // in HA cause default update every 1 minute - token from email will be updated every X minutes to prevent connection hammering also
  // this parameter is used for update session data - only every X minutes when session is finished (but ongoing updates every minute)
  // updatesEveryRequest: 5,

  // Getting session id/token+data will be executed on 1 and every 5 request. On 2 - 4 request cache will be used for finished activity
};
