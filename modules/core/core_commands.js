var assert = require('assert')
var util = require('util')
var events = require('events')
var Q = require('q')
var express = require('express')
var mysql = require('mysql')
var _ = require('underscore')
var capitalize = require('underscore.string/capitalize')

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
            send_PRIVGRP_INVITE(userId)
        }
    },
    join: function (userId) {
        connectdb().done(function(connection) {
			query(connection, 'SELECT * FROM members WHERE charid =' + userId).done(function(result) {
			if (result[0].length !== 0) {
				send_PRIVGRP_INVITE(userId)
				connection.release()	
			} else {
				query(connection, 'SELECT * FROM cmdcfg WHERE cmd = "register"').done(function(result) {
					if (result[0][0].status === "enabled") {
						send_MESSAGE_PRIVATE(userId, 'You have to !register first')
						connection.release()
					} else {
						send_MESSAGE_PRIVATE(userId, 'You are not a member')
						connection.release()	
					}	
				})				
			}	
			})			
		})
	},


    kick: function (userId, userName) {
        if (userName !== undefined) {
            commands.lookupUserName(userName).then(function (idResult) {
                (idResult !== -1) ? (send_PRIVGRP_KICK(idResult), send_MESSAGE_PRIVATE(userId, 'Kicked ' + userName + ' from this channel')) : send_MESSAGE_PRIVATE(userId, 'Username not found')
            })
        } else {
            send_PRIVGRP_KICK(userId)
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
		var cmdList = []
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
		send_MESSAGE_PRIVATE(userId, '<a href="text://' + printCmdList + '">Command List</a>' )
	},


	towers: function(userId) { // parse tower.info
			console.log('To Be Added')	
	
	},
	addadmin : function(userId,args) {
		if (args !== undefined) {
			userName = capitalize(args[0].toLowerCase())
			commands.lookupUserName(userName).then(function (idResult) {
				if (idResult === -1) {
					send_MESSAGE_PRIVATE(userId, userName + ' not found')	
				} else {	
					connectdb().done(function (connection) {
						query(connection,'SELECT * FROM admins WHERE name =' + connection.escape(userName)).done(function(result) {
							if (result[0].length !== 0) { //first check if player is already an admin or mod
								if (result[0][0].level >= 4) {
									send_MESSAGE_PRIVATE(userId, userName + ' is already an admin')
									connection.release()
								} else {
									query(connection,'UPDATE admins SET level = 4 WHERE name = ' + connection.escape(userName)).done(function(result) {
										send_MESSAGE_PRIVATE(userId, 'Promoted ' + userName + ' to admin')
										connection.release()
									})	
								}	
							} else {
								query(connection,'INSERT INTO admins (charId, name,level,rank) VALUES (' + idResult + ',' + connection.escape(userName) + ',' + 4 + ',"admin")').done(function(result) {
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
	addmod : function(userId,args) {
		if (args !== undefined) {
			userName = capitalize(args[0].toLowerCase())
			commands.lookupUserName(userName).then(function (idResult) {
				if (idResult === -1) {
					send_MESSAGE_PRIVATE(userId, userName + ' not found')	
				} else {	
					userName = capitalize(userName[0].toLowerCase())
					connectdb().done(function (connection) {
						query(connection,'SELECT * FROM admins WHERE name = ?', [userName]).done(function(result) {
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
								query(connection,'INSERT INTO admins (charId, name,level,rank) VALUES (' + idResult + ',' + connection.escape(userName) + ',' + 3 + ',"moderator")').done(function(result) {
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
	deladmin: function(userId, args) {
		if (args !== undefined) {	
			var userName = capitalize(userName[0].toLowerCase())
			connectdb().done(function (connection) { 	
				query(connection,'SELECT * FROM admins WHERE name = ' + connection.escape(userName)).done(function(result) {
					if (result[0].length === 0) {
						send_MESSAGE_PRIVATE(userId, userName + ' is not an admin')
						connection.release()
					} else {
						var adminCharId = result[0][0].charid
						query(connection,'DELETE FROM admins WHERE name = ' + connection.escape(userName)).done(function(result) {
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
	addmember: function(userId,args) {
		if (args !== undefined) {
			userName = capitalize(args[0].toLowerCase())
			commands.lookupUserName(userName).then(function (idResult) {
				if (idResult === -1) {
				send_MESSAGE_PRIVATE(userId, userName + ' not found')	
				} else {
					var userName = capitalize(userName[0].toLowerCase())					
					connectdb().done(function(connection) {
						query(connection,'SELECT * FROM members WHERE name = ' + connection.escape(userName)).done(function (result) {
							if (result[0].length !== 0) {
									send_MESSAGE_PRIVATE(userId, userName + ' is already a member')
									connection.release()
							} else {	
								query(connection,'INSERT INTO members (charId, name, main) VALUES (' + idResult + ',"' + userName + '","' + userName +'")').then(function() {
									return query(connection, 'INSERT INTO points (main) VALUES ("' + userName + '")')
								}).done(function() {
									send_MESSAGE_PRIVATE(userId, userName + ' is now a member')
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
	delmember: function(userId, args) {//ADD : Main should not be deletable if it has alts, might break db
		if (args !== undefined) {	
			userName = capitalize(args[0].toLowerCase())
			connectdb().done(function(connection) {
				query(connection,'SELECT * FROM members WHERE name = ' + connection.escape(userName)).done(function(result) {
					if (result[0].length === 0) {
						send_MESSAGE_PRIVATE(userId, userName + ' is not a member of this bot')
						connection.release()
					}	else if (!args[1]) {	
						query(connection,'SELECT * FROM members WHERE main = ?',[userName]).then(function(result) {
							if (result[0].length > 1) {
								send_MESSAGE_PRIVATE(userId, userName + ' cannot be deleted as long as he still has alts registered!')
								connection.release()	
							} else {
								return query(connection,'DELETE FROM members WHERE name = ?', [userName]).done(function () {
									send_MESSAGE_PRIVATE(userId, userName + ' is no longer a member')
									connection.release()
								})								
							}	
						})
					} else if (args[1] == 'all')  {
						query(connection, 'DELETE members,points FROM members INNER JOIN points ON members.main = points.main WHERE members.name = ?', [userName]).done(function() {
							send_MESSAGE_PRIVATE(userId, userName + '\'s account has been deleted, alts included.')
						})					
					}		
				})
			})
		} else {
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
						query(connection,'INSERT INTO members (charId, name, main) VALUES (' + userId + ',"' + result[0][0].name + '","' + result[0][0].name +'")').then(function() {
							return query(connection, 'INSERT INTO points (main) VALUES ("' + result[0][0].name + '")')
						}).done(function() {
							send_MESSAGE_PRIVATE(userId, 'You are now a member')
							connection.release()
						})	
					})	
				}	
			})	
			
		})
	},
	unregister : function(userId) { //ADD : Main should not be deletable if it has alts, might break db
		connectdb().done(function(connection) {
			query(connection,'SELECT * FROM members WHERE charid = ' + userId).done(function(result) {
				if (result.length === 0) {
					send_MESSAGE_PRIVATE(userId, 'You are not a member of this bot')
					connection.release()
				}	else {
					// Check if char is set as main before deleting
					getUserName(connection,userId).done(function (result) {
						var userName = result[0][0].name
						query(connection,'SELECT * FROM members WHERE main = ?',[userName]).then(function(result) {
							if (result[0].length > 1) {
								send_MESSAGE_PRIVATE(userId, 'You must delete your alts first.')
								connection.release()	
							} else {
								return query(connection,'DELETE FROM members WHERE charid = ' + userId).done(function () {
									send_MESSAGE_PRIVATE(userId, 'You are no longer a member')
									connection.release()
								})								
							}	
						})
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
			if (!ORG) {
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
						
					send_MESSAGE_PRIVATE(userId, blob('Online', onlineReply) + '(' + result[0].length + ')'  )
				})		
			} else {
				query(connection, 'SELECT * FROM players INNER JOIN online ON players.name = online.name ORDER BY "name" ASC').done(function(result) {
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
						
					send_MESSAGE_PRIVATE(userId, blob('Online', onlineReply) + '(' + result[0].length + ')'  )
				})		

			}			
			connection.release()
		})
	},
	admins : function (userId) {
		connectdb().done(function(connection) {
			query(connection, 'SELECT * from admins ORDER BY "name" ASC').done(function(result) {
				var adminsResult = '<center><font color=#FFFF00>:: Admins ::</font></center><br>'
					query(connection, 'SELECT * from online').done(function(result2) {
						on = ''
						for (i = 0; i < result2[0].length; i++) {
							on += result2[0][i].name + ' '
						}	
						
						for (i = 0; i < result[0].length; i++) {
							if (on.indexOf(result[0][i].name.replace(/\'/gm,'')) >= 0 ) {
								adminsResult += '<font color=#00FF00>' + result[0][i].name + ' </font> \n' 
							} else {
								adminsResult += '<font color=#FF0000>' + result[0][i].name + ' </font> \n' 
							}	
								
						}	
						send_MESSAGE_PRIVATE(userId, blob('Admins',adminsResult.replace(/\'/gm,'')))
					})
				connection.release()
			})
			
		})
	},
	alts : function(userId,args) { // Add prof - (level/ai level) to alt list
		connectdb().done(function(connection) {
			getUserName(connection,userId).done(function(result) {
				var userName = result[0][0].name
				if (!args) {
					query(connection, 'SELECT * FROM members WHERE main = "' + userName + '" ORDER BY "name" ASC').done(function(result) {
						if (result[0].length > 1) {
							altList = '<center> <font color=#FFFF00> ::: Alts of ' + userName + '::: </font> </center> \n\n'
							for (i = 0; i < result[0].length; i++) {
								altList += result[0][i].name + '\n'	
							}	
							send_MESSAGE_PRIVATE(userId, blob('Alts of ' + userName + ' (' + result[0].length + ')', altList.replace(/\'|\`/gm, '')))
							connection.release()
						} else {
							send_MESSAGE_PRIVATE(userId, 'You have no alts registered.')
							connection.release()
						}
					})	
				}	else if (args[0] == 'add') {
					if (args[1] !== undefined) {
						commands.lookupUserName(args[1]).then(function (idResult) {
							if (idResult === -1) {
							send_MESSAGE_PRIVATE(userId,'Invalid character name')
							connection.release()
							} else {
								alt = capitalize(args[1].toLowerCase())
								if (userName === alt) {
									send_MESSAGE_PRIVATE(userId, 'You can\'t add yourself as an alt')	
									connection.release()
									return
								}
								query(connection,'SELECT * FROM members WHERE name = ?', [alt]).done(function(result) {
									if (result[0].length > 0) {
										if (alt !== result[0][0].main) {
											send_MESSAGE_PRIVATE(userId, alt + ' is already registered as an alt to ' + result[0][0].main)
											connection.release()
										} else {
											query(connection, 'UPDATE members SET main = "' + userName + '" WHERE name = ?', [alt]).then(function() {
												return query(connection, 'SELECT * FROM points WHERE main = ?',[alt]).then(function(result) {
													return query(connection, 'UPDATE points SET points = points +' + result[0][0].points + ' WHERE main = "' + userName + '"').then(function() {
														return query(connection, 'DELETE FROM points WHERE main = ?', [alt]).done(function() {
															send_MESSAGE_PRIVATE(userId, alt + ' was registered as an alt, hes points have been added to your account.')
															connection.release()
														})
													})
												})
											})	
										}	
									} else {
										send_MESSAGE_PRIVATE(userId, alt + ' is not a member.')
										connection.release()	
									}
																		
								})								
							}	
						})		
					} else {
						send_MESSAGE_PRIVATE(userId, 'Usage: !alts add name.')
						connection.release()
					}
				} else if (args[0] == 'del') {
					if (!args[1]) {
						send_MESSAGE_PRIVATE(userId, 'Usage: !alts del name.')
						connection.release()
						return	
					}	
					alt = capitalize(args[1].toLowerCase())
					query(connection,'SELECT * FROM members WHERE name = ? AND main = "' + userName + '"', [alt] ).done(function(result) {
						if (result[0].length > 0) {
							query(connection, 'UPDATE members SET main = ? WHERE name = "' + alt + '"', [alt]).then(function() {
								return query(connection, 'INSERT INTO points (main) VALUES (?)',[alt]).done(function() {
									send_MESSAGE_PRIVATE(userId, alt + ' is no longer registered as your alt.')	
									connection.release()
								})
							})
						} else {
							send_MESSAGE_PRIVATE(userId, alt + ' is not registered as your alt.')
							connection.release()
						}
					})
				}  else {
					var alt = capitalize(args[0].toLowerCase())
					query(connection, 'SELECT alts.* FROM members JOIN members AS alts ON members.main = alts.main WHERE members.name = ? ORDER BY name ASC', [alt]).done(function(result) {
						if (result[0].length > 1) {
							altList = '<center> <font color=#FFFF00> ::: Alts of ' + result[0][0].main + '::: </font> </center> \n\n'
							for (i = 0; i < result[0].length; i++) {
								altList += result[0][i].name + '\n'	
							}
							send_MESSAGE_PRIVATE(userId, blob('Alts of ' + result[0][0].main + ' (' + result[0].length + ')', altList.replace(/\'|\`/gm, '')))
							connection.release()
						} else {
							send_MESSAGE_PRIVATE(userId, alt + ' has no alts registered.')
							connection.release()
						}
					})
				}				
			})
		})
	},	
	shutdown : function	(userId) {
		if (ORG !== false) {
			send_GROUP_MESSAGE('Shutting Down')
		} else {
			send_PRIVGRP_MESSAGE(botId,'Shutting Down')
		}	
		die('Shutting down')
	},
	lock : function(userId) {
		connectdb().done(function(connection) {
			getUserName(connection,userId).done(function(result) {
				var userName = result[0][0].name
				query(connection,'SELECT * FROM cmdcfg WHERE module = "CORE" and cmd = "join"').then(function(result) {	
					if (result[0][0].access_req >= 3) {
						send_MESSAGE_PRIVATE(userId, 'Channel is already locked')
						connection.release()
					} else {	
						query(connection, 'UPDATE cmdcfg SET access_req = 3 WHERE module = "Core" and cmd = "join"').done(function() {
							send_MESSAGE_PRIVATE(userId, 'Channel is now locked')
							send_PRIVGRP_MESSAGE(botId, userName + ' locked the channel')
							connection.release()
						})
					}
				})
			})			
		})		
	},
	unlock : function(userId) {
		connectdb().done(function(connection) {
			getUserName(connection,userId).done(function(result) {
				var userName = result[0][0].name
				query(connection,'SELECT * FROM cmdcfg WHERE module = "CORE" and cmd = "join"').then(function(result) {	
					if (result[0][0].access_req === 0) {
						send_MESSAGE_PRIVATE(userId, 'Channel is already unlocked')
						connection.release()
					} else {	
						query(connection, 'UPDATE cmdcfg SET access_req = 0 WHERE module = "Core" and cmd = "join"').done(function() {
							send_MESSAGE_PRIVATE(userId, 'Channel is now unlocked')
							send_PRIVGRP_MESSAGE(botId, userName + ' unlocked the channel')
							connection.release()
						})
					}
				})
			})			
		})		
	}
}


module.exports = commands

//Globals

// CORE STUFF

global.connectdb = function()
{
	 return Q.ninvoke(pool, 'getConnection').fail(function (err, connection)
        {
        console.log(err)
        connection.release()
        })
}
 
	
global.getUserName = function(connection, userId) {
		return Q.ninvoke(connection, 'query','SELECT * FROM players WHERE `charid` = ' + userId  ).fail(function (err, connection)
        {
        console.log(err)
        connection.release()
        })
}	
global.getUserName2 = function(connection, userId) {
    var result = Q.defer()
    var handler = function ()
    {
        result.resolve(query(connection ,'SELECT * FROM players WHERE `charid` = ?', userId ))
    }
    onClientName.once(userId, handler)
    var timeout = setTimeout(function ()
    {
        result.reject("Couldn't get userId")
    }, 1000)
    return query(connection ,'SELECT * FROM players WHERE `charid` = ?', userId )
        .then(function (rows) {
            if (rows[0].length > 0)
            {
                onClientName.removeListener(userId, handler)
                clearTimeout(timeout)
                result.resolve(rows)
            }
            return result.promise
        })
}
global.getUserId = function(connection, userName) {
		return Q.ninvoke(connection, 'query','SELECT * FROM players WHERE name = "' + userName + '"' ).fail(function (err, connection)
        {
        console.log(err)
        connection.release()
        })
}	

global.query = function(connection) {
		return Q.npost(connection, 'query', Array.prototype.slice.call(arguments, 1)).fail(function (err, connection) {
			console.log(err)
			connection.release()
		})	
}	
   

	
global.die = function(msg) {
    if (msg) {
        console.log(msg)
    }
    process.exit()
}

global.checkAccess = function(userId) {
        var defer = Q.defer()
        connectdb().done(function (connection) {
				getUserName2(connection,userId).done(function(result) {
				var userName = result[0][0].name
					if (userName === Owner) {
						var access = 5
						defer.resolve(access)
						return access
					} else { 
						query(connection,'SELECT * FROM admins WHERE charid =' + userId ).done(function(result) {
							if (result[0].length > 0 ) {
								var access = result[0][0].level
								defer.resolve(access)
								return access
							} else {
								query(connection,'SELECT * FROM members WHERE charid =' + userId).done(function(result) {
									if (result[0].length > 0 ) {
										var access = 1 
										defer.resolve(access)
										return access
									} else {
										var access = 0
										defer.resolve(access)
										return access
									}                              
								})
							}      
						})
					}	
				})
				
		})
        return defer.promise   
}

// TOOLS

// Blobs

global.blob = function (name, content) {
  return '<a href=\'text://'  +  content.replace("'", "`") + '\'>' + name + '</a>'
	
}	

global.tellBlob = function (user, content, link) {
  return '<a href=\"chatcmd:///tell ' + user + ' ' + content.replace("'", "`") + '\">' + link + '</a>'
 }

global.itemref = function (lowid,highid,ql, name) {
	return  "<a href=\"itemref://" + lowid + "/" + highid + "/" + ql + "\">" + name.replace("'", "`") + "</a>"
} 	
