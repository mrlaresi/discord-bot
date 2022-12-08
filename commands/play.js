const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus, createAudioResource, createAudioPlayer } = require('@discordjs/voice');
const playdl = require('play-dl');

const ytHandler = require('../utils/youtube-handler');
const queueHandler = require('../utils/queue-handler');
const connectionHandler = require('../utils/connection-handler');
const logger = require('../utils/logger');

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

	let queue;
	try {
		queue = queueHandler.getQueue(interaction.guildId);
		if (queue && !queue.playing) {
			connectionHandler.interruptDisconnection(interaction.guildId);
		}

		let song;
		if (query.startsWith('http')) {
			song = await ytHandler.getVideoInfo(query);
		} else {
			song = await ytHandler.searchString(query);
		}

		logger.debug(`Found song '${song.title}' at ${song.url}`);

		queue = queueHandler.addToQueue(interaction, song);

		logger.debug(`Song added to queue in ${interaction.guild.name}`);
		interaction.editReply({
			content: `'${song.title}' has been added to the queue. (Position: ${queue.songs.length})`,
			fetchReply: true,
		});

		if (!queue.playing) {
			connectionHandler.interruptDisconnection(queue);
			if (!queue.audioPlayer) {
				setupAudioPlayer(queue);
			}
			// Start playback if nothing playing
			play(queue, queue.songs[0]);
		}
	} catch (error) {
		logger.error('Unable to find video:');
		logger.error(`${error}`);
		queueHandler.delete(interaction.guild.id);
		queue?.channel.send(`Unable to find a video with argument: ${query}`);
	}
};


/**
 * Plays the next song in the queue
 * @param queue necessary information associated with the server
 * @param song requested song
 */
const play = async (queue, song) => {
	logger.debug('Entering play function.');

	logger.debug(`Initializing playback for '${song.title}'`);
	const stream = await playdl.stream(song.url, {
		discordPlayerCompatibility: true,
	});
	const audioResource = createAudioResource(stream.stream,
		{ inlineVolume: true },
	);

	queue.audioPlayer.play(audioResource);
	queue.playing = true;
	audioResource.volume.setVolume(0.2);

	logger.debug(`Playback of ${song.title} started in ${queue.textChannel.guild.name}`);
	queue.textChannel.send(`Now playing: ${song.title}\n${song.thumbnail}`);
};


const setupAudioPlayer = (queue) => {
	logger.debug('Setting up AudioPlayer.');
	queue.audioPlayer = createAudioPlayer();
	if (!queue.connection) {
		connectionHandler.joinVoice(queue);
	}
	queue.connection.subscribe(queue.audioPlayer);

	queue.audioPlayer
		.on(AudioPlayerStatus.Idle, () => {
			logger.debug('Entering onIdle handler');
			queue.songs.shift();
			/* for (const msg of queue.botMessages) {
				msg.delete();
			}
			queue.botMessages = [];*/
			if (queue.songs.length === 0) {
				connectionHandler.startTimedDisconnect(queue);
				return;
			}
			play(queue, queue.songs[0]);
		})
		.on('error', (error) => {
			logger.debug(`AudioPlayer errored: ${error}`);
		});
};

