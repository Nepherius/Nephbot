var assert = require('assert')
var Q = require('q')
var parseString = require('xml2js').parseString;
var util = require('util')
var express = require('express')
var request = require('request')


exports.whois = whois = function(userId, userName) {
	request('http://people.anarchy-online.com/character/bio/d/5/name/' + userName + '/bio.xml', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			if (body.length > 10) { // check if xml is empty
				parseString(body, function (err, result) {
				charName = result.character.name[0]
				charStats = result.character.basic_stats[0]
				charOrg =''
				charOrg.organization_name = 'Not in a guild'
				charOrg.rank = 'None'
				if (result.character.organization_membership !== undefined) { charOrg = result.character.organization_membership[0]}
				charLastUpdated = result.character.last_updated[0]
				//console.log(util.inspect(result, false, null)) just for debugging
				});
				var whoisInfo = ''
				if (charName.firstname[0]) { whoisInfo += '<font color=\'#89D2E8\'>' + charName.firstname + '</font> ' }
				whoisInfo += '<font color=\'#FF0000\'> ' + charName.nick[0] + '</font> '
				if (charName.lastname[0]) {	whoisInfo +='<font color=\'#89D2E8\'>' + charName.lastname + ' </font>' }
				whoisInfo += '(<font color=\'#FF0000\'>' + charStats.level[0] + '</font>/'
				whoisInfo += '<font color=\'#40FF00\'>' + charStats.defender_rank_id[0] + '</font> - '
				whoisInfo += '<font color=\'#40FF00\'> ' + charStats.defender_rank[0] + '</font>, '
				whoisInfo += charStats.gender[0] + ', ' 
				whoisInfo += charStats.breed[0] + ', ' 
				whoisInfo += '<font color=\'#FF0000\'> ' + charStats.profession[0] + '</font> - '
				whoisInfo += charStats.profession_title[0] + ', ' 
				switch(charStats.faction[0]) {
					case 'Omni':
						whoisInfo += '<font color=\'#00FFFF\'>' + charStats.faction[0] + '</font>, '
						break;
					case 'Clan':
						whoisInfo += '<font color=\'#FACC2E\'>' + charStats.faction[0] + '</font>, '
						break;
					default:
						whoisInfo += '<font color=\'#FFFFFF\'>' + charStats.faction[0] + '</font>, '
					
				}		
				if (charOrg) {
					whoisInfo += charOrg.rank + ' of '
					whoisInfo +='<font color=\'#FF0000\'> ' +  charOrg.organization_name + '</font>) '
				} else {
					whoisInfo += 'Not in a guild)'
				}		
				
				//Add: check offline/online status 
				send_MESSAGE_PRIVATE(userId, '<font color=\'#89D2E8\'>' + whoisInfo + '</font>')
			} else {
				send_MESSAGE_PRIVATE(userId, '<font color=\'#89D2E8\'>Character not found, searching back up source</font>')
				backupWhosis(userId,userName)
			}	
		} else {
			console.log('Could not establish connection to PAO: ' + error)
			backupWhosis(userId,userName)
		}	
	})
}

backupWhosis = function(userId,userName){
	request('https://rubi-ka.net/services/characters.asmx/GetAoCharacterXml?name=' + userName, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			if (body.length > 10) { // check if xml is empty
				parseString(body, function (err, result) {
				charName = result.character.name[0]
				charStats = result.character.basic_stats[0]
				charOrg =''
				charOrg.organization_name = 'Not in a guild'
				charOrg.rank = 'None'
				if (result.character.organization_membership !== undefined) { charOrg = result.character.organization_membership[0]}
				charLastUpdated = result.character.last_updated[0]
				//console.log(util.inspect(result, false, null)) just for debugging
				});
				var whoisInfo = ''
				if (charName.firstname[0]) { whoisInfo += '<font color=\'#89D2E8\'>' + charName.firstname + '</font> ' }
				whoisInfo += '<font color=\'#FF0000\'> ' + charName.nick[0] + '</font> '
				if (charName.lastname[0]) {	whoisInfo +='<font color=\'#89D2E8\'>' + charName.lastname + ' </font>' }
				whoisInfo += '(<font color=\'#FF0000\'>' + charStats.level[0] + '</font>/'
				whoisInfo += '<font color=\'#40FF00\'>' + charStats.defender_rank_id[0] + '</font> - '
				whoisInfo += '<font color=\'#40FF00\'> ' + charStats.defender_rank[0] + '</font>, '
				whoisInfo += charStats.gender[0] + ', ' 
				whoisInfo += charStats.breed[0] + ', ' 
				whoisInfo += '<font color=\'#FF0000\'> ' + charStats.profession[0] + '</font> - '
				whoisInfo += charStats.profession_title[0] + ', ' 
				switch(charStats.faction[0]) {
					case 'Omni':
						whoisInfo += '<font color=\'#00FFFF\'>' + charStats.faction[0] + '</font>, '
						break;
					case 'Clan':
						whoisInfo += '<font color=\'#FACC2E\'>' + charStats.faction[0] + '</font>, '
						break;
					default:
						whoisInfo += '<font color=\'#FFFFFF\'>' + charStats.faction[0] + '</font>, '
					
				}		
				if (charOrg) {
					whoisInfo += charOrg.rank + ' of '
					whoisInfo +='<font color=\'#FF0000\'> ' +  charOrg.organization_name + '</font>) '
				} else {
					whoisInfo += 'Not in a guild)'
				}		
				
				//Add: check offline/online status 
				send_MESSAGE_PRIVATE(userId, '<font color=\'#89D2E8\'>' + whoisInfo + '</font>')
			} else {
				send_MESSAGE_PRIVATE(userId, '<font color=\'#89D2E8\'>Character not found</font>')	
			}	
		} else {
			console.log('Could not establish connection to Rubi-Ka.net: ' + error)
			// Fallback to local = Overkill ????
		}	
	})
}	