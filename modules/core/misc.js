exports.about = about = function (userId) {
	send_MESSAGE_PRIVATE(userId, blob('About NephBot', aboutReply))	
}

var aboutReply = '<center> <font color=#FFFF00> :::Nephbot AO Chat Bot::: </font> </center> \n\n'
aboutReply += '<font color=#00FFFF>Version:</font> Beta \n'
aboutReply += '<font color=#00FFFF>By:</font> Nepherius \n'
aboutReply += '<font color=#00FFFF>In:</font> Node.js \n\n'
aboutReply += '<font color=#00FFFF>Special Thanks:</font> To all the people that worked on the original AO Chat Bots, Nephbot would not be possible without them.    \n'
