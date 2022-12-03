const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus, createAudioResource } = require('@discordjs/voice');

const ytHandler = require('../utils/youtube-handler');
const queueHandler = require('../utils/queue-handler');
const connectionHandler = require('../utils/connection-handler');
const playdl = require('play-dl');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play song from youtube')
		.addStringOption(option => {
			return option.setName('query')
				.setDescription('The query string or url path of the video')
				.setRequired(true);
		}),
	async execute(interaction) {
		const query = interaction.options.getString('query');
		await handleSong(query, interaction);
	},
};


/**
 * Handles song requests made by users
 * @param query message sent by the user
 * @param interaction interaction object
 */
const handleSong = async (query, interaction) => {
	// if (!verify(msg)) return;

	try {
		let song;
		if (query.startsWith('http')) {
			song = await ytHandler.getVideoInfo(query);
		} else {
			song = await ytHandler.searchString(query);
		}


		// verbose(`Found address for query: ${url}`);

		// verbose(`Song found successfully from Youtube`);
		const queue = queueHandler.addToQueue(interaction, song);

		interaction.editReply({
			content: `'${song.title}' has been added to the queue. (Position: ${queue.songs.length})`,
			fetchReply: true,
		});

		if (!queue.playing) {
			if (!queue.audioPlayer) {
				setupAudioPlayer(queue, interaction);
			}
			play(queue, queue.songs[0]);
		}
		// msg.channel.send();
	} catch (error) {
		// verbose(`Unable to find video:`);
		// verbose(`${error}`);
		// queue.delete(msg.guild.id);
		// console.log(error);
		// msg.channel.send(`Unable to find a video with argument: ${msg.content.slice(5)}`);
	}
};


/**
 * Plays the next song in the queue
 * @param queue necessary information associated with the server
 * @param song requested song
 */
const play = async (queue, song) => {
	// verbose("Entering play function.")

	// verbose(`Playing song: ${song.title}`);
	const stream = await playdl.stream(song.url, {
		discordPlayerCompatibility: true,
	});
	const audioResource = createAudioResource(stream.stream,
		{ inlineVolume: true },
	);

	queue.audioPlayer.play(audioResource);
	audioResource.volume.setVolume(0.2);

	// verbose("playback starting")
	queue.textChannel.send(song.thumbnail);
	queue.textChannel.send(`Now playing: ${song.title}`);
};


const setupAudioPlayer = (queue, interaction) => {
	// verbose("Setting up AudioPlayer.")

	queue.audioPlayer
		.on(AudioPlayerStatus.Idle, () => {
			queue.songs.shift();
			for (const msg of queue.botMessages) {
				msg.delete();
			}
			queue.botMessages = [];
			if (queue.songs.length === 0) {
				connectionHandler.startTimedDisconnect(
					interaction.guildId,
					() => disconnectCallback(queue, interaction),
				);
				return;
			}
			play(queue, queue.songs[0]);
		})
		.on('error', (error) => {
			// verbose(error);
		});
};

const disconnectCallback = (queue, interaction) => {
	queue.audioPlayer.stop();
	queue.connection.disconnect();
	queueHandler.deleteQueue(interaction.guildId);
	// verbose("Disconnected.");
};
