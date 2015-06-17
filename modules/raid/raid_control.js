var assert = require('assert')
var events = require('events')
var Q = require('q')
var util = require('util')
var express = require('express')
var mysql = require('mysql')
var main = require('../../main')
var _ = require('underscore')
var capitalize = require('underscore.string/capitalize')

raidLoot = []
exports.raid = raid  = function(userId, args) {
	connectdb().done(function(connection) {
		getUserName(connection,userId).done(function(result) {
			userName = result[0][0].name
			checkAccess(userId).done(function(result) {
			var userAc = result
				query(connection, 'SELECT * from raidinfo').done(function(result) {
					if (result[0].length !== 0) {
					var	raidStatus = result[0][0].status
					if (result[0][0].description.length > 1) { 
						var raidDesc = result[0][0].description
					} else {
						var raidDesc = 'Not Set'
					}
					var	locked = result[0][0].locked
					} else {
						raidStatus = 'no raid'	
						locked = 'no'
					}
					if (!args) { // Change to blob, add more info
						if (raidStatus === 'running') {
							send_MESSAGE_PRIVATE(userId, 'Raid is Running, Locked: ' + locked + ', Description:' + raidDesc)	
						} else if (	raidStatus === 'paused') {
							send_MESSAGE_PRIVATE(userId, 'Raid is Paused, Locked: ' + locked + ', Description:' + raidDesc)
						} else {
							send_MESSAGE_PRIVATE(userId, 'There is no raid Running')
						}
						connection.release()
						return	
					}	
					access_req(connection, args[0]).done(function(result) {
						if (result[0].length === 0 || result[0].length > 0 && result[0][0].status === 'enabled' ) {
							if (result[0].length === 0 || result[0][0].access_req <= userAc) {
								switch(args[0]) {
									case 'start':
										raidDescription = args.join(' ').replace('start', '')
										if (raidStatus === 'running' || raidStatus === 'paused') {
											send_PRIVGRP_MESSAGE(botId, 'Raid already running')
										} else {
											query(connection,'INSERT INTO raidinfo (status,description,leader,start) VALUES ("running", ' + connection.escape(raidDescription) + ',"' + userName + '",(UNIX_TIMESTAMP(NOW())))').done(function() {
												send_PRIVGRP_MESSAGE(botId,	userName + ' started the raid ' + raidDescription) // add colors and clickable raid join link
										})	
										}	
									break;
									case 'pause':
										if (raidStatus === 'running') {
											query(connection, 'UPDATE raidinfo SET status = "paused"').done(function() {
											send_PRIVGRP_MESSAGE(botId, userName + ' paused the raid')
										})
										} else if (raidStatus === 'paused') {
											send_PRIVGRP_MESSAGE(botId, 'Raid is already paused')
										} else {
											send_PRIVGRP_MESSAGE(botId, 'There is no raid running')
										}
									break;
									case 'resume':
										if (raidStatus === 'paused') {
											query(connection, 'UPDATE raidinfo SET status = "running"').done(function() {
												send_PRIVGRP_MESSAGE(botId, userName + ' resumed the raid')
											})	
										} else  if (raidStatus === 'running') {
											send_PRIVGRP_MESSAGE(botId,'The raid is not paused')
										} else {
											send_PRIVGRP_MESSAGE(botId,'There is no raid running')		
										}
									break;	
									case 'stop':
										if (raidStatus === 'running' || raidStatus === 'paused') {
											query(connection, 'UPDATE raidinfo SET status = "stopped", stop = (UNIX_TIMESTAMP(NOW()))').done(function() {
												query(connection,'INSERT INTO raidhistory SELECT * FROM raidinfo').done(function() {
													query(connection,'DELETE FROM raidinfo').done(function() {
														query(connection,'DELETE FROM raidforce')
														send_PRIVGRP_MESSAGE(botId,	userName + ' stopped the raid')	
													})	
												})	
											})	
										
										}
									break;
									case 'lock' :
										if (raidStatus === 'running' || raidStatus === 'paused') {
											if (locked === 'no') {
												query(connection, 'UPDATE raidinfo SET locked = "yes"').done(function() {
													send_PRIVGRP_MESSAGE(botId, userName + ' locked the raid')
												})
											} else if (locked === 'yes') {
												send_MESSAGE_PRIVATE(userId, 'Raid is already locked')
											}							
										}
									break;
									case 'unlock' :
										if (raidStatus === 'running' || raidStatus === 'paused') {
											if (locked === 'yes') {
												query(connection, 'UPDATE raidinfo SET locked = "no"').done(function() {
													send_PRIVGRP_MESSAGE(botId, userName + ' unlocked the raid')
												})
											} else if (locked === 'no') {
												send_MESSAGE_PRIVATE(userId, 'Raid is already unlocked')
											}							
										}
									break;	
									case 'join':
										query(connection,'SELECT * FROM channel WHERE name = "' + userName + '"').done(function(result) {
											if(result[0].length !== 0) {
												if (raidStatus === 'running' || raidStatus === 'paused') {
														query(connection,'SELECT * FROM raidforce WHERE name = "' + userName + '"').done(function(result) {
															if (result[0].length !== 0) {
																send_MESSAGE_PRIVATE(userId, 'You are already in raid')	
															} else {
																if (locked === 'yes') {
																	send_MESSAGE_PRIVATE(userId, 'Raid is locked')
																	return
																}
																query(connection,'INSERT INTO raidforce (name,points) VALUES ("' + userName + '", 0)').done(function() {
																	send_MESSAGE_PRIVATE(userId, 'You\'ve joined the raid')
																	send_PRIVGRP_MESSAGE(botId,	userName + ' joined the raid')
																})										
															}	
														})
												}	else {
													send_MESSAGE_PRIVATE(userId, 'There is no raid running')
												}
											} else {
												send_MESSAGE_PRIVATE(userId, 'You have to join the channel first')	
											}
										})								
									break;
									case 'leave':
									if (raidStatus === 'running' || raidStatus === 'paused') {
											
												query(connection,'SELECT * FROM raidforce WHERE name = "' + userName + '"').done(function(result) {
													if (result[0].length !== 0) {
														query(connection,'DELETE FROM raidforce WHERE name = "' + userName + '"').done(function(result) {
															send_MESSAGE_PRIVATE(userId, 'You\'ve left the raid')	
															send_PRIVGRP_MESSAGE(botId,	userName + ' left the raid')
														})	
													} else {
														send_MESSAGE_PRIVATE(userId, 'You are not in raid')
														
													}
													
												})
											
										}	else {
											send_MESSAGE_PRIVATE(userId, 'There is no raid running')
											
										}
									break;
									case 'kick':
									if (raidStatus === 'running' || raidStatus === 'paused') {
										
											query(connection,'SELECT * FROM raidforce WHERE name = "' + args[1] + '"').done(function(result) {
												if (result[0].length !== 0) {
													getUserId(connection,args[1]).done(function(result) {
														query(connection,'DELETE FROM raidforce WHERE name = ' + connection.escape(result[0][0].name)).done(function() {
															send_PRIVGRP_MESSAGE(botId,	userName + ' was kicked from the raid')
															query(connection,'SELECT * FROM players WHERE name = ' + connection.escape(result[0][0].name)).done(function(result) {
																send_MESSAGE_PRIVATE(result[0][0].charid, 'You\'ve been kicked from the raid by ' + userName )	
															})	
														})
													})	
												} else {
													send_MESSAGE_PRIVATE(userId, args[1] + ' is not in raid')	
												}
											})
											
									} else {
										send_MESSAGE_PRIVATE(userId, 'There is no raid running')	
									}					
									break;
									case 'add': // Add check to see if user is on channel
									if (raidStatus === 'running' || raidStatus === 'paused') {
										
												query(connection,'SELECT * FROM raidforce WHERE name = ' + connection.escape(args[1])).done(function(result) {
													if (result[0].length !== 0) {
														send_MESSAGE_PRIVATE(userId,  args[1] + 'is already in raid')	
													} else {
														query(connection,'INSERT INTO raidforce (name,points) VALUES ("' + connection.escape(args[1]) + '", 0)').done(function() {
															send_PRIVGRP_MESSAGE(botId,	args[1] + ' was added to the raid by ' + userName)
														})										
													}	
												})
											
									} else {
										send_MESSAGE_PRIVATE(userId, 'There is no raid running')	
									}
									break;
									case 'reward':
									if (raidStatus === 'running' || raidStatus === 'paused') {
										if (isNaN(args[1])){ 
											send_MESSAGE_PRIVATE(userId, 'Invalid command. Usage: raid reward <number of points>')
											
											return; 
										} 
										query(connection,'UPDATE points JOIN members ON members.main = points.main JOIN raidforce ON raidforce.name = members.name SET points.points = points.points + ?, raidforce.points = raidforce.points +  ' + args[1], args[1]).then(function() {
											return query(connection, 'SELECT members.charid, points.points FROM members JOIN raidforce ON raidforce.name = members.name JOIN points ON points.main = members.main')
										}).done(function (result) {
											result[0].forEach(function (row) {
												send_MESSAGE_PRIVATE(row.charid,'You now have ' + row.points + ' points' ) 
										   })
										})   
									} else {
										send_MESSAGE_PRIVATE(userId, 'There is no raid running')	
									}
									break;
									case 'deduct':
									if (raidStatus === 'running' || raidStatus === 'paused') {
										if (isNaN(args[1])){ 
											send_MESSAGE_PRIVATE(userId, 'Invalid command. Usage: raid deduct <number of points>')
											
											return; 
										} 
										query(connection,'UPDATE points JOIN members ON members.main = points.main JOIN raidforce ON raidforce.name = members.name SET points.points = points.points - ?, raidforce.points = raidforce.points - ' + args[1], args[1]).then(function() {
											return query(connection, 'SELECT members.charid, points.points FROM members JOIN raidforce ON raidforce.name = members.name JOIN points ON points.main = members.main')
										}).done(function (result) {
											result[0].forEach(function (row) {
												send_MESSAGE_PRIVATE(row.charid,'You now have ' + row.points + ' points' ) 
										   })
										})   
									
										} else {
											send_MESSAGE_PRIVATE(userId, 'There is no raid running')	
										}
									break;
									case 'bid' :
										if (raidStatus === 'running') {
											if (!bidInProgress) { 
												bidForItem = args.slice(1).join(' ')
												send_PRIVGRP_MESSAGE(botId,	'Starting auction for ' + bidForItem + ' 1 minute left')
												bidTimer(60)
											}	else {
												send_MESSAGE_PRIVATE(userId, 'There is already in auction in progess!')	
											}	
											
										} else {
											send_MESSAGE_PRIVATE(userId, 'There is no raid running')	
										}
									break;
									case 'cancelbid' :
										cancelBid()
									break;	
									case 'loot' :
										query(connection,'SELECT * FROM channel WHERE name = "' + userName + '"').done(function(result) {
											if (result[0].length !== 0) {	
												if (args[1] === 'clear') {
													raidLoot = []
													send_PRIVGRP_MESSAGE(botId,	userName + ' cleared the loot list')
												} else {
													raidLoot.push(args.slice(1).join(' '))
													send_PRIVGRP_MESSAGE(botId,	userName + ' added '  + args.slice(1).join(' ') + ' to slot #' + raidLoot.length + '. Use !add ' + raidLoot.length + ' to join ' )
													lootSlot[raidLoot.length] = []
												}

												
											} else { 
												send_MESSAGE_PRIVATE(userId, 'You have to join the channel first')
											}		
										})
										
									break;	
									default:
										send_MESSAGE_PRIVATE(userId, 'Command not found')
										
								}
						
							} else {	
								
								send_MESSAGE_PRIVATE(userId, 'Access denied');
							}
						} else { 
							connection.release()
							send_MESSAGE_PRIVATE(userId, 'Command Disabled')
						}	
					})	
				})
			})
		})
	connection.release()
	})
}	
exports.flatroll = flatroll = function(userId,args) {
	if (raidLoot.length === 0 ) {
		send_MESSAGE_PRIVATE(userId, 'There is no loot')
		return	
	}
	connectdb().done(function(connection) {
		checkAccess(userId).done(function(result) {
			userAc = result		
			access_req(connection, 'flatroll').done(function(result) {
				if (result[0].length === 0 || result[0].length > 0 && result[0][0].status === 'enabled' ) {
					if (result[0].length === 0 || result[0][0].access_req <= userAc) {
						getUserName(connection,userId).done(function(result){
							userName = result[0][0].name
							//if(!args) {
								winnerList = '<center> <font color=#FFFF00> :::Flatroll Results::: </font> </center> \n'
								var rl = raidLoot
								for (i = 0; i < rl.length; i++) {
									winnerList += '<font color=#00FFFF>Slot #' + (i+1)  + '</font> \n' 
									winnerList += 'Item: ' + raidLoot[i] + '\n'
									if (lootSlot[i+1].length === 0) {
										winnerList += 'Winner: No one added \n' 
									} else {
										shuffleUsers = _.shuffle(lootSlot[i+1])
										console.log(shuffleUsers)
										winnerList += 'Winner:</font><font color=#00FF00>' + _.sample(shuffleUsers) + '</font> \n'
									}									
									
									winnerList += '<img src=tdb://id:GFX_GUI_FRIENDLIST_SPLITTER>\n'
									
								}	
								send_PRIVGRP_MESSAGE(botId,	blob('Winner List', winnerList))
								
								for (i = 0; i < rl.length; i++) {
									if (lootSlot[i+1].length > 0) {
										lootSlot[i+1] = []
										raidLoot = _.without(raidLoot, rl[i])
									}									
								}	
								connection.release()
						//	} // else with args	
						})
					}else {
						connection.release()
						send_MESSAGE_PRIVATE(userId, 'Access Denied')
					}
				} else { 
					connection.release()
					send_MESSAGE_PRIVATE(userId, 'Command Disabled')
				}	
			})
		})
	})			
}	

