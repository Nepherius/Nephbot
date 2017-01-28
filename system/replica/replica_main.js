const rfr = require('rfr');
const winston = require('winston');
const request = require('request');
const parseString = require('xml2js').parseString;
const assert = require('assert');
const util = require('util');
const events = require('events');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const moment = require('moment');
mongoose.connect('mongodb://localhost/darknet');

const connect = rfr('./system/core/connect');
const handle = connect.handle;
const s = connect.s;
const pack = rfr('./system/core/pack');
const auth = rfr('./system/core/chat-packet');
const Replica = rfr('./config/models/replica_login.js');
const Player = rfr('./config/models/player.js');
const Online = rfr('./config/models/online.js');

const start = startBot;
const GlobalFn = {
    getPlayerData: function(userId, userName) {
        request('http://people.anarchy-online.com/character/bio/d/5/name/' + userName + '/bio.xml', function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body.length > 20) { // check if xml is empty
                    parseString(body, function(err, result) {
                        if (err) {
                            winston.warn('Error parsing response from AO People: ' + err);
                            GlobalFn.backUpGPD(userId, userName);
                        } else {
                            let charName = result.character.name[0];
                            let charStats = result.character.basic_stats[0];
                            let charOrg = {};
                            if (result.character.organization_membership !== undefined) {
                                charOrg.name = result.character.organization_membership[0].organization_name;
                                charOrg.rank = result.character.organization_membership[0].rank;
                            } else {
                                charOrg.name = 'No organization';
                                charOrg.rank = 'None';
                            }

                            // Create Or Update Player Database
                            Player.findOneAndUpdate({
                                _id: userId
                            }, {
                                firstname: charName.firstname,
                                name: charName.nick,
                                lastname: charName.lastname,
                                level: Number(charStats.level),
                                breed: charStats.breed,
                                gender: charStats.gender,
                                faction: charStats.faction,
                                profession: charStats.profession,
                                profession_title: charStats.profession_title,
                                ai_rank: charStats.defender_rank,
                                ai_level: Number(charStats.defender_rank_id),
                                org: charOrg.name,
                                org_rank: charOrg.rank,
                                lastupdate: Date.now(),
                                source: 'people.anarchy-online.com'
                            }, {
                                upsert: true,
                                setDefaultsOnInsert: true
                            }, function(err) {
                                if (err) {
                                    winston.error(err);
                                } else {
                                    //onClientName.emit(userId, charName.name);
                                }
                            });
                        }
                    });
                }
            }
        }).on('error', function(err) {
            winston.warn('Error while trying to connect to AO People: ' + err);
            GlobalFn.backUpGPD(userId, userName);
        });
    },

    backUpGPD: function(userId, userName) {
        request('https://rubi-ka.net/services/characters.asmx/GetAoCharacterXml?name=' + userName, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body.length > 20) { // check if xml is empty
                    parseString(body, function(err, result) {
                        let charName = result.character.name[0];
                        let charStats = result.character.basic_stats[0];
                        let charOrg = {};
                        if (result.character.organization_membership !== undefined) {
                            charOrg.name = result.character.organization_membership[0].organization_name;
                            charOrg.rank = result.character.organization_membership[0].rank;
                        } else {
                            charOrg.name = 'No organization';
                            charOrg.rank = 'None';
                        }

                        // Create Or Update Player Database
                        Player.findOneAndUpdate({
                            _id: userId
                        }, {
                            firstname: charName.firstname,
                            name: charName.nick,
                            lastname: charName.lastname,
                            level: Number(charStats.level),
                            breed: charStats.breed,
                            gender: charStats.gender,
                            faction: charStats.faction,
                            profession: charStats.profession,
                            profession_title: charStats.profession_title,
                            ai_rank: charStats.defender_rank,
                            ai_level: Number(charStats.defender_rank_id),
                            org: charOrg.name,
                            org_rank: charOrg.rank,
                            lastupdate: Date.now(),
                            source: 'Rubi-Ka.net'
                        }, {
                            upsert: true,
                            setDefaultsOnInsert: true
                        }, function(err) {
                            if (err) {
                                winston.error(err);
                            } else {
                                //onClientName.emit(userId, charName.name);
                            }
                        });
                    });
                }
            }
        }).on('error', function(err) {
            winston.warn('Unable to retrieve player data from Rubi-Ka.net ' + err);

        });
    }
};

