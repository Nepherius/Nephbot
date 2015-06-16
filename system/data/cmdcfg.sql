CREATE TABLE IF NOT EXISTS `cmdcfg` (
  `id` int(11) NOT NULL,
  `module` varchar(50) NOT NULL,
  `cmd` varchar(50) NOT NULL,
  `access_req` int(20) NOT NULL DEFAULT '0',
  `options` varchar(50) NOT NULL,
  `description` varchar(75) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'enabled'
);
ALTER TABLE cmdcfg ADD PRIMARY KEY (id);
INSERT INTO `cmdcfg` VALUES (1, 'Core', 'addadmin', 4, '', 'Adds a bot admin', 'enabled');
INSERT INTO `cmdcfg` VALUES (2, 'Core', 'addmember', 3, '', 'Add player to member list', 'enabled');
INSERT INTO `cmdcfg` VALUES (3, 'Core', 'addmod', 4, '', 'Add a bot moderator', 'enabled');
INSERT INTO `cmdcfg` VALUES (4, 'Core', 'cmdlist', 1, '', 'List all available commands', 'enabled');
INSERT INTO `cmdcfg` VALUES (5, 'Core', 'deladmin', 4, '', 'Removes bot admin', 'enabled');
INSERT INTO `cmdcfg` VALUES (6, 'Core', 'delmember', 3, '', 'Remove player from member list', 'enabled');
INSERT INTO `cmdcfg` VALUES (7, 'Core', 'invite', 1, '', 'Invite player to private group', 'enabled');
INSERT INTO `cmdcfg` VALUES (8, 'Core', 'join', 0, '', 'Join bot private group', 'enabled');
INSERT INTO `cmdcfg` VALUES (9, 'Core', 'kick', 3, '', 'Kick player from private group', 'enabled');
INSERT INTO `cmdcfg` VALUES (10, 'Core', 'kickall', 3, '', 'Kick all players from private group', 'enabled');
INSERT INTO `cmdcfg` VALUES (11, 'Core', 'leave', 0, '', 'Leave private group', 'enabled');
INSERT INTO `cmdcfg` VALUES (12, 'Core', 'online', 1, '', 'Show a list of all players currently on bot channel.', 'enabled');
INSERT INTO `cmdcfg` VALUES (13, 'Core', 'register', 0, '', 'Register as a member of the group', 'enabled');
INSERT INTO `cmdcfg` VALUES (14, 'Core', 'unregister', 0, '', 'Unregister from group', 'enabled');
INSERT INTO `cmdcfg` VALUES (15, 'Whois', 'whois', 0, '', 'Show character info', 'enabled');
INSERT INTO `cmdcfg` VALUES (16, 'Raid', 'start', 3, '', 'Start raid', 'enabled');
INSERT INTO `cmdcfg` VALUES (17, 'Raid', 'stop', 3, '', 'Stop raid', 'enabled');
INSERT INTO `cmdcfg` VALUES (18, 'Core', '12m', 1, '', '12m Loot List', 'enabled');
INSERT INTO `cmdcfg` VALUES (19, 'Core', 'quicksetup', 5, '', 'Change bot settings', 'enabled');
INSERT INTO `cmdcfg` VALUES (20, 'Core', 'admins', 1, '', 'Show list of bot admins', 'enabled');
INSERT INTO `cmdcfg` VALUES (21, 'Core', 'alts', 1, '', 'Add/Del/List player alts', 'enabled');
INSERT INTO `cmdcfg` VALUES (22, 'Core', 'shutdown', 4, '', 'Shut down bot', 'enabled');
INSERT INTO `cmdcfg` VALUES (23, 'Raid', 'flatroll', 3, '', 'Flatroll', 'enabled');
INSERT INTO `cmdcfg` VALUES (24, 'Raid', 'rem', 3, '', 'Remove player from all rolls (Admin Only)', 'enabled');
INSERT INTO `cmdcfg` VALUES (25, 'Core', 'rem', 1, '', 'Remove player from rolls', 'enabled');
INSERT INTO `cmdcfg` VALUES (26, 'Raid', 'add', 1, '', 'Join item roll', 'enabled');
INSERT INTO `cmdcfg` VALUES (27, 'Core', 'bid', 1, '', 'Bid on item', 'enabled');
INSERT INTO `cmdcfg` VALUES (28, 'Core', 'list', 1, '', 'List of all items being rolled', 'enabled');
INSERT INTO `cmdcfg` VALUES (29, 'Core', 'points', 1, '', 'Show player points', 'enabled');
INSERT INTO `cmdcfg` VALUES (30, 'Raid', 'points', 4, '', 'Add/Removed points from player''s account', 'enabled');
INSERT INTO `cmdcfg` VALUES (31, 'Raid', 'pause', 2, '', 'Pause Raid', 'enabled');
INSERT INTO `cmdcfg` VALUES (32, 'Raid', 'resume', 2, '', 'Resume Raid', 'enabled');
INSERT INTO `cmdcfg` VALUES (33, 'Raid', 'lock', 2, '', 'Lock Raid', 'enabled');
INSERT INTO `cmdcfg` VALUES (34, 'Raid', 'unlock', 2, '', 'Unlock Raid', 'enabled');
INSERT INTO `cmdcfg` VALUES (35, 'Raid', 'join', 1, '', 'Join Raid', 'enabled');
INSERT INTO `cmdcfg` VALUES (36, 'Raid', 'leave', 1, '', 'Leave Raid', 'enabled');
INSERT INTO `cmdcfg` VALUES (37, 'Raid', 'kick', 2, '', 'Kick player from Raid', 'enabled');
INSERT INTO `cmdcfg` VALUES (38, 'Raid', 'add', 2, '', 'Add player to Raid', 'enabled');
INSERT INTO `cmdcfg` VALUES (39, 'Raid', 'reward', 2, '', 'Reward all Raid members', 'enabled');
INSERT INTO `cmdcfg` VALUES (40, 'Raid', 'deduct', 2, '', 'Remove points from all Raid members', 'enabled');
INSERT INTO `cmdcfg` VALUES (41, 'Raid', 'bid', 2, '', 'Start auction for item', 'enabled');
INSERT INTO `cmdcfg` VALUES (42, 'Raid', 'loot', 2, '', 'Add item to flatroll list', 'enabled');
INSERT INTO `cmdcfg` VALUES (43, 'Core', 'raid', 1, '', 'Raid detailes', 'enabled');
ALTER TABLE `cmdcfg` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=44;