exports.rem = rem = function(userId,args) {
	if (!args) {
		if (raidLoot.length === 0 ) {
			send_MESSAGE_PRIVATE(userId, 'There is no loot')
			connection.release()
			return	
		} else {
			connectdb().done(function(connection) {
				getUserName(connection,userId).done(function(result) {
				userName = result[0][0].name	
					for (i in lootSlot) {
						if (lootSlot[i].indexOf(userName) >= 0) {
							lootSlot[i].splice(lootSlot[i].indexOf(userName),1)
							send_PRIVGRP_MESSAGE(botId, userName + ' removed from all rolls')
							return
						}								
					}
				})
			})			
		}		
	} else {
		connectdb().done(function(connection) {
			checkAccess(userId).done(function(result) {
				userAc = result		
				access_req(connection, 'rem').done(function(result) {
					if (result[0].length === 0 || result[0].length > 0 && result[0][0].status === 'enabled' ) {
						if (result[0].length === 0 || result[0][0].access_req <= userAc) {
							getUserName(connection,userId).done(function(result){
								userName = result[0][0].name
								removeUser = capitalize(args[0].toLowerCase()) 
								console.log(removeUser)
								for (i in lootSlot) {
									if (lootSlot[i].indexOf(removeUser) >= 0) {
										lootSlot[i].splice(lootSlot[i].indexOf(removeUser),1)
										send_PRIVGRP_MESSAGE(botId, userName +  ' removed ' + removeUser + ' from all rolls')
										connection.release()
										return
									}	
								}
									send_MESSAGE_PRIVATE(userId, removeUser + ' was not found in any rolls.')
									connection.release()
							})	
						} else {
							connection.release()
							send_MESSAGE_PRIVATE(userId, 'Access Denied')
						}
					} else { 
							connection.release()
							send_MESSAGE_PRIVATE(userId, 'Command Disabled')
						}	
				})
			})					
		})
	}	


}	

