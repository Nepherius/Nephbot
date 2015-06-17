var assert = require('assert')
var Q = require('q')
var parseString = require('xml2js').parseString;
var util = require('util')
var express = require('express')
var request = require('request')
var parseString = require('xml2js').parseString;
var commands = require('../central.js')

// NOT IN USE
orgId = '9696'
exports.getroster = getroster = function(userId, args) {

var t = process.hrtime();
// ADD: DO whois on Bot Owner to get orgId

	request('http://people.anarchy-online.com/org/stats/d/5/name/' + orgId +  '/basicstats.xml',function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//send_GROUP_MESSAGE('Downloading Member Roster')
			if (body.length > 10) { // check if xml is empty
			parseString(body, function (err, result) {
			connectdb().done(function(connection) {
					res = result.organization.members[0].member
					arrlen = res.length
					for (i = 0; i < arrlen;i++) {
						charName = res[i]
						query(connection,'INSERT INTO org_roster (firstname, name, lastname, level, breed, gender, profession, profession_title, ai_rank, ai_level,guild_rank, source, lastupdate) VALUES (' 
							+ '"' + charName.firstname + '",' 
							+ '"' + charName.nickname + '",' 
							+ '"' + charName.lastname + '",' 
							+ charName.level + ','
							+ '"' + charName.breed + '",'
							+ '"' + charName.gender + '",'
							+ '"' + charName.profession + '",'
							+ '"' + charName.profession_title + '",'
							+ '"' + charName.defender_rank + '",'
							+ charName.defender_rank_id + ','
							+ '"' + charName.rank_name + '",'
							+ '"people.anarchy-online.com",'
							+ '(UNIX_TIMESTAMP(NOW())))', function(err, result) {
								if(err) {
									console.log(err)
									connection.release()
								}
									
							}
						)
					cmd.lookupUserName(charName.nickname).then(function (idResult) {
						send_BUDDY_ADD(idResult)
					})				
					}	
					 t = process.hrtime(t);
				 //send_GROUP_MESSAGE('Finished in ' + t[0] + ' seconds and ' + t[1] + ' nanoseconds' )
				})
			})
		}
		}	
	})
}	