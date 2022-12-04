const ytsr = require('ytsr');
const ytdl = require('ytdl-core');

const logger = require('../utils/logger');

/**
 * Searches Youtube with the text the user inserted, returning the video id
 * for the first result found
 * @param msg string, which the user wrote
 * @returns video id or empty string
 */
const searchString = async msg => {
	logger.debug(`Query ${msg}`);

	// Search only for videos
	const availableFilters = await ytsr.getFilters(msg);
	const queryFilter = availableFilters.get('Type').get('Video');

	const searchResult = await ytsr(queryFilter.url, { safeSearch: false, limit: 10 });

	const songInfo = searchResult.items?.[0];
	return {
		title: songInfo.title,
		url: songInfo.url,
		thumbnail: songInfo.bestThumbnail.url,
		length: songInfo.duration,
	};
};

const getVideoInfo = async url => {
	logger.debug(`Query ${url}`);
	const songInfo = await ytdl.getInfo(url);
	return {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
		thumbnail: songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url,
		length: songInfo.videoDetails.lengthSeconds,
	};
};

module.exports = {
	searchString,
	getVideoInfo,
};
