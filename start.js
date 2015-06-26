var fs = require('fs')
var Q = require('q')
var prompt = require('prompt')
var connect = require('./system/connect')
var main = require('./main')
var start = startBot
var mysql = require('mysql')
var capitalize = require('underscore.string/capitalize')



fs.stat('./settings/config.json', function (err, stat) {
    if (err == null) {
        console.log('Config found, starting bot')
        var config = fs.readFileSync('./settings/config.json')

        try {
            configData = JSON.parse(config)
        } catch (err) {
            console.log('There has been an error parsing your config file in start.js')
            console.log(err)
            process.exit(1)
        }
        //Server Info
        if (configData.Dimension == 1) {
            var HOST = 'chat.d1.funcom.com'
            var PORT = 7105
        } else if (configData.Dimension == 2) {
            var HOST = 'chat.dt.funcom.com'
            var PORT = 7109
        } else {
            console.log('Invalid Dimension Selected')
            process.exit(1)
        }

        //Set Mysql Pool
        global.pool = mysql.createPool({
            connectionLimit: 100,
            host: configData.Host,
            database: configData.Database,
            user: configData.DbUser,
            password: configData.DbPassword
        })

        // Bot Info
        global.Login = configData.User
        global.Pass = configData.Password
        global.Botname = configData.Botname
        global.Owner = configData.Owner
        if (configData.Org) {
            global.ORG = configData.Org
        } else {
            global.ORG = false
        }
        start(HOST, PORT)
    } else {
        console.log('Creating Config \n')
        prompt.start()
        prompt.get(schema, function (err, result) {
            var config = {
                // Login Info
                User: result.user,
                Password: result.password,
                Botname: capitalize(result.botname.toLowerCase()),
                Owner: capitalize(result.owner.toLowerCase()),
                Org: result.org,
                Dimension: result.dimension,

                // Database Info
                Host: result.dbHost,
                Database: result.dbName,
                DbUser: result.dbUser,
                DbPassword: result.dbPassword
            }

            var data = JSON.stringify(config, null, 2)
            fs.writeFile('./settings/config.json', data, function (err) {
                if (err) {
                    console.log('There has been an error saving your configuration data.')
                    console.log(err.message)
                    return
                }
                console.log('Configuration saved successfully')
                //Server Info
                if (config.Dimension == 1) {
                    var HOST = 'chat.d1.funcom.com'
                    var PORT = 7105
                } else if (config.Dimension == 2) {
                    var HOST = 'chat.dt.funcom.com'
                    var PORT = 7109
                } else {
                    console.log('Invalid Dimension Selected')
                    process.exit(1)
                }

                //Set Mysql Pool
                global.pool = mysql.createPool({
                    connectionLimit: 100,
                    host: config.Host,
                    database: config.Database,
                    user: config.DbUser,
                    password: config.DbPassword
                })

                // Bot Info
                global.Login = config.User
                global.Pass = config.Password
                global.Botname = config.Botname
                global.Owner = config.Owner
                if (config.Org) {
                    global.ORG = config.Org
                } else {
                    global.ORG = false
                }
                sqlFiles = ['core', 'bossloot', 'aodb', 'cmdcfg']
                connectdb().done(function (connection) {
                    console.log('Creating & Populating databases, this might take a while.')
                    Q.all(
                    Array.prototype.concat.apply([], sqlFiles.map(function (file) {
                        return fs.readFileSync('./system/data/' + file + '.sql', 'utf8')
                            .split(/;/).map(function (queries) {
                            if (queries.length > 10) {
                                return query(connection, queries)
                            }
                        })
                    }))).done(function () {
                        console.log('Done, starting bot')
                        connection.release()
                        start(HOST, PORT)
                    })
                })

            })
        })
    }
})


var schema = {
    properties: {
        user: {
            description: 'Account Username',
            pattern: /^[a-zA-Z\0-9]+$/,
            message: 'User must be only letters or numbers',
            required: true
        },
        password: {
            description: 'Account Password',
            required: true
        },
        botname: {
            description: 'Enter the character name the bot will run on',
            required: true
        },
        org: {
            description: 'Enter your Org Name, leave blank if this will be a raid bot',
            required: false
        },
        dimension: {
            description: 'Choose dimension (1 - Rubi-Ka, 2 - Test)',
            type: 'number',
            pattern: /^[1-2]+$/,
            message: 'Numbers only, 1 OR 2',
            default: 1
        },
        owner: {
            description: 'Enter the name of the character you wish to be super-admin',
            required: true
        },
        dbHost: {
            description: 'Enter the Database Host, leave blank for default',
            required: true,
            default: 'localhost'
        },
        dbName: {
            description: 'Enter the Database Name, leave blank for default',
            required: true,
            default: 'nephbot'
        },
        dbUser: {
            description: 'Enter the Database Username, leave blank for default',
            required: true,
            default: 'nephbot'
        },
        dbPassword: {
            description: 'Enter the Database password if you set one, leave blank for none',
        }
    }
}