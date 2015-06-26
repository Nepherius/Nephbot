CREATE TABLE IF NOT EXISTS `admins` (
  `charid` int(30) NOT NULL,
  `name` varchar(30) NOT NULL,
  `rank` varchar(30) NOT NULL,
  `level` int(11) NOT NULL
);
CREATE TABLE IF NOT EXISTS `channel` (
  `charid` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `afk` varchar(11) NOT NULL
);
CREATE TABLE IF NOT EXISTS `members` (
  `charid` bigint(30) NOT NULL DEFAULT '0',
  `name` varchar(255) NOT NULL,
  `main` varchar(255) NOT NULL,
  `banned` int(10) NOT NULL
);
CREATE TABLE IF NOT EXISTS `online` (
  `charid` int(20) NOT NULL,
  `name` varchar(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS `players` (
  `charid` bigint(20) NOT NULL,
  `firstname` varchar(30) DEFAULT NULL,
  `name` varchar(20) NOT NULL,
  `lastname` varchar(30) DEFAULT NULL,
  `level` smallint(6) NOT NULL,
  `breed` varchar(20) NOT NULL,
  `gender` varchar(20) NOT NULL,
  `faction` varchar(20) NOT NULL,
  `profession` varchar(20) NOT NULL,
  `profession_title` varchar(50) NOT NULL,
  `ai_rank` varchar(20) NOT NULL,
  `ai_level` smallint(6) NOT NULL,
  `guild` varchar(255) DEFAULT NULL,
  `guild_rank` varchar(20) DEFAULT NULL,
  `source` varchar(50) NOT NULL,
  `lastupdate` int(11) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS `points` (
  `main` varchar(30) NOT NULL,
  `points` int(100) NOT NULL DEFAULT '0'
);
CREATE TABLE IF NOT EXISTS `point_history` (
  `admin` varchar(30) NOT NULL,
  `recipient` varchar(30) NOT NULL,
  `amount` int(11) NOT NULL,
  `reason` text NOT NULL,
  `date` int(11) NOT NULL
);
CREATE TABLE IF NOT EXISTS `raidforce` (
  `name` varchar(30) NOT NULL,
  `points` int(30) NOT NULL,
  `afk` int(11) NOT NULL
);
CREATE TABLE IF NOT EXISTS `raidhistory` (
  `status` varchar(30) NOT NULL,
  `description` text NOT NULL,
  `leader` varchar(30) NOT NULL,
  `locked` varchar(11) NOT NULL,
  `start` int(11) NOT NULL,
  `stop` int(11) NOT NULL
);
CREATE TABLE IF NOT EXISTS `raidinfo` (
  `status` varchar(20) NOT NULL,
  `description` text NOT NULL,
  `leader` varchar(30) NOT NULL,
  `locked` varchar(10) NOT NULL DEFAULT 'no',
  `start` int(20) NOT NULL,
  `stop` int(11) NOT NULL
);
CREATE TABLE IF NOT EXISTS `uptime` (
  `start` int(20) NOT NULL
);

ALTER TABLE `admins` ADD UNIQUE KEY `charid` (`charid`);
ALTER TABLE `channel` ADD PRIMARY KEY (`charid`);
ALTER TABLE `members` ADD UNIQUE KEY `charid` (`charid`), ADD UNIQUE KEY `name` (`name`);
ALTER TABLE `online` ADD PRIMARY KEY (`charid`);
ALTER TABLE `players` ADD PRIMARY KEY (`charid`), ADD UNIQUE KEY `charid` (`charid`);