exports.add = add = function(userId, args) {
	connectdb().done(function(connection) {
		checkAccess(userId).done(function(result) {
			userAc = result		
			access_req(connection, 'add').done(function(result) {
				if (result[0].length === 0 || result[0].length > 0 && result[0][0].status === 'enabled' ) {
					if (result[0].length === 0 || result[0][0].access_req <= userAc) {
						getUserName(connection,userId).done(function(result) {
							userName = result[0][0].name	
							query(connection, 'SELECT * FROM channel WHERE name = "' + userName + '"').done(function(result) {
								if (result[0].length !== 0) {
									if (raidLoot.length === 0 ) {
										send_MESSAGE_PRIVATE(userId, 'There is no loot')
										connection.release()
										return	
									} else if (raidLoot[+args[0] - 1]) {
										if (lootSlot[args[0]].indexOf(userName) >= 0) {
											send_MESSAGE_PRIVATE(userId, 'Already joined the roll for this item')
										} else {						
											for (i in lootSlot) {
												if (lootSlot[i].indexOf(userName) >= 0) {
													lootSlot[i].splice(lootSlot[i].indexOf(userName),1)
													lootSlot[args[0]].push(userName)
													send_PRIVGRP_MESSAGE(botId, userName + ' moved to ' + raidLoot[i])
													connection.release()
													return
												}								
											}	
											lootSlot[args[0]].push(userName)
											send_PRIVGRP_MESSAGE(botId, userName + ' joined roll for ' + raidLoot[+args[0] - 1])
											connection.release()

										}						
									} else {
										send_MESSAGE_PRIVATE(userId, 'The slot you are trying to add in does not exist.')
										connection.release()	
									}	
								} else {
									send_MESSAGE_PRIVATE(userId, 'You have to join channel first')
									connection.release()
								}		
							})
						})
					} else {
						connection.release()
						send_MESSAGE_PRIVATE(userId, 'Access Denied')
					}
				} else { 
					connection.release()
					send_MESSAGE_PRIVATE(userId, 'Command Disabled')
				}	
			})
		})	
	})	
}	

