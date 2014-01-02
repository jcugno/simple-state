var State = require('../state')
  , assert = require('chai').assert
  , mongo = require('mongoskin')
  , sinon = require('sinon');

describe("State", function() {

  var state;
  var db;
  var collectionName = 'assets';

  before(function() {

    db = mongo.db('127.0.0.1::27017', {database: "state-test", w:1});
    state = new State({db : db, assetId : 12345, collectionName : collectionName});

    sinon.stub(state.db.collection(collectionName), 'update');
    sinon.stub(state.db.collection(collectionName), 'find');
  });

  afterEach(function() {
    state.states = {};
    state.db.collection(collectionName).update.reset();
    state.db.collection(collectionName).find.reset();
  });

  after(function() {
    state.db.collection(collectionName).update.restore();
    state.db.collection(collectionName).find.restore();
  });

  describe('get assets', function() {

    it('should return assets based on states', function(done) {

      var states = [];
      states.push({moveAsset : [State.IN_PROGRESS, State.COMPLETED]});
      states.push({matchAsset : [State.IN_PROGRESS]});

      var assets = [{_id : 1}, {_id : 2}];

      var cursor = {
        toArray: function(cb) {
          cb(null, assets);
        }
      };

      state.collection.find.returns(cursor);

      state.getAssets(states, function(err, returnedAssets) {

        var expectedQuery = {
          'state.moveAsset' : {$in : [1, 2]},
          'state.matchAsset' : {$in : [1]}
        };

        assert(state.collection.find.calledWith(expectedQuery));
        assert.deepEqual(assets, returnedAssets);

        done();
      });
    });

  });

  describe("set state", function() {

    it("Should set the state and call update on the document", function() {

      var collection = state.db.collection(collectionName);

      var expectedSet = {
        $set : {
          'state.moveAsset' : 1
        }
      };

      state.set('moveAsset', State.IN_PROGRESS);

      assert(collection.update.calledWith({_id : 12345}, expectedSet));
    });
  });

  it("should know its in progress", function() {

    state.set('moveAsset', State.IN_PROGRESS);

    assert(state.get('moveAsset') === State.IN_PROGRESS);
    assert(state.isInProgress('moveAsset'));
  });

  it("should know its completed", function() {

    state.set('moveAsset', State.COMPLETED);

    assert(state.get('moveAsset') === State.COMPLETED);
    assert(state.isCompleted('moveAsset'));
  });

  it("should know it hasn't started", function() {

    state.set('moveAsset', State.NOT_STARTED);

    assert(state.get('moveAsset') === State.NOT_STARTED);
    assert(!state.hasStarted('moveAsset'));
    assert(state.hasNotStarted('moveAsset'));
  });

  it("should return error status correctly", function() {

    state.set('moveAsset', State.ERROR);

    assert(state.get('moveAsset') === State.ERROR);
    assert(state.isError('moveAsset'));
  });
});
