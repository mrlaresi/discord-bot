const { SlashCommandBuilder } = require('discord.js');

const queueHandler = require('../utils/queue-handler');
const logger = require('../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the song playing currently'),
	async execute(interaction) {
		await skip(interaction);
	},
};

/**
 * Skips the currently playing song
 * @param interaction message sent by the user
 */
const skip = (interaction) => {
	logger.debug('Attempt skipping audio');
	const queue = queueHandler.getQueue(interaction.guildId);
	if (queue?.playing) {
		queue.audioPlayer.stop(true);
		logger.debug(`Skipping currently playing song on ${interaction.guild.name}`);
		interaction.editReply({
			content: 'Skipping current song.',
			fetchReply: true,
		});
		return;
	}

	logger.debug('Nothing was playing.');
	interaction.editReply({
		content: 'Nothing is playing!',
		fetchReply: true,
		ephemeral: true,
	});
};