lootSlot = []
exports.list = list =function(userId) {
	connectdb().done(function(connection) {
		getUserName(connection,userId).done(function(result) {
			userName = result[0][0].name	
			query(connection, 'SELECT * FROM channel WHERE name = "' + userName + '"').done(function(result) {
				if (result[0].length !== 0) {
					if (raidLoot.length === 0 ) {
						send_MESSAGE_PRIVATE(userId, 'There is no loot')
						connection.release()
						return	
					}
					lootList = '<center> <font color=#FFFF00> :::Loot List::: </font> </center> \n'
					for (loot in raidLoot) {
						lootList += '<font color=#00FFFF>Slot #' + (+loot+1)  + '</font> \n' 
						lootList += 'Item: ' + raidLoot[loot] + '\n'
						lootList += 'Total: ' + lootSlot[+loot+1].length + ' ' + tellBlob(Botname, 'add ' + (+loot+1) , 'Add') + '/' + tellBlob(Botname, 'rem', 'Rem') + '\n'
						lootList += 'Players added:</font><font color=#00FFFF>' + _.uniq(lootSlot[+loot+1]) + '</font> \n'
						lootList += '<img src=tdb://id:GFX_GUI_FRIENDLIST_SPLITTER>\n'
						
					}	
					send_PRIVGRP_MESSAGE(botId,	blob('Loot List', lootList))
					connection.release()
				} else {
					send_MESSAGE_PRIVATE(userId, 'You have to join channel first')
					connection.release()
				}	
			})
		})	
	})
}

