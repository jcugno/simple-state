var util = require('util');

function State(opts) {

  this.states = {};
  this.db = opts.db;
  this.assetId = opts.assetId;
  this.collectionName = opts.collectionName;

  if(typeof this.assetId === 'string') {
    this.assetId = this.db.ObjectID.createFromHexString(this.assetId);
  }

  this.collection = this.db.collection(this.collectionName);
}

State.NOT_STARTED = 0;
State.IN_PROGRESS = 1;
State.COMPLETED = 2;

State.ERROR = 99;

State.prototype.set = function(prop, val, cb) {
  this.states[prop] = val;

  this._update(prop, val, cb);
};

State.prototype.get = function(prop) {
  return this.states[prop];
};

State.prototype.getAssets = function(states, cb) {

  if (!util.isArray(states)) { states = [states]; }

  this._getAssetsFromDb(states, cb);
};

State.prototype._getAssetsFromDb = function(states, cb) {

  var query = {};

  states.forEach(function(state) {
    var keys = Object.keys(state);

    query['state.' + keys[0]] = {$in  : state[keys[0]]};
  });


  this.collection.find(query).toArray(function(err, assets) {
    cb(err, assets);
  });
};

State.prototype._update = function(prop, val, cb) {

  var stateProp = 'state.' + prop;

  var criteria = {_id : this.assetId };
  var update = {$set : {}};
  update.$set[stateProp] = val;

  this.collection.update(criteria, update, function(err, count) {
    if (cb) { cb(err, count); }
  });
};


State.prototype.isInProgress = function(state) {
  return this.states[state] === State.IN_PROGRESS ? true : false;
};

State.prototype.isCompleted = function(state) {
  return this.states[state] === State.COMPLETED ? true : false;
};

State.prototype.hasStarted = function(state) {
  return this.states[state] === State.NOT_STARTED ? false : true;
};

State.prototype.hasNotStarted = function(state) {
  return !this.hasStarted(state);
};

State.prototype.isError = function(state) {
  return this.states[state] === State.ERROR ? true : false;
};

module.exports = State;
