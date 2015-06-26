
exports.boss12m = boss12m = function(userId) {
	bossloot(userId, '12m')	
}	

exports.s7= s7 = function(userId) {
	bossloot(userId, 's7')	
}	

exports.s13 = s13 = function(userId) {
	bossloot(userId, 's13')	
}	

exports.s42  = s42 = function(userId) {
	bossloot(userId, 's42')	
}	

// ETC ...
	
function bossloot(userId, boss) {
	connectdb().done(function (connection) {
		if (boss == '12m') { // Special case for 12m because of the long loot list
			query(connection,'SELECT * FROM bossloot WHERE boss = "' + boss + '" AND type = "general"').done(function(result) {
					if (result[0].length !== 0) {
					var loottable = '<center> <font color=#FFFF00> ::: 12 Man General Loot ::: </font> </center> \n\n'
					for (i = 0; arrlen = result[0].length, i < arrlen; i++) {
						loottable += '<a href = itemref://' + result[0][i].lowid + '/' + result[0][i].highid + '/' + result[0][i].highql + '><img src=rdb://' + result[0][i].icon + '></a> \n'
						loottable += 'Item : ' + result[0][i].name + '\n'
						loottable += tellBlob(Botname, 'raid loot <a href=itemref://' + result[0][i].lowid + '/' +result[0][i]. highid + '/' + result[0][i].highql + '>' + result[0][i].name + '</a>', 'Add to loot list') + '\n'
					}	
					send_MESSAGE_PRIVATE(userId, blob('General Loot', loottable))	
				} else {
					send_MESSAGE_PRIVATE(userId, 'Loot table not found.') 
				}
			})
			query(connection,'SELECT * FROM bossloot WHERE boss = "' + boss + '" AND type = "symbiant"').done(function(result) {
					if (result[0].length !== 0) {
					var loottable = '<center> <font color=#FFFF00> ::: 12 Man Symbiants ::: </font> </center> \n\n'
					for (i = 0; arrlen = result[0].length, i < arrlen; i++) {
						loottable += '<a href = itemref://' + result[0][i].lowid + '/' + result[0][i].highid + '/' + result[0][i].highql + '><img src=rdb://' + result[0][i].icon + '></a> \n'
						loottable += 'Item : ' + result[0][i].name + '\n'
						loottable += tellBlob(Botname, 'raid loot <a href=itemref://' + result[0][i].lowid + '/' +result[0][i]. highid + '/' + result[0][i].highql + '>' + result[0][i].name + '</a>', 'Add to loot list') + '\n'
					}	
					send_MESSAGE_PRIVATE(userId, blob('Symbiants', loottable))	
				} else {
					send_MESSAGE_PRIVATE(userId, 'Loot table not found.')
				}
			})
			query(connection,'SELECT * FROM bossloot WHERE boss = "' + boss + '" AND type = "spirit"').done(function(result) {
					if (result[0].length !== 0) {
					var loottable = '<center> <font color=#FFFF00> ::: 12 Man Spirits ::: </font> </center> \n\n'
					for (i = 0; arrlen = result[0].length, i < arrlen; i++) {
						loottable += '<a href = itemref://' + result[0][i].lowid + '/' + result[0][i].highid + '/' + result[0][i].highql + '><img src=rdb://' + result[0][i].icon + '></a> \n'
						loottable += 'Item : ' + result[0][i].name + '\n'
						loottable += tellBlob(Botname, 'raid loot <a href=itemref://' + result[0][i].lowid + '/' +result[0][i]. highid + '/' + result[0][i].highql + '>' + result[0][i].name + '</a>', 'Add to loot list') + '\n'
					}	
					send_MESSAGE_PRIVATE(userId, blob('Spirits', loottable))	
				} else {
					send_MESSAGE_PRIVATE(userId, 'Loot table not found.') 
				}
			})
			query(connection,'SELECT * FROM bossloot WHERE boss = "' + boss + '" AND type = "gem"').done(function(result) {
					if (result[0].length !== 0) {
					var loottable = '<center> <font color=#FFFF00> ::: 12 Man Profession Gems ::: </font> </center> \n\n'
					for (i = 0; arrlen = result[0].length, i < arrlen; i++) {
						loottable += '<a href = itemref://' + result[0][i].lowid + '/' + result[0][i].highid + '/' + result[0][i].highql + '><img src=rdb://' + result[0][i].icon + '></a> \n'
						loottable += 'Item : ' + result[0][i].name + '\n'
						loottable += tellBlob(Botname, 'raid loot <a href=itemref://' + result[0][i].lowid + '/' +result[0][i]. highid + '/' + result[0][i].highql + '>' + result[0][i].name + '</a>', 'Add to loot list') + '\n'
					}	
					send_MESSAGE_PRIVATE(userId, blob('Proffesion Gems', loottable))	
				} else {
					send_MESSAGE_PRIVATE(userId, 'Loot table not found.')
				}
			})
			connection.release()
		} else {
			query(connection,'SELECT * FROM bossloot WHERE boss = "' + boss + '" ').done(function(result) {
					if (result[0].length !== 0) {
					var loottable = '<center> <font color=#FFFF00> :::' +  boss + 'General Loot ::: </font> </center> \n\n'
					for (i = 0; arrlen = result[0].length, i < arrlen; i++) {
						loottable += '<a href = itemref://' + result[0][i].lowid + '/' + result[0][i].highid + '/' + result[0][i].highql + '><img src=rdb://' + result[0][i].icon + '></a> \n'
						loottable += 'Item : ' + result[0][i].name + '\n'
						loottable += tellBlob(Botname, 'raid loot <a href=itemref://' + result[0][i].lowid + '/' +result[0][i]. highid + '/' + result[0][i].highql + '>' + result[0][i].name + '</a>', 'Add to loot list') + '\n'
					}	
					send_MESSAGE_PRIVATE(userId, blob('Loot List', loottable.replace(/'/, "`")))	
				} else {
					send_MESSAGE_PRIVATE(userId, 'Loot table not found.') 
				}
				connection.release()
			})	
		}	

		
	})
}	



