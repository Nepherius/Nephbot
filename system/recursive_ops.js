const winston = require('winston');
const rfr = require('rfr');
const moment = require('moment');
const GlobalFn = rfr('system/globals.js');

const Agenda = require('agenda');
const mongoConnectionString = "mongodb://localhost/agenda";
const agenda = new Agenda({
    db: {
        address: mongoConnectionString
    },
    defaultLockLifetime: 120000
});

agenda.define('start replica', function(job) {
    GlobalFn.isReplicaConnected();
});

agenda.define('update player database', function(job) {
    GlobalFn.updatePlayerDb();
});

agenda.define('clean friend list', function(job) {
    GlobalFn.cleanFriendList();
});

agenda.on('ready', function() {
    agenda.every('1 minutes', 'start replica');
    agenda.every('24 hours','update player database');
  //  agenda.every('48 hours','clean friend list'); only enable this for raidbots
    agenda.start();
});
