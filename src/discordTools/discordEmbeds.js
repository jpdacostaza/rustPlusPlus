const Discord = require('discord.js');

const Client = require('../../index.ts');
const Constants = require('../util/constants.js');
const Timer = require('../util/timer');
const DiscordTools = require('./discordTools.js');

module.exports = {
    getEmbed: function (options = {}) {
        const embed = new Discord.EmbedBuilder();

        if (options.title) embed.setTitle(options.title);
        if (options.color) embed.setColor(options.color);
        if (options.description) embed.setDescription(options.description);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.image) embed.setImage(options.image);
        if (options.url) embed.setURL(options.url);
        if (options.author) embed.setAuthor(options.author);
        if (options.footer) embed.setFooter(options.footer);
        if (options.timestamp) embed.setTimestamp();
        if (options.fields) embed.setFields(...options.fields);

        return embed;
    },

    getSmartSwitchEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].switches[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: entity.active ? '#00ff40' : '#ff0040',
            description: `**ID**: \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            fields: [{
                name: 'Custom Command',
                value: `\`${instance.generalSettings.prefix}${entity.command}\``,
                inline: true
            }]
        });
    },

    getServerEmbed: function (guildId, serverId) {
        const instance = Client.client.readInstanceFile(guildId);
        const server = instance.serverList[serverId];

        return module.exports.getEmbed({
            title: `${server.title}`,
            color: '#ce412b',
            description: `${server.description}`,
            thumbnail: `${server.img}`,
            fields: [{
                name: 'Connect',
                value: `\`${server.connect === null ? 'Unavailable' : server.connect}\``,
                inline: true
            }]
        });
    },

    getTrackerEmbed: function (guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);
        const tracker = instance.trackers[trackerId];
        const serverStatus = tracker.status ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI;

        let playerName = '', playerSteamId = '', playerStatus = '';
        for (const player of tracker.players) {
            playerName += `${player.name}\n`;
            if (tracker.players.length < 12) {
                playerSteamId += `[${player.steamId}](${Constants.STEAM_PROFILES_URL}${player.steamId})\n`;
            }
            else {
                playerSteamId += `${player.steamId}\n`;
            }
            playerStatus += `${(player.status === true) ?
                `${Constants.ONLINE_EMOJI} [${player.time}]` : `${Constants.OFFLINE_EMOJI}`}\n`;
        }

        if (playerName === '') playerName = 'Empty';
        if (playerSteamId === '') playerSteamId = 'Empty';
        if (playerStatus === '') playerStatus = 'Empty';

        return module.exports.getEmbed({
            title: `${tracker.name}`,
            color: '#ce412b',
            description: `**Battlemetrics ID:** \`${tracker.battlemetricsId}\`\n**Server Status:** ${serverStatus}`,
            thumbnail: `${tracker.img}`,
            fields: [
                { name: 'Name', value: playerName, inline: true },
                { name: 'SteamID', value: playerSteamId, inline: true },
                { name: 'Status', value: playerStatus, inline: true }]
        });
    },

    getSmartAlarmEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: entity.active ? '#00ff40' : '#ce412b',
            description: `**ID**: \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            fields: [{
                name: 'Message',
                value: `\`${entity.message}\``,
                inline: true
            }]
        });
    },

    getStorageMonitorEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const rustplus = Client.client.rustplusInstances[guildId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        let description = `**ID** \`${entityId}\``;

        if (!rustplus) {
            return module.exports.getEmbed({
                title: `${entity.name}${grid}`,
                color: '#ce412b',
                description: `${description}\n**STATUS** \`NOT CONNECTED TO SERVER!\``,
                thumbnail: `attachment://${entity.image}`,
                footer: { text: `${entity.server}` }
            });
        }

        if (rustplus && rustplus.storageMonitors[entityId].capacity === 0) {
            return module.exports.getEmbed({
                title: `${entity.name}${grid}`,
                color: '#ce412b',
                description: `${description}\n**STATUS** \`NOT ELECTRICALLY CONNECTED!\``,
                thumbnail: `attachment://${entity.image}`,
                footer: { text: `${entity.server}` }
            });
        }

        description += `\n**Type** \`${(entity.type === 'toolcupboard') ? 'Tool Cupboard' : 'Container'}\``;

        const items = rustplus.storageMonitors[entityId].items;
        const expiry = rustplus.storageMonitors[entityId].expiry;

        if (entity.type === 'toolcupboard') {
            let seconds = 0;
            if (expiry !== 0) {
                seconds = (new Date(expiry * 1000) - new Date()) / 1000;
            }

            let upkeep = null;
            if (seconds === 0) {
                upkeep = ':warning:\`DECAYING\`:warning:';
                instance.serverList[serverId].storageMonitors[entityId].upkeep = 'DECAYING';
            }
            else {
                let upkeepTime = Timer.secondsToFullScale(seconds);
                upkeep = `\`${upkeepTime}\``;
                instance.serverList[serverId].storageMonitors[entityId].upkeep = `${upkeepTime}`;
            }
            description += `\n**Upkeep** ${upkeep}`;
            Client.client.writeInstanceFile(guildId, instance);
        }

        let itemName = '', itemQuantity = '', storageItems = new Object();
        for (const item of items) {
            if (storageItems.hasOwnProperty(item.itemId)) {
                storageItems[item.itemId] += item.quantity;
            }
            else {
                storageItems[item.itemId] = item.quantity;
            }
        }

        for (const [id, quantity] of Object.entries(storageItems)) {
            itemName += `\`${Client.client.items.getName(id)}\`\n`;
            itemQuantity += `\`${quantity}\`\n`;
        }

        if (itemName === '') itemName = 'Empty';
        if (itemQuantity === '') itemQuantity = 'Empty';

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: '#ce412b',
            description: description,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            fields: [
                { name: 'Item', value: itemName, inline: true },
                { name: 'Quantity', value: itemQuantity, inline: true }
            ]
        });
    },

    getSmartSwitchGroupEmbed: function (guildId, serverId, groupId) {
        const instance = Client.client.readInstanceFile(guildId);
        const group = instance.serverList[serverId].switchGroups[groupId];

        let switchName = '', switchId = '', switchActive = '';
        for (const groupSwitchId of group.switches) {
            if (instance.serverList[serverId].switches.hasOwnProperty(groupSwitchId)) {
                const sw = instance.serverList[serverId].switches[groupSwitchId];
                const active = sw.active;
                switchName += `${sw.name}${sw.location !== null ? ` ${sw.location}` : ''}\n`;
                switchId += `${groupSwitchId}\n`;
                if (sw.reachable) {
                    switchActive += `${(active) ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI}\n`;
                }
                else {
                    switchActive += `${Constants.NOT_FOUND_EMOJI}\n`;
                }
            }
            else {
                instance.serverList[serverId].switchGroups[groupId].switches =
                    instance.serverList[serverId].switchGroups[groupId].switches.filter(e => e !== groupSwitchId);
            }
        }
        Client.client.writeInstanceFile(guildId, instance);

        if (switchName === '') switchName = 'None';
        if (switchId === '') switchId = 'None';
        if (switchActive === '') switchActive = 'None';

        return module.exports.getEmbed({
            title: group.name,
            color: '#ce412b',
            thumbnail: 'attachment://smart_switch.png',
            footer: { text: `${instance.serverList[serverId].title}` },
            fields: [
                {
                    name: 'Custom Command',
                    value: `\`${instance.generalSettings.prefix}${group.command}\``,
                    inline: false
                },
                { name: 'Switches', value: switchName, inline: true },
                { name: 'ID', value: switchId, inline: true },
                { name: 'Active', value: switchActive, inline: true }
            ]
        });
    },

    getNotFoundSmartDeviceEmbed: function (guildId, serverId, entityId, type) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId][type][entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: '#ff0040',
            description: `**ID**: \`${entityId}\`\n**STATUS**: NOT FOUND ${Constants.NOT_FOUND_EMOJI}`,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` }
        });
    },

    getStorageMonitorRecycleEmbed: function (guildId, serverId, entityId, items) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        let itemName = '', itemQuantity = '';
        for (const item of items) {
            itemName += `\`${Client.client.items.getName(item.itemId)}\`\n`;
            itemQuantity += `\`${item.quantity}\`\n`;
        }

        const embed = module.exports.getEmbed({
            title: 'Result of recycling:',
            color: '#ce412b',
            thumbnail: 'attachment://recycler.png',
            footer: { text: `${entity.server} | This message will be deleted in 30 seconds.` },
            description: `**Name** \`${entity.name}${grid}\`\n**ID** \`${entityId}\``
        });

        if (itemName === '') itemName = 'Empty';
        if (itemQuantity === '') itemQuantity = 'Empty';

        embed.addFields(
            { name: 'Item', value: itemName, inline: true },
            { name: 'Quantity', value: itemQuantity, inline: true }
        );

        return embed;
    },

    getDecayingNotificationEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid} is decaying!`,
            color: '#ff0040',
            description: `**ID** \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            timestamp: true
        });
    },

    getStorageMonitorDisconnectNotificationEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid} is no longer electrically connected!`,
            color: '#ff0040',
            description: `**ID** \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            timestamp: true
        });
    },

    getStorageMonitorNotFoundEmbed: async function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const credentials = Client.client.readCredentialsFile(guildId);
        const user = await DiscordTools.getUserById(guildId, credentials.credentials.owner);
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid} could not be found! Either it have been destroyed or ` +
                `${user.user.username} have lost tool cupboard access.`,
            color: '#ff0040',
            description: `**ID** \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            timestamp: true
        });
    },

    getSmartSwitchNotFoundEmbed: async function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].switches[entityId];
        const credentials = Client.client.readCredentialsFile(guildId);
        const user = await DiscordTools.getUserById(guildId, credentials.credentials.owner);
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid} could not be found! Either it have been destroyed or ` +
                `${user.user.username} have lost tool cupboard access.`,
            color: '#ff0040',
            description: `**ID** \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            timestamp: true
        });
    },

    getSmartAlarmNotFoundEmbed: async function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const credentials = Client.client.readCredentialsFile(guildId);
        const user = await DiscordTools.getUserById(guildId, credentials.credentials.owner);
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid} could not be found! Either it have been destroyed or ` +
                `${user.user.username} have lost tool cupboard access.`,
            color: '#ff0040',
            description: `**ID** \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            timestamp: true
        });
    },

    getTrackerAllOfflineEmbed: function (guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);
        const tracker = instance.trackers[trackerId];

        return module.exports.getEmbed({
            title: `Everyone from the tracker \`${tracker.name}\` just went offline.`,
            color: '#ff0040',
            thumbnail: `${instance.serverList[tracker.serverId].img}`,
            footer: { text: `${instance.serverList[tracker.serverId].title}` },
            timestamp: true
        });
    },

    getTrackerAnyOnlineEmbed: function (guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);
        const tracker = instance.trackers[trackerId];

        return module.exports.getEmbed({
            title: `Someone from the tracker \`${tracker.name}\` just went online.`,
            color: '#00ff40',
            thumbnail: `${instance.serverList[tracker.serverId].img}`,
            footer: { text: `${instance.serverList[tracker.serverId].title}` },
            timestamp: true
        });
    },

    getNewsEmbed: function (data) {
        return module.exports.getEmbed({
            title: `NEWS: ${data.title}`,
            color: '#ce412b',
            description: `${data.message}`,
            thumbnail: Constants.DEFAULT_SERVER_IMG,
            timestamp: true
        });
    },

    getTeamLoginEmbed: function (body, png) {
        return module.exports.getEmbed({
            color: '#00ff40',
            timestamp: true,
            footer: { text: body.name },
            author: {
                name: `${body.targetName} just connected.`,
                iconURL: (png !== null) ? png : Constants.DEFAULT_SERVER_IMG,
                url: `${Constants.STEAM_PROFILES_URL}${body.targetId}`
            }
        });
    },

    getPlayerDeathEmbed: function (data, body, png) {
        return module.exports.getEmbed({
            color: '#ff0040',
            thumbnail: png,
            title: data.title,
            timestamp: true,
            footer: { text: body.name },
            url: body.targetId !== '' ? `${Constants.STEAM_PROFILES_URL}${body.targetId}` : ''
        });
    },

    getAlarmRaidAlarmEmbed: function (data, body) {
        return module.exports.getEmbed({
            color: '#00ff40',
            timestamp: true,
            footer: { text: body.name },
            title: data.title,
            description: data.message,
            thumbnail: body.img
        });
    },

    getAlarmEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            color: '#ce412b',
            thumbnail: `attachment://${entity.image}`,
            title: `${entity.name}${grid}`,
            footer: { text: entity.server },
            timestamp: true,
            fields: [
                { name: 'ID', value: `\`${entityId}\``, inline: true },
                { name: 'Message', value: `\`${entity.message}\``, inline: true }]
        });

    },

    getEventEmbed: function (guildId, serverId, text, image) {
        const instance = Client.client.readInstanceFile(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: '#ce412b',
            thumbnail: `attachment://${image}`,
            title: text,
            footer: { text: server.title },
            timestamp: true
        });
    },

    getActionInfoEmbed: function (color, str, footer = null, ephemeral = true) {
        return {
            embeds: [module.exports.getEmbed({
                color: color === 0 ? '#ce412b' : '#ff0040',
                description: `\`\`\`diff\n${(color === 0) ? '+' : '-'} ${str}\n\`\`\``,
                footer: footer !== null ? { text: footer } : null,
                ephemeral: ephemeral
            })]
        };
    },

    getServerChangedStateEmbed: function (guildId, serverId, state) {
        const instance = Client.client.readInstanceFile(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: state ? '#ff0040' : '#00ff40',
            title: `Server just went ${state ? 'offline' : 'online'}.`,
            thumbnail: server.img,
            timestamp: true,
            footer: { text: server.title }
        });
    },

    getServerWipeDetectedEmbed: function (guildId, serverId) {
        const instance = Client.client.readInstanceFile(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: '#ce412b',
            title: 'Wipe detected!',
            image: `attachment://${guildId}_map_full.png`,
            timestamp: true,
            footer: { text: server.title }
        });
    },

    getServerConnectionInvalidEmbed: function (guildId, serverId) {
        const instance = Client.client.readInstanceFile(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: '#ff0040',
            title: 'The connection to the server seems to be invalid. Try to re-pair to the server.',
            thumbnail: server.img,
            timestamp: true,
            footer: { text: server.title }
        });
    },

    getActivityNotificationEmbed: function (guildId, serverId, color, text, steamId, png) {
        const instance = Client.client.readInstanceFile(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: color,
            timestamp: true,
            footer: { text: server.title },
            author: {
                name: text,
                iconURL: (png !== null) ? png : Constants.DEFAULT_SERVER_IMG,
                url: `${Constants.STEAM_PROFILES_URL}${steamId}`
            }
        });
    },

    getUpdateServerInformationEmbed: function (rustplus) {
        const instance = Client.client.readInstanceFile(rustplus.guildId);

        const time = rustplus.getCommandTime(true);
        const timeLeftTitle = `Time till ` +
            `${rustplus.time.isDay() ? `${Constants.NIGHT_EMOJI}` : `${Constants.DAY_EMOJI}`}`;

        const embed = module.exports.getEmbed({
            title: 'Server Information',
            color: '#ce412b',
            thumbnail: 'attachment://server_info_logo.png',
            description: rustplus.info.name,
            fields: [
                { name: 'Players', value: `\`${rustplus.getCommandPop(true)}\``, inline: true },
                { name: 'Time', value: `\`${time[0]}\``, inline: true },
                { name: 'Wipe', value: `\`${rustplus.getCommandWipe(true)}\``, inline: true }]
        });

        if (time[1] !== null) {
            embed.addFields(
                { name: timeLeftTitle, value: `\`${time[1]}\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '\u200B', value: '\u200B', inline: true });
        }
        else {
            embed.addFields({ name: '\u200B', value: '\u200B', inline: false });
        }

        embed.addFields(
            { name: 'Map Size', value: `\`${rustplus.info.mapSize}\``, inline: true },
            { name: 'Map Seed', value: `\`${rustplus.info.seed}\``, inline: true },
            { name: 'Map Salt', value: `\`${rustplus.info.salt}\``, inline: true },
            { name: 'Map', value: `\`${rustplus.info.map}\``, inline: true });

        if (instance.serverList[rustplus.serverId].connect !== null) {
            embed.addFields({
                name: 'Connect',
                value: `\`${instance.serverList[rustplus.serverId].connect}\``,
                inline: false
            });
        }

        return embed;
    },

    getUpdateEventInformationEmbed: function (rustplus) {
        const instance = Client.client.readInstanceFile(rustplus.guildId);

        const cargoShipMessage = rustplus.getCommandCargo(true);
        const patrolHelicopterMessage = rustplus.getCommandHeli(true);
        const bradleyAPCMessage = rustplus.getCommandBradley(true);
        const smallOilMessage = rustplus.getCommandSmall(true);
        const largeOilMessage = rustplus.getCommandLarge(true);
        const ch47Message = rustplus.getCommandChinook(true);
        const crateMessage = rustplus.getCommandCrate(true);

        return module.exports.getEmbed({
            title: 'Event Information',
            color: '#ce412b',
            thumbnail: 'attachment://event_info_logo.png',
            description: 'In-game event information',
            footer: { text: instance.serverList[rustplus.serverId].title },
            fields: [
                { name: 'Cargoship', value: `\`${cargoShipMessage}\``, inline: true },
                { name: 'Patrol Helicopter', value: `\`${patrolHelicopterMessage}\``, inline: true },
                { name: 'Bradley APC', value: `\`${bradleyAPCMessage}\``, inline: true },
                { name: 'Small Oil Rig', value: `\`${smallOilMessage}\``, inline: true },
                { name: 'Large Oil Rig', value: `\`${largeOilMessage}\``, inline: true },
                { name: 'Chinook 47', value: `\`${ch47Message}\``, inline: true },
                { name: 'Crate', value: `\`${crateMessage}\``, inline: true }]
        });
    },

    getUpdateTeamInformationEmbed: function (rustplus) {
        const instance = Client.client.readInstanceFile(rustplus.guildId);

        let names = '';
        let status = '';
        let locations = '';
        for (const player of rustplus.team.players) {
            if (rustplus.team.teamSize < 12) {
                names += `[${player.name}](${Constants.STEAM_PROFILES_URL}${player.steamId})`;
            }
            else {
                names += `${player.name}`;
            }

            names += (player.teamLeader) ? `${Constants.LEADER_EMOJI}\n` : '\n';
            locations += (player.isOnline || player.isAlive) ? `${player.pos.string}\n` : '-\n';

            if (player.isOnline) {
                status += (player.getAfkSeconds() >= Constants.AFK_TIME_SECONDS) ?
                    `${Constants.AFK_EMOJI}${(player.isAlive) ? Constants.SLEEPING_EMOJI : Constants.DEAD_EMOJI} ${player.getAfkTime('dhs')}\n` :
                    `${Constants.ONLINE_EMOJI}${(player.isAlive) ? Constants.ALIVE_EMOJI : Constants.DEAD_EMOJI}\n`;
            }
            else {
                status += `${Constants.OFFLINE_EMOJI}${(player.isAlive) ? Constants.SLEEPING_EMOJI : Constants.DEAD_EMOJI}\n`;
            }
        }

        return module.exports.getEmbed({
            title: 'Team Member Information',
            color: '#ce412b',
            thumbnail: 'attachment://team_info_logo.png',
            footer: { text: instance.serverList[rustplus.serverId].title },
            fields: [
                { name: 'Team Member', value: names, inline: true },
                { name: 'Status', value: status, inline: true },
                { name: 'Location', value: locations, inline: true }]
        });
    },
}