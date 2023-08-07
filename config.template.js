module.exports = {
  // Mail credentials
  username: 'email_account', // usualy without domain (in gmail ussually with ;)
  password: 'your_password',
  host: 'domain.com', // same as host with SSL cert

  // IMAP host to connect to to read the email from garmin, recommended local server (postfix)
  // gMail IS NOT recommended cause after so many request there will be timeouts of connection
  // most propably it's because firewall blocks such amount of connections & also it is slower

  // defaults to gmail
  // host: 'imap.gmail.com',
  // port: 993, default is 587 (usually postfix use that port)
  // tls: true,
  // secure: true,
  // keepalive: true,
  
  // Folder to look for the email in, defaults to INBOX but if you're using gmail and it doesn't find it try uncommenting the All Mail folder
  // label: '[Gmail]/All Mail',
  
  // Should we mark the garmin email seen after getting the link from it?
  // markSeen: false,

  // httpHost: 'localhost',
  // set this to 0.0.0.0 if you want to put that on external adress (public on internet! warning, there is no authorization for that)
  // httpPort: 8200,
  // waitForId: 300,

  // in HA cause default update every 1 minute - token from email will be updated every X minutes to prevent connection hammering also
  // updateMailPerRequest: 5,

  // this parameter is used for update session data - only every X minutes when session is finished (but ongoing updates every minute)
  // updateDataPerRequest: 360,

  // Getting session id/token will be executed on 1 and every {updateMailPerRequest} request.
  // Getting session data will be executed on 1 and every {updateDataPerRequest} request or if service detect new session Id (different from old)
  // For request like e.g. 2-4 request (for email) or 2-359 request (for data) cache will be used instead fetch request (only for finished activity)

};
