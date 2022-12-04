const { SlashCommandBuilder } = require('discord.js');

const queueHandler = require('../utils/queue-handler');
const logger = require('../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove song at given position from the queue')
		.addNumberOption(option => {
			return option.setName('position')
				.setDescription('Position to be removed')
				.setRequired(true)
				.setMinValue(1);
		}),
	async execute(interaction) {
		const position = interaction.options.getNumber('position');
		await remove(interaction, position);
	},
};

const remove = (interaction, position) => {
	logger.debug('Attempt deleting from queue');
	const queue = queueHandler.getQueue(interaction.guildId);

	if (queue?.playing) {
		if (position > 0 && position <= queue.songs.length) {
			const deleted = queue.songs.splice(position - 1, 1);
			logger.debug(`Deleted song on ${interaction.guild.name}`);

			interaction.editReply({
				content: `Song ${deleted[0].title} removed successfully.`,
				fetchReply: true,
			});
			return;
		}
	}

	logger.debug(`Song doesn't exist at position ${position}`);
	interaction.editReply({
		content: 'Nothing is playing!',
		fetchReply: true,
		ephemeral: true,
	});
};