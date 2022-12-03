require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');

if (!process.env.DISCORD_TOKEN) {
	throw 'DISCORD_TOKEN not defined';
}
if (!process.env.BOT_ID) {
	throw 'BOT_ID not defined';
}

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const deployTestServer = async () => {
	try {
		console.log(`TestServer: Started refreshing ${commands.length} application slashcommands.`);

		if (!process.env.SERVER_ID) {
			throw 'SERVER_ID not defined. Did you try to publish commands globally? (--global)';
		}
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.BOT_ID, process.env.SERVER_ID),
			{ body: commands },
		);

		console.log(`TestServer: Successfully reloaded ${data.length} application slashcommands.`);
	} catch (error) {
		console.error(error);
	}
};

const deployGlobal = async () => {
	try {
		console.log(`Global: Started refreshing ${commands.length} application slashcommands.`);

		const data = await rest.put(
			Routes.applicationCommands(process.env.BOT_ID),
			{ body: commands },
		);

		console.log(`Global: Successfully reloaded ${data.length} application slashcommands.`);
	} catch (error) {
		console.error(error);
	}
};

const args = process.argv.slice(2);
let i = 0;
do {
	switch (args[i]) {
		case '-g':
		case '--global':
			deployGlobal();
			break;
		default:
			deployTestServer();
			break;
	}
	i++;
} while (i < args.length);
