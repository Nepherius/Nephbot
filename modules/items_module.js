var assert = require('assert')
var Q = require('q')
var parseString = require('xml2js').parseString;
var util = require('util')
var express = require('express')
var request = require('request')
var parseString = require('xml2js').parseString;

exports.items = items = function(userId, args) {
	console.log(args.slice(1).join(' '))
	request('http://cidb.botsharp.net/?bot=NephBot' + (isNaN(args[0]) ? '&search=' + args.join(' ') : '&ql=' + args[0] + '&search=' + args.slice(1).join(' ')) +  '&output=xml&max=50',function (error, response, body) {
		if (!error && response.statusCode == 200) {
			parseString(body, function (err, result) {
				if (result.items.results[0] > 0) {
					found = '<center> <font color=#FFFF00> ::: ' + result.items.results[0] +  ' Results Found::: </font> </center> \n\n'
					found += 'Source: http://cidb.botsharp.net/ \n'
					found += 'DB Version: ' + result.items.version[0] + '\n'
					found += 'Search: ' + args.join(' ') + '\n\n'
					itemQl = result.items.ql[0]
					for (i = 0; i < result.items.results[0]; i++) {	
						if (result.items.ql[0] == 0 ) { itemQl = result.items.item[i].$.highql }
						found += '<img src=rdb://' + result.items.item[i].$.icon + '> \n'
						found += 'QL ' + itemQl + ' ' 
						found += itemref(result.items.item[i].$.lowid, result.items.item[i].$.highid, itemQl, result.items.item[i].$.name.replace("'", "`")) + ' '
						found += '(' + result.items.item[i].$.lowql + ' - ' + result.items.item[i].$.highql + ')\n'
					}	
					send_MESSAGE_PRIVATE(userId, blob('Item Search Results(' + result.items.results[0] + ')' , found))
				}	else {
					send_MESSAGE_PRIVATE(userId,'No items found matching: ' + args.join(' '))
				}	
			})	
		} else {
			console.log('Error ' + error)
			connectdb().done(function(connection) {// Needs some work
				if (isNaN(args[0])) { searchText = args.join('%') } else { searchText = args.slice(1).join('%') }
				searchText = searchText.replace(/exec|execute|select|insert|update|delete|create|alter|drop|rename|truncate|backup|restore|\*|\||\?/gim, '')
				query(connection,'SELECT * FROM aodb WHERE'  + (!isNaN(args[0]) ? ' highql >= ' + +args[0] + ' AND lowql <=' + args[0] + ' AND' : '') + ' name LIKE "' + searchText  + '%"' + 'OR name LIKE "% ' + searchText + '%"').done(function(result) {
					if(result[0].length !== 0 ) {
						found = '<center> <font color=#FFFF00> ::: ' + result[0].length +  ' Results Found::: </font> </center> \n\n'
						found += 'Source: Local \n'
						found += 'Search: ' + searchText.replace(/%/g,' ') + '\n\n'
						searchQl = isNaN(+args[0]) ? 0 : args[0]
						for (i = 0; i < result[0].length; i++) {
							if (searchQl == 0 ) { itemQl = result[0][i].highql } else { itemQl = searchQl }
							found += '<img src=rdb://' + result[0][i].icon + '> \n'
							found += 'QL ' + itemQl + ' '
							found += itemref(result[0][i].lowid, result[0][i].highid, itemQl, result[0][i].name) + ' '
							found += '(' + result[0][i].lowql + ' - ' + result[0][i].highql + ')\n'
						}	
						send_MESSAGE_PRIVATE(userId, blob('Item Search Results(' + result[0].length + ')' , found))
						connection.release()	
					} else {
						send_MESSAGE_PRIVATE(userId,'No items found matching: ' + searchText)
						connection.release()
					}					
					
				})	
			})
		}		
	})
}	