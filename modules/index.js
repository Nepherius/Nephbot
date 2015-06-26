// Import commands 
var commands = require('./core/core_commands')
var whois_module = require('./core/whois')
var items_module = require('./core/items')
var quicksetup_module = require('./core/quicksetup')
var updateorg_module = require('./org/updateorg')
var test_module = require('./core/test')
var raid_control = require('./raid/raid_control')
var bossloot_module = require('./raid/bossloot')
var misc = require('./core/misc')


//General
commands.whois = whois
commands.items = items
commands.quicksetup = quicksetup
commands.about = about
//Raid
commands.raid = raid
commands.bid = bid
commands.list = list
commands.points = points
commands.add = add
commands.rem = rem
commands.flatroll = flatroll
//Boss Loot
commands['12m'] = boss12m
commands.s7 = s7
commands.s13 = s13
commands.s42 = s42


//ORG
commands.updateorg = updateorg

//MISC
commands.test = test
// Export commands to main.js
module.exports = commands


// Create & Initiate Cmd
function Cmd(helpInfo, commands) {
    var functionName;
    this.help = function (replyTo, helpTopic) {
        if (undefined === helpTopic) {
            send_MESSAGE_PRIVATE(replyTo, 'To Be Added')
        } else if (helpInfo.hasOwnProperty(helpTopic)) {
            send_MESSAGE_PRIVATE(replyTo, helpInfo[helpTopic])
        } else {
            send_MESSAGE_PRIVATE(replyTo, 'Requested topic not found')
        }
    };

    for (functionName in commands) {
        if (commands.hasOwnProperty(functionName)) {
            this[functionName] = commands[functionName]
        }
    }
}

var helpCmd = {}
helpCmd.invite = 'To invite a player to the channel use: !invite \'player\'' // a lonely example

// Create an instance of Cmd.
global.cmd = new Cmd(helpCmd, commands)