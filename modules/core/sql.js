var assert = require('assert')
var Q = require('q')
var parseString = require('xml2js').parseString
var http = require('http')
var util = require('util')
var express = require('express')
var request = require('request')
var parseString = require('xml2js').parseString
var fs = require('fs')

exports.sql = sql = function(userId, args) {

	connectdb().done(function(connection) {
		Q.all(fs
			.readFileSync('./settings/data/bossloot.sql', 'utf8')
			.split(/;/)
					.map(function(queries) {
				if (queries.length > 10) {
				return query(connection, queries)
				}
			})
		).done(function() {
			connection.release()
			console.log('Done')
		})
	})
}	