maxBid = false
exports.bid = bid = function(userId, args) {
	connectdb().done(function(connection) {
		query(connection, 'SELECT * from raidinfo').done(function(result) {
					if (result[0].length !== 0) {
					var	raidStatus = result[0][0].status
					var	locked = result[0][0].locked
					} else {
						raidStatus = 'no raid'	
						locked = 'no'
					}
			if (raidStatus === 'running') {
				getUserName(connection,userId).done(function(result) {
					userName = result[0][0].name
					query(connection,'SELECT * FROM raidforce WHERE name = "' + userName + '"').done(function(result) {
						if (result[0].length !== 0) {
							if (bidInProgress) {
								if (isNaN(args[0]) || args[0] <= 0) {
												send_MESSAGE_PRIVATE(userId, 'That\'s not a valid bid')
												connection.release()
												return									
								}	
								query(connection,'SELECT points FROM points JOIN members ON points.main = members.main WHERE members.name = ?', userName).done(function(result) {
									if (result[0][0].points >= args[0] ) {
											currentBid = Number(args[0])
											if (!maxBid) {
												maxBid	= {name : userName, bidAmount : currentBid}
												leadingBid = 1 			
												send_PRIVGRP_MESSAGE(botId, maxBid.name + ' leading with ' + leadingBid + ' points')		
											} else if (args[0] > leadingBid) {
												if (!userName === maxBid.name) { 
													if (bidTimeLeft <= 10) { bidCancelAndRearm(10) }
													if (currentBid === maxBid.bidAmount) {
														leadingBid = maxBid.bidAmount										
													} else if (currentBid > maxBid.bidAmount) {
														leadingBid = maxBid.bidAmount + 1
														maxBid.name = userName
														maxBid.bidAmount = currentBid										
													} else if (currentBid < maxBid.bidAmount) {
														leadingBid = currentBid + 1
													} else {
														console.log('BID ERROR') // Should never get here
													}	
													
												send_PRIVGRP_MESSAGE(botId, maxBid.name + ' leading with ' + leadingBid + ' points') 									
												} else {
													if (currentBid > maxBid.bidAmount) {
														maxBid.bidAmount = currentBid
														send_MESSAGE_PRIVATE(userId, 'You\'ve increased your bid to ' + maxBid.bidAmount + ' points.') 	
													} else if (currentBid < maxBid.bidAmount && currentBid > leadingBid) {
														maxBid.bidAmount = currentBid
														send_MESSAGE_PRIVATE(userId, 'You\'ve decreased your bid to ' + maxBid.bidAmount + ' points.')
													} else {
														send_MESSAGE_PRIVATE(userId, 'You can\'t lower your bid less than the current Leading Bid') // Should never get here
													}													
												}	
											}
											connection.release()
									} else {
										send_MESSAGE_PRIVATE(userId,'Not enough points')
										connection.release()										
									}	
								})
							} else {
								send_MESSAGE_PRIVATE(userId, 'There is nothing to bid on')
								connection.release()
							}
						} else {
							send_MESSAGE_PRIVATE(userId, 'You are not in raid')
							connection.release()
						}	
					})
					
				})	

			} else {
				send_MESSAGE_PRIVATE(userId, 'There is no raid running')
				connection.release()
			}		
		})			
	})
}	

