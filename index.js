require('dotenv').config();

const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const path = require('node:path');
const fileSystem = require('node:fs');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
	],
});

client.commands = new Collection();

// Parse commands from directory 'commands'
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fileSystem.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute in command') {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING]: The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

/**
 * When bot has started, send a message to console
 */
client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity('DwarfBot, now ready to play music!');
});

/**
 * Discordjs v14 slash command event listener
 */
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await interaction.deferReply();
		await command.execute(interaction);
	} catch (e) {
		console.error(e);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(process.env.DISCORD_TOKEN);