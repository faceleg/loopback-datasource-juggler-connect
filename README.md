# connect-loopback-datasource-juggler

Loopback Datastore Juggler session store for Connect

Initially forked from [connect-jugglingdb][1].

## Usage

```
var session = require('express-session');
var LoopbackDatastoreJuggler = require('loopback-datastore-juggler');
var JugglerStore = require('connect-loopback-datasource-juggler')(session);

// create LoopbackDatastoreJugglerDB schema object - can be any supported adapter
var schema = new LoopbackDatastoreJugglerDB.Schema('postgres', {
  database: 'mydbname'
});

app.use(express.session({
  store: new JugglerStore(schema, {
    table: 'sessions',                // juggling adapter table name
    maxAge: 1000 * 60 * 60 * 24 * 14  // default duration in milliseconds
  })
}));

schema.autoupdate(function(err) {
  if (err) console.error(err);
});
```

Note that maxAge can also be set in session.cookie.maxAge, see
http://www.senchalabs.org/connect/session.html

## Features

Automatic cleanup of expired sessions


[1]: https://github.com/jugglingdb/connect-jugglingdb
