const { SlashCommandBuilder } = require('discord.js');

const queueHandler = require('../utils/queue-handler');
const logger = require('../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stop playback of songs and clear queue'),
	async execute(interaction) {
		await stop(interaction);
	},
};

/**
 * Skips the currently playing song and clears queue
 * @param msg message sent by the user
 */
const stop = async (interaction) => {
	logger.debug('Attempt stopping audio');
	const queue = queueHandler.getQueue(interaction.guildId);
	if (queue?.playing) {
		queue.songs = [];
		queue.audioPlayer.stop(true);
		logger.debug(`Stopping playback and clearing queue on ${interaction.guild.name}`);
		interaction.editReply({
			content: 'Stopping audio.',
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