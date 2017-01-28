const fork = require('child_process').fork;
const util = require('util');
const winston = require('winston');
const rfr = require('rfr');
const _ = require('lodash');
const Promise = require('bluebird');

const GlobalFn = require('../globals');
const Replica = rfr('config/models/replica_login');
const Player = rfr('config/models/player');
const Online = rfr('config/models/online');
const Chat = rfr('config/models/prvGroup');

// This will hold all the replica names
const ReplicaList = {};


GlobalFn.isReplicaConnected = function() {
    Replica.find({}, function(err, result) {
        if (err) {
            winston.error(err);
        } else if (result !== null) {
            for (let i = 0, len = result.length; i < len; i++) {
                setTimeout(function() {
                    if (ReplicaList[result[i].replicaname] === undefined ||
                        !ReplicaList[result[i].replicaname].connected) {
                        try {
                            //Start Child processes
                            ReplicaList[result[i].replicaname] = fork('system/replica/replica_main.js', [result[i].replicaname]);
                            //Setup Child message listener
                            ReplicaList[result[i].replicaname].on('message', function(data) {
                                handleChildMessage(data);
                            });
                        } catch (err) {
                            winston.error(err);
                        }
                    }
                }, i * 5000);
            }
        }
    });
};

function handleChildMessage(msgObj) {
    if (msgObj.type === 'invite') {
      winston.debug('Inviting user to group on child request');
        send_PRIVGRP_INVITE(msgObj.userId);
    }
}
GlobalFn.replicaBuddyList = function(buddyObj) {
    if (buddyObj.buddyAction === 'add') {
        //stackoverflow solution all credit due to: jfriend00
        replicaArr = _.keys(ReplicaList);
        Promise.firstToPassInSequence = function(arr, fn) {
            let index = 0;

            function next() {
                if (index < arr.length) {
                    return Promise.resolve().then(function() {
                        // if fn() throws, this will turn into a rejection
                        // if fn does not return a promise, it is wrapped into a promise
                        return Promise.resolve(fn(arr[index++])).then(function(val) {
                            return val ? val : next();
                        });
                    });
                }
                // make sure we always return a promise, even if array is empty
                return Promise.resolve(null);
            }
            return next();
        };

        Promise.firstToPassInSequence(replicaArr, function(replicaname) {
            return Player.countAsync({
                buddyList: replicaname
            }).then(function(result) {
                // if replica is connected and room left in buddy list
                if (ReplicaList[replicaname].connected && result < 990) {
                    return Player.updateAsync({
                        '_id': buddyObj.buddyId
                    }, {
                        'buddyList': replicaname
                    }).then(function() {
                        ReplicaList[replicaname].send(buddyObj);
                        return replicaname;
                    });
                }
            });
        });
    } else if (buddyObj.buddyAction === 'rem') {
        Player.update({
            '_id': buddyObj.buddyId
        }, {
            'buddyList': 'main'
        }, function(err) {
            if (err) {
                winston.error(err);
            } else {
                try {
                    ReplicaList[buddyObj.replica].send(buddyObj);
                } catch (e) {
                    winston.error(e);
                }
            }
        });

    }
};


/* To be used by raid bots

for (let i = 0, len = playerArray.length; i < len; i++) {
    findAvailableReplica(5000).then(function(result) {
        let replica = ReplicaList[result.replicaname];
        // Check if replica is connected and receiving messages;
        if (replica !== undefined && replica.connected) {
            replica.send({
                playerArray: playerArray[i],
                channel: msgObj.channel,
                sender: msgObj.name,
                sender_id: msgObj.userid,
                message: msgObj.message
            });
        } else {
            // If no replica is found repeat last iteration
            i--;
        }
    });
}

*/


function removeNull(e) {
    return e._id !== null;
}

function findAvailableReplica(delay) {
    return new Promise(function(resolve, reject) {
        function next() {
            winston.debug('Searching for an available replica...');
            Replica.findOneAndUpdate({
                'ready': true
            }, {
                'ready': false
            }).then(function(result) {
                if (result !== null) {
                    // found a result, exiting loop
                    winston.debug('Found replica ' + result.replicaname);
                    resolve(result);
                } else {
                    // run another iteration of the loop after delay
                    setTimeout(next, delay);
                }
            }, reject).catch(function(err) {
                winston.error(err);
            });
        }
        // start first iteration of the loop
        next();
    });
}
