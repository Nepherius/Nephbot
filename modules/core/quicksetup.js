var Q = require('q')
var fs = require('fs')
var capitalize = require('underscore.string/capitalize')


exports.quicksetup = quicksetup = function(userId, args) {
	var setup = '<center> <font color=#FFFF00> ::: Quick Setup ::: </font> </center> \n\n'
	setup += 'Here you can quickly change the settings of your raid bot by chosing one of the predefined modes: \n'
	setup += '<center>Default </center>'
	setup += '<font color=#00FFFF>Description:</font> Anyone can join and use most commands except raid control. \n'
	setup += '<font color=#00FFFF>Info Commands:</font> Anyone \n'
	setup += '<font color=#00FFFF>Join:</font> Anyone \n'
	setup += '<font color=#00FFFF>Invite:</font> Members \n'
	setup += '<font color=#00FFFF>Register:</font> Enabled \n'
	setup += '<font color=#00FFFF>Points:</font> Enabled \n'
	setup += '<font color=#00FFFF>Raid Control:</font> Mods \n'
	setup += tellBlob(Botname, 'quicksetup default', 'Click to apply')
	setup += '<center>Public </center>'
	setup += '<font color=#00FFFF>Description:</font> Anyone can join and use most commands including raid control. \n'
	setup += '<font color=#00FFFF>Info Commands:</font> Anyone \n'
	setup += '<font color=#00FFFF>Join:</font> Anyone \n'
	setup += '<font color=#00FFFF>Invite:</font> Members \n'
	setup += '<font color=#00FFFF>Register:</font> Enabled \n'
	setup += '<font color=#00FFFF>Points:</font> Disabled \n'
	setup += '<font color=#00FFFF>Raid Control:</font> Members \n'
	setup += tellBlob(Botname, 'quicksetup public', 'Click to apply')
	setup += '<center>Private </center>'
	setup += '<font color=#00FFFF>Description:</font> Invite only, commands are members only, only admins can use raid control \n'
	setup += '<font color=#00FFFF>Info Commands:</font> Members \n'
	setup += '<font color=#00FFFF>Join:</font> Members \n'
	setup += '<font color=#00FFFF>Invite:</font> Members \n'
	setup += '<font color=#00FFFF>Register:</font> Disabled \n'
	setup += '<font color=#00FFFF>Points:</font> Enabled \n'
	setup += '<font color=#00FFFF>Raid Control:</font> Mods \n'
	setup += tellBlob(Botname, 'quicksetup private', 'Click to apply')		
	setup += '<center>Strict </center>'
	setup += '<font color=#00FFFF>Description:</font> All commands require membership, most commands require Mod or above \n'
	setup += '<font color=#00FFFF>Info Commands:</font> Members\n'
	setup += '<font color=#00FFFF>Join:</font> Members\n'
	setup += '<font color=#00FFFF>Invite:</font> Admins \n'
	setup += '<font color=#00FFFF>Register:</font> Disabled \n'
	setup += '<font color=#00FFFF>Points:</font> Enabled \n'
	setup += '<font color=#00FFFF>Raid Control:</font> Admins \n'
	setup += tellBlob(Botname, 'quicksetup strict', 'Click to apply')

	if (!args) {
		send_MESSAGE_PRIVATE(userId, blob('Quick Setup', setup))
	} else {
		switch(args[0]) {
			case 'default' :
				sql(userId, 'default')
			break;	
			case 'public' :
				sql(userId, 'public')
			break;	
			case 'private' :
				sql(userId, 'private')
			break;	
			case 'strict' :
				sql(userId, 'strict')
			break;
			default :
				send_MESSAGE_PRIVATE(userId, args + ' is not a valid mode')
		}	

	}
}	

sql = function(userId, file) {
	
	connectdb().done(function(connection) {
		Q.all(fs
			.readFileSync('./settings/modes/' + file.toLowerCase() + '.sql', 'utf8')
			.split(/;/)
					.map(function(queries) {
				if (queries.length > 10) { // Will ignore empty lines
				return query(connection, queries)
				}
			})
		).done(function() {
			connection.release()
			send_MESSAGE_PRIVATE(userId, capitalize(file.toLowerCase()) + ' mode applied successfully')
		})
	})

}