exports.points = points = function (userId, args) {
	connectdb().done(function(connection) {	
		getUserName(connection,userId).done(function(result) {
			userName = result[0][0].name
			if (!args) {
				query(connection,'SELECT points FROM points JOIN members ON points.main = members.main WHERE members.name = ?', [userName]).done(function(result) {
					if (result[0].length !== 0) {
						send_MESSAGE_PRIVATE(userId, 'You have ' + result[0][0].points + ' points.')
						connection.release()
					} else {
						send_MESSAGE_PRIVATE(userId,'You are not a member')
						connection.release()
					}
				})
			} else {
				if (args[0] === 'add' || args[0] === 'rem') {
					if (!args[1] && args[2]) {
						send_MESSAGE_PRIVATE(userId, 'Usage: points add/rem <point amount> user')
						connection.release()
						return
					} else if (isNaN(args[1]) || args[1] <= 0) {
						send_MESSAGE_PRIVATE(userId, args[1] + ' is not a valid point amount')
						connection.release()
						return
					} else if (!isNaN(args[2])) {
						send_MESSAGE_PRIVATE(userId, args[1] + ' is not a valid user')
						connection.release()
						return
					}				
					checkAccess(userId).done(function(result) {
						userAc = result		
						access_req(connection, 'points').done(function(result) {
							if (result[0].length === 0 || result[0].length > 0 && result[0][0].status === 'enabled' ) {
								if (result[0].length === 0 || result[0][0].access_req <= userAc) {
									getUserId(connection, args[2]).done(function(result) {
										if (result[0].length !== 0) {
											if (args[0] === 'add') { 
												query(connection, 'UPDATE points JOIN members ON members.main = points.main SET points = points + ' + connection.escape(args[1]) + ' WHERE members.name = ' + connection.escape(args[2])).done(function() { //Add Log this
													send_MESSAGE_PRIVATE(userId, 'Added ' + args[1] + ' points to ' + args[2] + '\`s account')
													connection.release()	
												})	
											} else {
												query(connection, 'UPDATE points JOIN members ON members.main = points.main SET points = points - ' + connection.escape(args[1]) + ' WHERE members.name = ' + connection.escape(args[2])).done(function() { // ADD Check that points wont go negative
													send_MESSAGE_PRIVATE(userId, 'Deducted ' + args[1] + ' points from ' + args[2] + '\`s account')
													connection.release()
												})	
											}	
										} else {
											send_MESSAGE_PRIVATE(userId, 'User ' + args[2] + ' not found')
											connection.release()
										}									
									})								
								} else {	
									connection.release()
									send_MESSAGE_PRIVATE(userId, 'Access denied');
								}
							} else { 
								connection.release()
								send_MESSAGE_PRIVATE(userId, 'Command Disabled')
							}	
						})			
					})	
				} else {
					checkAccess(userId).done(function(result) {
						userAc = result		
						access_req(connection, 'points').done(function(result) {
							if (result[0].length === 0 || result[0].length > 0 && result[0][0].status === 'enabled' ) {
								if (result[0].length === 0 || result[0][0].access_req <= userAc) {
									query(connection, 'SELECT points FROM points JOIN members ON points.main = members.main WHERE members.name = ?', [args[0]]).done(function(result) {
										if (result[0].length !== 0) {
											send_MESSAGE_PRIVATE(userId, args[0] + ' has ' + result[0][0].points + ' points');
										} else {
											send_MESSAGE_PRIVATE(userId, 'User ' + args[0] + ' not found')
											connection.release()
										}									
									})								
								} else {	
									connection.release()
									send_MESSAGE_PRIVATE(userId, 'Access denied');
								}
							} else { 
								connection.release()
								send_MESSAGE_PRIVATE(userId, 'Command Disabled')
							}	
						})			
					})	
				}		
			}
	})
	})
}


