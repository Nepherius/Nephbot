// Import all commands from modules, export them to main file and register to DB
const winston = require('winston');
/****************** Import Command Modules ******************/

const Command = require('../config/models/commands.js');
// Core Commands
const Cmd = require('./core/core_commands');

//Additional Commands


/************ Add Imported Commands ************/

//General



//MISC

/************ Export Commands To Index ************/
module.exports = Cmd;

/********** Register Commands to Database **********/

let cmdList = [{
    cmdName: 'about',
    description: 'General Bot information',
    help: 'about',
}, {
    cmdName: 'shutdown',
    description: 'Shutdown bot.',
    help: 'shutdown',
    accessRequired: 99
}, {
    cmdName: 'invite',
    description: 'Invite player to guest channel.',
    help: 'invite [player name]',
    accessRequired: 2
}, {
    cmdName: 'join',
    description: 'Join guest channel.',
    help: 'join',
    accessRequired: 1
}, {
    cmdName: 'kick',
    description: 'Kick player from guest channel.',
    help: 'kick [player name]',
    accessRequired: 2
}, {
    cmdName: 'leave',
    description: 'Leave guest channel.',
    help: 'leave',
    accessRequired: 0
}, {
    cmdName: 'addadmin',
    description: 'Add a new bot admin.',
    help: 'addadmin <player name>',
    accessRequired: 99
}, {
    cmdName: 'addmember',
    description: 'Add a new member.',
    help: 'addmember <player name>',
    accessRequired: 2
}, {
    cmdName: 'remadmin',
    description: 'Demotes an admin to member.',
    help: 'remadmin <player name>',
    accessRequired: 99
}, {
    cmdName: 'remmember',
    description: 'Warning!Removes all access, even if player is an admin.',
    help: 'remmember <player name>',
    accessRequired: 2
}, {
    cmdName: 'register',
    description: 'Register as a member.',
    help: 'register',
    accessRequired: 0
}, {
    cmdName: 'unregister',
    description: 'Warning!Removes all access, even if player is an admin.',
    help: 'unregister',
    accessRequired: 1
}, {
    cmdName: 'status',
    description: 'User subscribtion status.',
    help: 'status',
    accessRequired: 1
}, {
    cmdName: 'addreplica',
    description: 'Add a new replica.',
    help: 'addreplica <user pass botname [dimension]>',
    accessRequired: 99
}, {
    cmdName: 'ban',
    description: 'Permanetly ban player.',
    help: 'ban <player name>',
    accessRequired: 2
}, {
    cmdName: 'unban',
    description: 'Unban player.',
    help: 'unban <player name>',
    accessRequired: 99
}, {
    cmdName: 'test',
    description: 'For testing purposes only!',
    help: 'Unknown.',
    accessRequired: 99
}, {
    cmdName: 'help',
    description: 'Display general help or help for a specified command.',
    help: 'help [command name]',
    accessRequired: 0
}, {
    cmdName: 'replicastatus',
    description: 'Shows the current status of each active replica!',
    help: 'replicastatus',
    accessRequired: 2
}, {
    cmdName: 'set',
    description: 'Update settings.',
    help: 'set <setting name> <argument>',
    accessRequired: 99
}, {
    cmdName: 'autoinvite',
    description: 'Turn autoinvite on/off.',
    help: 'autoinvite [on|off]',
    accessRequired: 1
}, {
    cmdName: 'stats',
    description: 'Bot statistics',
    help: 'stats',
    accessRequired: 1
}, {
    cmdName: 'cmdlist',
    description: 'List all commands.',
    help: 'cmdlist',
    accessRequired: 1
},{
    cmdName: 'admins',
    description: 'Admins, sort of.',
    help: 'admins',
    accessRequired: 1
}];


// At the moment mongoose has no support for continue on error while using
// Model.insertMany so the database needs to be cleared manually if new commands
// are added.
Command.insertMany(cmdList, function(err) {
    if (err) {
        winston.debug(err);
    }
});
