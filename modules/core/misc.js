var capitalize = require('underscore.string/capitalize')
var moment = require('moment')

exports.about = about = function (userId) {
	send_MESSAGE_PRIVATE(userId, blob('About NephBot', aboutReply))	
}

var aboutReply = '<center> <font color=#FFFF00> :::Nephbot AO Chat Bot::: </font> </center> \n\n'
aboutReply += '<font color=#00FFFF>Version:</font> Beta \n'
aboutReply += '<font color=#00FFFF>By:</font> Nepherius \n'
aboutReply += '<font color=#00FFFF>In:</font> Node.js \n\n'
aboutReply += '<font color=#00FFFF>Special Thanks:</font> To all the people that worked on the original AO Chat Bots, Nephbot would not be possible without them.    \n'

exports.lastseen = lastseen = function (userId, args) {
	if (!args) {
		send_MESSAGE_PRIVATE(userId, 'You must specify a playername')
		return	
	}	
	userName = capitalize(args[0].toLowerCase())
	connectdb().done(function(connection) {
		query(connection,'SELECT online.* FROM online JOIN members ON online.name = members.main WHERE members.name = ?', userName).done(function(result) {
			if (result[0].length !== 0) {
				send_MESSAGE_PRIVATE(userId, userName + ' is online as ' + result[0][0].name)
			} else {		
				query(connection, 'SELECT alts.* FROM members JOIN members AS alts ON members.main = alts.main WHERE members.name = ? ORDER BY lastseen DESC', userName).done(function(result) {
					send_MESSAGE_PRIVATE(userId, userName + ' was last seen on ' + result[0][0].name + ' at ' + moment(moment.unix(result[0][0].lastseen)).toDate() + ', ' + moment(moment.unix(result[0][0].lastseen)).fromNow())
				})
			}
		})	
	})	
	
}