function access_req(connection, cmdName) {
	return Q.ninvoke(connection, 'query','SELECT * FROM cmdcfg WHERE module = "Raid" AND cmd = "' + cmdName + '"').fail(function (err, connection)
	{
	console.log(err)
	connection.release()
	})
}	
var bidInProgress;
var bidEndTime;
var bidTimeLeft;
var bidTimeOut;
var bidInterval;

function bidTimer(time) {
	send_PRIVGRP_MESSAGE(botId, time + ' seconds left')
	bidInProgress = true
	bidEndTime = Date.now() + (time * 1000)
		
bidTimeOut = setTimeout(function(){ 
	if (maxBid) {
	connectdb().done(function(connection) {
		query(connection, 'UPDATE points JOIN members ON members.main = points.main SET points = points - ' + leadingBid + ' WHERE name = "' + maxBid.name + '"').done(function() {
			send_PRIVGRP_MESSAGE(botId, maxBid.name + ' won the bid for ' + bidForItem + ', ' + leadingBid + ' points have been deducted from his account.')
			maxBid = false
			connection.release()	
		})
	})
	} else {
		send_PRIVGRP_MESSAGE(botId, 'No bids for ' + bidForItem + ' ,FFA.') 	
	}	
	bidInProgress = false
	clearTimeout(bidTimeOut)
	clearInterval(bidInterval)
	}, time*1000)
bidInterval = setInterval(function(){ 
	bidTimeLeft = (bidEndTime - Date.now()) / 1000
	send_PRIVGRP_MESSAGE(botId,Math.round(bidTimeLeft) + ' seconds left') 
	}, 10000);
}	

function cancelBid() {
	if (bidInProgress !== undefined) {
		send_PRIVGRP_MESSAGE(botId, 'Auction canceled')
		bidInProgress = false
		maxBid = false
		clearTimeout(bidTimeOut)
		clearInterval(bidInterval)
		
	} else {
		send_PRIVGRP_MESSAGE(botId, 'There is no bid in progress')
	}	
}	

function bidCancelAndRearm(newTimer) {
		bidInProgress = false
		clearTimeout(bidTimeOut)
		clearInterval(bidInterval)
		bidTimer(newTimer)
	
}	