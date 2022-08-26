const Discord = require('discord.js');

const Client = require('../../index.js');
const TextInput = require('./discordTextInputs.js');

module.exports = {
    getModal: function (options = {}) {
        const modal = new Discord.ModalBuilder();

        if (options.customId) modal.setCustomId(options.customId);
        if (options.title) modal.setTitle(options.title);

        return modal;
    },

    getEditSmartSwitchModal(guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        const modal = module.exports.getModal({
            customId: `SmartSwitchEditId${id}`,
            title: `Editing of ${instance.switches[id].name}`
        });

        const nameInput = TextInput.getTextInput({
            customId: 'SmartSwitchName',
            label: 'The name of the Smart Switch:',
            value: instance.switches[id].name,
            style: Discord.TextInputStyle.Short
        });

        const commandInput = TextInput.getTextInput({
            customId: 'SmartSwitchCommand',
            label: 'The custom command for the Smart Switch:',
            value: instance.switches[id].command,
            style: Discord.TextInputStyle.Short
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(nameInput),
            new Discord.ActionRowBuilder().addComponents(commandInput)
        );

        return modal;
    },
}