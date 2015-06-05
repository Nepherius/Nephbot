var assert = require('assert')
var util = require('util')
var events = require('events')
var Q = require('q')
var express = require('express');
var mysql = require('mysql');
var _ = require('underscore')

// Import commands
var whois_module = require('./whois_module.js')
var raid_module = require('./raid_module.js')
var test_module = require('./test_module.js')
var items_module = require('./items_module.js')

// Access groups NOT IN USE
global.all = 0
global.member = 1
global.leader = 2 
global.mod = 3
global.admin = 4
global.owner = 5
//

var commands = {
    lookupUserName: function (userName) {
        var result = Q.defer()
        outstandingLookups.once(userName, function (idResult) {
            result.resolve(idResult)
        })

        console.log('Looking up id for ' + userName)
        send_CLIENT_LOOKUP(userName)

        return result.promise
    },

    invite: function (userId, userName) {
								
        if (userName !== undefined) {
            commands.lookupUserName(userName).then(function (idResult) {
                (idResult !== -1) ? (send_PRIVGRP_INVITE(idResult), send_MESSAGE_PRIVATE(userId, 'Invited ' + userName + ' to this channel')) : send_MESSAGE_PRIVATE(userId, 'Username not found')
            })
        } else {

            send_PRIVGRP_INVITE(userId);
        }
    },
    join: function (userId, userName) {
        send_PRIVGRP_INVITE(userId);
    },


    kick: function (userId, userName) {
        if (userName !== undefined) { // Check user access
            commands.lookupUserName(userName).then(function (idResult) {
                (idResult !== -1) ? (send_PRIVGRP_KICK(idResult), send_MESSAGE_PRIVATE(userId, 'Kicked ' + userName + ' from this channel')) : send_MESSAGE_PRIVATE(userId, 'Username not found')
            })
        } else {
            send_PRIVGRP_KICK(userId);
        }

    },
	
	kickall: function() {
		send_PRIVGRP_KICKALL()
	},
	
	
	leave: function (userId) {
			connectdb().done(function(connection) {
				query(connection, 'SELECT * FROM channel WHERE charid = ' + userId).done(function(result) {
					if (result[0].length !== 0) {
						send_PRIVGRP_KICK(userId)
						send_MESSAGE_PRIVATE(userId, 'You\'ve left the channel')
					}
					connection.release()	
				})				
			})			
			
	},	

	
	cmdlist : function (userId) {
		cmdList = [];
		for (key in cmd) {
			if (!(key.match(/cmdlist/i)  || key.match(/lookupUserName/i))) {
				cmdList.push(key)
			}	
		}
		cmdList.sort()
		printCmdList = ''
		for (i = 0; i < cmdList.length; i++) {
			printCmdList += '<a href=\'chatcmd:///tell ' + Botname + ((cmdList[i].match(/help/)) ? ' ' : ' help ') + cmdList[i] + '\'>' + cmdList[i] + '</a>' + "\n"
		}
		send_MESSAGE_PRIVATE(userId, '<a href="text://' + printCmdList + '">Command List</a>' );
	},


	towers: function(userId) { // parse tower.info
			console.log('To Be Added')	
	
	},
	addadmin : function(userId,userName) {
		if (userName !== undefined) {
			commands.lookupUserName(userName).then(function (idResult) {
				if (idResult === -1) {
					send_MESSAGE_PRIVATE(userId, userName + ' not found')	
				} else {	
					connectdb().done(function (connection) {
						
						query(connection,'SELECT * FROM admins WHERE name ="' + userName + '"').done(function(result) {
							if (result[0].length !== 0) { //first check if player is already an admin or mod
								if (result[0][0].level >= 4) {
									send_MESSAGE_PRIVATE(userId, userName + ' is already an admin')
									connection.release()
								} else {
									query(connection,'UPDATE admins SET level = 4 WHERE name = "' + userName + '"').done(function(result) {
										send_MESSAGE_PRIVATE(userId, 'Promoted ' + userName + ' to admin')
										connection.release()
									})	
								}	
							} else {
								query(connection,'INSERT INTO admins (charId, name,level,rank) VALUES (' + idResult + ',"' + userName + '",' + 4 + ',"admin")').done(function(result) {
									send_BUDDY_ADD(idResult)
									send_MESSAGE_PRIVATE(userId, userName + ' is now an admin')
									connection.release()
								})
							}	
						})
						
					})
				}
				
			})	
		} else {
		send_MESSAGE_PRIVATE(userId,'Usage: addadmin <player name>')	
			
		}
	},
	addmod : function(userId,userName) {
		if (userName !== undefined) {
			commands.lookupUserName(userName).then(function (idResult) {
				if (idResult === -1) {
					send_MESSAGE_PRIVATE(userId, userName + ' not found')	
				} else {	
					connectdb().done(function (connection) {
						query(connection,'SELECT * FROM admins WHERE name ="' + userName + '"').done(function(result) {
							if (result[0].length !== 0) { //first check if player is already an admin or mod
								if (result[0][0].level == 3) {
									send_MESSAGE_PRIVATE(userId, userName + ' is already a moderator')
									connection.release()
								} else if (result[0][0].level >= 4) {
									send_MESSAGE_PRIVATE(userId, userName + ' is already an admin')
									connection.release()
								
								} else {
									connection.release() // just to be safe
								}	
							} else {
								query(connection,'INSERT INTO admins (charId, name,level,rank) VALUES (' + idResult + ',"' + userName + '",' + 3 + ',"moderator")').done(function(result) {
									send_BUDDY_ADD(idResult)
									send_MESSAGE_PRIVATE(userId, userName + ' is now a moderator')
									connection.release()
								})
							}	
						})
					})
				}
				
			})	
		} else {
		send_MESSAGE_PRIVATE(userId,'Usage: addmod <player name>')	
			
		}
	},
	deladmin: function(userId, userName) {
		if (userName !== undefined) {	
			connectdb().done(function (connection) { 	
				query(connection,'SELECT * FROM admins WHERE name = "' + userName + '"').done(function(result) {
					if (result[0].length === 0) {
						send_MESSAGE_PRIVATE(userId, userName + ' is not an admin')
						connection.release()
					} else {
						adminCharId = result[0][0].charid
						query(connection,'DELETE FROM admins WHERE name = "' + userName + '"').done(function(result) {
						send_BUDDY_REMOVE(adminCharId)
						send_MESSAGE_PRIVATE(userId, userName + ' is no longer an admin')
						connection.release()									
						})
					}	
				})
			})	
		}
		else {
			send_MESSAGE_PRIVATE(userId,'Usage: deladmin <player name>')
		}
		
	},
	addmember: function(userId,userName) {
		if (userName !== undefined) {
			commands.lookupUserName(userName).then(function (idResult) {
				if (idResult === -1) {
				send_MESSAGE_PRIVATE(userId, userName + ' not found')	
				} else {	
					connectdb().done(function(connection) {
						query(connection,'SELECT * FROM members WHERE name = "' + userName + '"').done(function (result) {
							if (result[0].length !== 0) { //first check if player is already an admin 
									send_MESSAGE_PRIVATE(userId, userName + ' is already a member')
									connection.release()
							} else {	
								query(connection,'INSERT INTO members (charId, name) VALUES (' + idResult + ',"' + userName + '")').done(function() {
								send_MESSAGE_PRIVATE(userId, 'Added ' + userName + ' to member list')
								connection.release()	
								})
							}
						})
					
					})
				}		
			})
		} else {
		send_MESSAGE_PRIVATE(userId,'Usage: addmember <player name>')	
			
		}
	},
	delmember: function(userId, userName) {
		if (userName !== undefined) {	
			connectdb().done(function(connection) {
				query(connection,'SELECT * FROM members WHERE name = "' + userName + '"').done(function(result) {
					if (result[0].length === 0) {
						send_MESSAGE_PRIVATE(userId, userName + ' is not a member of this bot')
						connection.release()
					}	else {	
						query(connection,'DELETE FROM members WHERE name = "' + userName + '"').done(function () {
							send_MESSAGE_PRIVATE(userId, userName + ' is no longer a member of this bot')
							connection.release()	
						})	
					}
				})
			})
		}
		else {
			send_MESSAGE_PRIVATE(userId,'Usage: delmember <player name>')
		}
	},
	register: function(userId) {
		connectdb().done(function(connection) {
			query(connection, 'SELECT * FROM members WHERE charId = ' + userId).done(function (result) {
				if (result[0].length !== 0) { //first check if player is already a member
						send_MESSAGE_PRIVATE(userId,' You are already a member')
						connection.release()
				} else {
					getUserName(connection,userId).done(function (result) {
						console.log(result[0][0].name)
						query(connection,'INSERT INTO members (charId, name) VALUES (' + userId + ',"' + result[0][0].name + '")').done(function() {
							send_MESSAGE_PRIVATE(userId, 'You are now a member')
							connection.release()
						})
					})	
				}	
			})	
			
		})
	},
	unregister : function(userId) {
		connectdb().done(function(connection) {
			query(connection,'SELECT * FROM members WHERE charid = ' + userId).done(function(result) {
				if (result.length === 0) {
					send_MESSAGE_PRIVATE(userId, 'You are not a member of this bot')
					connection.release()
				}	else {
					query(connection,'DELETE FROM members WHERE charid = ' + userId).done(function() {
					send_MESSAGE_PRIVATE(userId,' You are no longer a member of this bot')
					connection.release()	
					})	
				}
			})	
			
		})
	},
	online : function(userId) {
		var professions = {
			'Adventurer': {
				icon: '<img src=rdb://84211>',
				alias: 'adv',
				members: []
			},
			'Agent': {
				icon: '<img src=rdb://16186>',
				alias: 'agt',
				members: []
			},
			'Bureaucrat': {
				icon: '<img src=rdb://16341>',
				alias: 'crat',
				members: []
			},
			'Doctor': {
				icon: '<img src=rdb://44235>',
				alias: 'doc',
				members: []
			},
			'Enforcer': {
				icon: '<img src=rdb://117926>',
				alias: 'enf',
				members: []
			},
			'Engineer': {
				icon: '<img src=rdb://44135>',
				alias: 'eng',
				members: []
			},
			'Fixer': {
				icon: '<img src=rdb://16300>',
				alias: 'fix',
				members: []
			},
			'Keeper': {
				icon: '<img src=rdb://39250>',
				alias: 'keeper',
				members: []
			},
			'Martial Artist': {
				icon: '<img src=rdb://16196>',
				alias: 'ma',
				members: []
			},
		'Meta-Physicist': {
				icon: '<img src=rdb://16308>',
				alias: 'mp',
				members: []
			},
			'Nano-Technician': {
				icon: '<img src=rdb://16283>',
				alias: 'nt',
				members: []
			},
			'Shade': {
				icon: '<img src=rdb://39290>',
				alias: 'shade',
				members: []
			},
			'Soldier': {
				icon: '<img src=rdb://16237>',
				alias: 'sol',
				members: []
			},
			'Trader': {
				icon: '<img src=rdb://117924>',
				alias: 'trader',
				members: []
			}
		}

		connectdb().done(function(connection) {	
			query(connection, 'SELECT * FROM players INNER JOIN channel ON players.name = channel.name ORDER BY "name" ASC').done(function(result) {
				
				var onlineReply = '<center><font color=#FFFF00>:: ' + result[0].length + ' characters in private group ::</font></center><br>'
					for (i = 0; i < result[0].length; i++) {
						(professions[result[0][i].profession].members).push(result[0][i].name + ' (<font color=#89D2E8>' + result[0][i].level + '</font>/<font color=#40FF00>' + result[0][i].ai_level + '</font>) - ' +  result[0][i].guild + '\n')
					}
					for (prof in professions) {
						if (professions[prof].members.length > 0) {
							onlineReply += '\n<img src=tdb://id:GFX_GUI_FRIENDLIST_SPLITTER>\n'
							onlineReply += professions[prof].icon
							onlineReply += '<font color=#FFFF00>' + prof + '</font>'
							onlineReply += '\n<img src=tdb://id:GFX_GUI_FRIENDLIST_SPLITTER>\n'
							onlineReply += professions[prof].members
						}	
					}	
					
					send_MESSAGE_PRIVATE(userId, blob('Online', onlineReply) + '(' + result[0].length + ')'  );
				})		
			
				
			connection.release()
		})
	},
	shutdown : function	(userId)
};

commands.whois = whois
commands.raid = raid
commands.bid = bid
commands.list = list
commands.points = points
commands.add = add
commands.rem = rem
commands.flatroll = flatroll
commands.items = items


commands.test = test

module.exports = commands
//console.log(extended.hasOwnProperty('whois'))

function Cmd(helpInfo, commands) {
    var functionName;
    this.help = function (replyTo, helpTopic) {
        if (undefined === helpTopic) {
            send_MESSAGE_PRIVATE(replyTo, 'To Be Added') // point to help file
        } else if (helpInfo.hasOwnProperty(helpTopic)) {
            send_MESSAGE_PRIVATE(replyTo, helpInfo[helpTopic])
        } else {
            send_MESSAGE_PRIVATE(replyTo, 'Requested topic not found');
        }
    };

    for (functionName in commands) {
        if (commands.hasOwnProperty(functionName)) {
            this[functionName] = commands[functionName];
        }
    }
}

var helpCmd = {}
helpCmd.invite = 'To invite a player to the channel use: !invite \'player\'' // a lonely example

// Create an instance of Cmd.
global.cmd = new Cmd(helpCmd, commands);