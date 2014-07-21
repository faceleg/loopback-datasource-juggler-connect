var defaults = {
  table: 'sessions',
  maxAge: 1000 * 60 * 60 * 24 * 14
};

function noop() {}

module.exports = function(session) {
  "use strict";
  var Store = session.Store;

  function JugglerStore(schema, options) {
    options = options || {};
    Store.call(this, options);
    this.maxAge = options.maxAge || defaults.maxAge;
    var coll = this.collection = schema.define('session', {
      sid: {
        type: String,
        index: true
      },
      expires: {
        type: Date,
        index: true
      },
      session: schema.constructor.JSON
    }, {
      table: options.table || defaults.table
    });

    coll.validatesUniquenessOf('sid');

    // destroy all expired sessions after each create/update
    coll.afterSave = function(next) {
      coll.find({
        where: {
          expires: {
            lte: new Date()
          }
        }}, function(error, sessions) {
          sessions.forEach(function(session) {
            session.destroy();
          });

          next();
        });
    };
  }

  /**
   * Inherit from `Store`.
   */
  require('util').inherits(JugglerStore, Store);

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} callback
   * @api public
   */
  JugglerStore.prototype.get = function(sid, callback) {
    var self = this;
    callback = callback || noop;
    this.collection.findOne({where: {sid: sid}}, function(err, session) {
      if (err) return callback(err);
      if (!session) return callback();
      if (!session.expires || new Date() < session.expires) {
        callback(null, session.session);
      } else {
        self.destroy(sid, callback);
      }
    });
  };

  /**
   * Commit the given `session` object associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} session
   * @param {Function} callback
   * @api public
   */
  JugglerStore.prototype.set = function(sid, session, callback) {
    callback = callback || noop;
    var s = {
      session: session
    };
    if (session && session.cookie && session.cookie.expires) {
      s.expires = new Date(session.cookie.expires);
    } else {
      s.expires = new Date(Date.now() + this.maxAge);
    }
    var coll = this.collection;
    coll.findOne({where: {sid: sid}}, function(err, session) {
      if (err) return callback(err);
      if (session) {
        session.updateAttributes(s, function(err) {
          callback(err);
        });
      } else {
        s.sid = sid;
        coll.create(s, function(err) {
          callback(err);
        });
      }
    });
  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Function} callback
   * @api public
   */
  JugglerStore.prototype.destroy = function(sid, callback) {
    callback = callback || noop;
    var coll = this.collection;
    coll.findOne({where: {sid: sid}}, function(err, session) {
      if (err) return callback(err);
      if (!session) return callback();
      session.destroy(callback);
    });
  };

  /**
   * Fetch number of sessions.
   *
   * @param {Function} callback
   * @api public
   */
  JugglerStore.prototype.length = function(callback) {
    this.collection.count(callback);
  };

  /**
   * Clear all sessions.
   *
   * @param {Function} callback
   * @api public
   */
  JugglerStore.prototype.clear = function(callback) {
    this.collection.destroyAll(callback);
  };

  return JugglerStore;
};
