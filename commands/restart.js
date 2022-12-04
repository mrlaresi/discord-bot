const { SlashCommandBuilder } = require('discord.js');

const queueHandler = require('../utils/queue-handler');
const logger = require('../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('restart')
		.setDescription('Restart the currently playing song'),
	async execute(interaction) {
		await restart(interaction);
	},
};

const restart = (interaction) => {
	logger.debug('Attempt restarting audio');
	const queue = queueHandler.getQueue(interaction.guildId);

	if (queue?.playing) {
		logger.debug(`Restarting currently playing song on ${interaction.guild.name}`);
		queue.songs.unshift(queue.songs[0]);
		queue.audioPlayer.stop();
		interaction.editReply({
			content: `Restarting song ${queue.songs[0].title}`,
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
