let _verbose = false;
const setVerbose = () => {
	_verbose = true;
};

const debug = (message) => {
	if (_verbose) {
		console.log('DEBUG: ' + message);
	}
};

const info = (message) => {
	console.log('INFO: ' + message);
};

const warn = (message) => {
	console.log('WARNING: ' + message);
};

const error = (message) => {
	console.error('ERROR: ' + message);
};

module.exports = {
	setVerbose,
	debug,
	info,
	warn,
	error,
};