Replica.findOneAndUpdate({
    'replicaname': process.argv[2]
}, {
    'ready': true
}).then(function(result) {
    GlobalFn.botname = result.replicaname;
    GlobalFn.replicaname = result.replicaname;
    GlobalFn.Login = result.username;
    GlobalFn.Pass = result.password;
    start('chat.d1.funcom.com', 7105);
}).catch(function(err) {
    winston.error(err);
});

const buddyStatus = new events.EventEmitter();

// Configure Log
//{ error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
winston.configure({
    level: 'info',
    transports: [
        new(winston.transports.Console)({
            colorize: true,
            'timestamp': true,
            handleExceptions: true,
            humanReadableUnhandledException: true
        }),
        new(require('winston-daily-rotate-file'))({
            filename: './log',
            prepend: true,
            handleExceptions: true,
            humanReadableUnhandledException: true
        })
    ]
});


process.on('message', function(Obj) {
    if (Obj.buddyAction !== null && Obj.buddyAction !== undefined) {
        if (Obj.buddyAction === 'add') {
            send_BUDDY_ADD(Obj.buddyId);
        } else if (Obj.buddyAction === 'rem') {
            send_BUDDY_REMOVE(Obj.buddyId);
        }
    } else {
        // what happens if the message is not a buddy add/rem event
    }
    Replica.findOneAndUpdate({
        'replicaname': GlobalFn.replicaname
    }, {
        'ready': true
    }, function(err) {
        if (err) {
            winston.error(err);
        }
    });
});

// Login
const startTime = process.hrtime(); // Used later to prevent login PM spam

function pack_key(key) {
    return pack.pack(
        [
            ['I', 0],
            ['S', GlobalFn.Login],
            ['S', key]
        ]);
}
handle[auth.AOCP.LOGIN_SEED] = function(payload) {
    winston.debug('Login_SEED');
    var seedLength = payload.readInt16BE(0);
    assert.equal(seedLength, payload.length - 2);
    var seed = payload.slice(2);

    let data = pack_key(auth.generate_login_key(seed, GlobalFn.Login, GlobalFn.Pass));
    var pp = auth.assemble_packet(auth.AOCP.LOGIN_REQUEST, data);

    s.write(pp);
};
// Select Character
handle[auth.AOCP.LOGIN_CHARLIST] = function(data) {
    var chars = pack.unpack(data);
    winston.debug(chars); // Display all chars on the account
    for (let key in chars) {
        if (key.toLowerCase() === GlobalFn.botname.toLowerCase()) {
            winston.info(GlobalFn.botname + ' Found');
            var i = Object.keys(chars).indexOf(key);
            GlobalFn.botId = chars[Object.keys(chars)[i]].id;
            break;
        }
    }
    if (!GlobalFn.botId) {
        winston.error(GlobalFn.botname + ' was not found on this account!');
        process.exitCode = 1;
    }
    winston.debug({
        botId: GlobalFn.botId
    });
    data = pack.pack([
        ['I', GlobalFn.botId]
    ]);
    var pp = auth.assemble_packet(auth.AOCP.LOGIN_SELECT, data);
    s.write(pp);
};



/*************** RESPONSE HANDLERS ***************/
handle[auth.AOCP.LOGIN_ERROR] = function(data, u) {
    let loginError = u.S();
    pack.unpackError(data);
    winston.error(loginError);
    GlobalFn.die();
};

handle[auth.AOCP.LOGIN_OK] = function() {
    winston.info(process.argv[2] +' logged on!');

    const recursivePing = function() {
        send_PING();
        setTimeout(recursivePing, 120000);
    };
    recursivePing();
};

handle[auth.AOCP.CLIENT_NAME] = function(data, u) {
    let userId = u.I();
    let userName = u.S();
    u.done();
    Player.findOne({
        '_id': userId
    }, function(err, result) {
        if (err) {
            winston.error(err);
        } else if (result === null || result === undefined ||
            (moment().subtract(24, 'hours').isAfter(moment(result.lastupdate)) &&
          process.hrtime(startTime)[0] > 20)) {
            GlobalFn.getPlayerData(userId, userName);
        } else {
            winston.debug('No update for: ' + userId + ' already updated on ' +
                result.lastupdate);
        }
    });
};

