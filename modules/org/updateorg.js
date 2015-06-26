var assert = require('assert')
var Q = require('q')
var parseString = require('xml2js').parseString
var http = require('http')
var util = require('util')
var express = require('express')
var request = require('request')
var parseString = require('xml2js').parseString
var fs = require('fs')



exports.updateorg = updateorg = function() {
	if (!ORG) { return } // Stop here if this is not a org bot
	var t = process.hrtime();
	getOrgId().then(function(orgId) {
		request('http://people.anarchy-online.com/org/stats/d/5/name/' + orgId +  '/basicstats.xml',function (error, response, body) {
			if (!error && response.statusCode == 200) {
				if (body.length > 10) { // check if xml is empty
					send_GROUP_MESSAGE('Downloading Member Roster')
					parseString(body, function (err, result) {
						if (result.organization.name[0].toLowerCase() !== ORG.toLowerCase()) { // Stop here if the wrong orgId is found
							send_GROUP_MESSAGE('Member Update failed, owner\'s org did not match the org specified in config.')
							return
						}
						connectdb().done(function(connection) {
							res = result.organization.members[0].member
							res.map(function(user) {
								 cmd.lookupUserName(user.nickname).done(function (idResult) {
									if (idResult !== -1) {
										query(connection, 'INSERT IGNORE INTO members (charid,name,main) VALUES (' + idResult + ',"' + user.nickname + '","' + user.nickname + '")')
										send_BUDDY_ADD(idResult)
									}	
								})						
							})
							connection.release()
							 t = process.hrtime(t);
						send_GROUP_MESSAGE('Finished in ' + t[0] + ' seconds and ' + t[1] + ' nanoseconds' )
						})
					})
				}
			}	else {
				send_GROUP_MESSAGE('Organization not found')
			}
		}).on('error', function(err) {
			send_GROUP_MESSAGE('Could not reach server')
			console.log(err)
		})	
	})
}	


var getOrgId= function() {
	var defer = Q.defer()
	request('http://people.anarchy-online.com/character/bio/d/5/name/' + Owner + '/bio.xml', function (error, response, body) {
		if (!error && response.statusCode == 200 && body.length > 10) {
			parseString(body, function (err, result) {
				var orgId = result.character.organization_membership[0].organization_id
				defer.resolve(orgId)
			})
		} else {
			request('https://rubi-ka.net/services/characters.asmx/GetAoCharacterXml?name=' + Owner, function (error, response, body) {
				if (!error && response.statusCode == 200 && body.length > 10) {
					parseString(body, function (err, result) {	
						var orgId = result.character.organization_membership[0].organization_id
						defer.resolve(orgId)
					})
				} else {
					send_GROUP_MESSAGE('Unable to retrieve org data')	
				}	
			})
		}	
	}).on('error', function(err) {
		request('https://rubi-ka.net/services/characters.asmx/GetAoCharacterXml?name=' + Owner, function (error, response, body) {
			if (!error && response.statusCode == 200 && body.length > 10) {
				parseString(body, function (err, result) {	
					var orgId = result.character.organization_membership[0].organization_id
					defer.resolve(orgId)
				})
			} else {
				send_GROUP_MESSAGE('Unable to retrieve org data')	
			}	
		})
	})	
	return defer.promise	
}	