handle[auth.AOCP.BUDDY_ADD] = function(data, u) { // handles online/offline status too
    let userId = u.I();
    var userStatus = u.I() == 1 ? 'online' : 'offline';
    var unknownPart = u.S();
    u.done();
    winston.debug({
        userId: userId,
        userStatus: userStatus
    });
    if (userStatus === 'online') {
        buddyStatus.emit('online', userId, userStatus);
    } else if (userStatus === 'offline') {
        buddyStatus.emit('offline', userId, userStatus);
    }
};

handle[auth.AOCP.BUDDY_REMOVE] = function(data, u) {
    let userId = u.I();
    u.done();
    winston.debug(process.argv[2] + ' BUDDY_REMOVE:' + userId);
    buddyStatus.emit('offline', userId);
};

handle[auth.AOCP.MESSAGE_SYSTEM] = function(data, u) {
    var systemMsg = u.S();
    u.done();
    winston.debug('System Message : ' + systemMsg);
};
handle[auth.AOCP.CLIENT_LOOKUP] = function(data, u) {
    let userId = u.I();
    var userName = u.S();
    u.done();
    let idResult = userId;
    winston.debug('CLIENT_LOOKUP:', {
        userId: userId,
        userName: userName
    });
};

handle[auth.AOCP.CHAT_NOTICE] = function(data, u) {
    let userId = u.I();
    var data2 = u.I(); // ?
    var data3 = u.I(); // ?
    var text = u.S();
    u.done();
    winston.debug('CHAT_NOTICE:', {
        userId: userId,
        data2: data2,
        data3: data3,
        text: text
    });
};

handle[auth.AOCP.GROUP_ANNOUNCE] = function(data, u) {
    var buffer = u.G();
    var channelName = u.S();
    var unknownId = u.I();
    var unknownPart = u.S();
    u.done();
};

handle[auth.AOCP.PING] = function(data, u) {
    var Pong = u.S();
    u.done();
    winston.debug({
        Pong: Pong
    });
};


/*************** Requests ***************/

global.send = function(type, spec) {
    s.write(auth.assemble_packet(type, pack.pack(spec)));
};


global.send_MESSAGE_PRIVATE = function(userId, text) {
    winston.info('%s: %s -> %d', process.argv[2], text, userId);
    send(
        auth.AOCP.MESSAGE_PRIVATE, [
            ['I', userId],
            ['S', text],
            ['S', '\0']
        ]);
};

global.send_ONLINE_SET = function(arg) {
    winston.info('SET ONlINE');
    send(
        auth.AOCP.ONLINE_SET, [
            ['I', arg]
        ]);
};

global.send_BUDDY_ADD = function(userId) {
    winston.info('%s -> BUDDY_ADD_id %d', process.argv[2], userId);
    send(
        auth.AOCP.BUDDY_ADD, [
            ['I', userId],
            ['S', '\u0001']
        ]);
};

global.send_BUDDY_REMOVE = function(userId) {
    winston.info('%s -> BUDDY_REMOVE_id %d', process.argv[2], userId);
    send(
        auth.AOCP.BUDDY_REMOVE, [
            ['I', userId]
        ]);
};

global.send_PING = function() {
    winston.debug('Ping');
    send(
        auth.AOCP.PING, [
            ['S', 'Ping']
        ]);
};
// Friend(Buddy) List
buddyStatus.on('online', function(userId, userStatus) {
    Player.findOneAndUpdate({
        '_id': userId
    }, {
        'lastseen': Date.now()
    }, function(err, result) {
        if (err) {
            winston.error(err);
        } else {
            winston.debug('Updated lastseen of user: ' + userId);
            if (result !== null && result.autoinvite && result.banned === false) {
                winston.debug('Sending invite request for user: ' + userId);
                process.send({
                    type: 'invite',
                    userId: userId
                });
            }
        }
    });
    var addOnline = new Online();
    addOnline._id = userId;
    addOnline.save(function(err) {
        if (err) {
            winston.error('Failed adding to Online: ' + err);
        }
    });
});

buddyStatus.on('offline', function(userId, userStatus) {
    Online.remove({
        _id: userId
    }, function(err) {
        if (err) {
            winston.error('Remove from online failed: ' + err);
        }
    });
});
