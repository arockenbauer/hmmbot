import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { Config } from '../utils/config.js';

export const data = new SlashCommandBuilder()
    .setName('fun')
    .setDescription('Commandes amusantes')
    .addSubcommand(subcommand =>
        subcommand
            .setName('gif')
            .setDescription('Rechercher un GIF avec Tenor')
            .addStringOption(option =>
                option
                    .setName('query')
                    .setDescription('Terme de recherche pour le GIF')
                    .setRequired(true)
                    .setMaxLength(100)
            )
            .addIntegerOption(option =>
                option
                    .setName('limit')
                    .setDescription('Nombre de résultats (1-10)')
                    .setMinValue(1)
                    .setMaxValue(10)
            )
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'gif') {
        await handleGifCommand(interaction);
    }
}

async function handleGifCommand(interaction) {
    const query = interaction.options.getString('query');
    const limit = interaction.options.getInteger('limit') || 1;

    // Vérifier si la clé API Tenor est configurée
    if (!process.env.TENOR_API_KEY) {
        return interaction.reply({
            content: '❌ La clé API Tenor n\'est pas configurée. Contactez un administrateur.',
            ephemeral: true
        });
    }

    await interaction.deferReply();

    try {
        // Nettoyer la requête de recherche
        const cleanQuery = query.trim().replace(/[^\w\s-]/g, '').substring(0, 100);
        
        if (!cleanQuery) {
            return interaction.editReply({
                content: '❌ Terme de recherche invalide. Veuillez utiliser uniquement des lettres, chiffres et espaces.'
            });
        }

        // Construire l'URL de l'API Tenor
        const apiUrl = new URL('https://tenor.googleapis.com/v2/search');
        apiUrl.searchParams.set('q', cleanQuery);
        apiUrl.searchParams.set('key', process.env.TENOR_API_KEY);
        apiUrl.searchParams.set('limit', limit.toString());
        apiUrl.searchParams.set('media_filter', 'gif');
        apiUrl.searchParams.set('contentfilter', 'medium'); // Filtre de contenu modéré
        apiUrl.searchParams.set('ar_range', 'standard'); // Ratio d'aspect standard

        // Faire la requête à l'API Tenor
        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'User-Agent': `${Config.get('bot.name')}/${Config.get('bot.version')} (Discord Bot)`
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur API Tenor: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Vérifier s'il y a des résultats
        if (!data.results || data.results.length === 0) {
            return interaction.editReply({
                content: `🔍 Aucun GIF trouvé pour "${query}". Essayez avec d'autres termes de recherche.`
            });
        }

        // Si un seul résultat demandé, l'afficher directement
        if (limit === 1) {
            const gif = data.results[0];
            const embed = new EmbedBuilder()
                .setTitle(`🎬 GIF: ${query}`)
                .setImage(gif.media_formats?.gif?.url || gif.url)
                .setColor('#ff6b6b')
                .setFooter({
                    text: `Via Tenor | ${gif.content_description || 'GIF animé'}`,
                    iconURL: 'https://tenor.com/favicon.ico'
                })
                .setTimestamp();

            // Ajouter l'URL du GIF si disponible
            if (gif.itemurl) {
                embed.setURL(gif.itemurl);
            }

            return interaction.editReply({ embeds: [embed] });
        }

        // Si plusieurs résultats, créer un embed avec plusieurs GIFs
        const embed = new EmbedBuilder()
            .setTitle(`🎬 Résultats GIF pour: ${query}`)
            .setDescription(`${data.results.length} GIF${data.results.length > 1 ? 's' : ''} trouvé${data.results.length > 1 ? 's' : ''} :`)
            .setColor('#ff6b6b')
            .setFooter({
                text: 'Via Tenor',
                iconURL: 'https://tenor.com/favicon.ico'
            })
            .setTimestamp();

        // Ajouter les GIFs comme champs
        data.results.forEach((gif, index) => {
            embed.addFields({
                name: `GIF ${index + 1}`,
                value: `[${gif.content_description || 'GIF animé'}](${gif.itemurl || gif.media_formats?.gif?.url || gif.url})`,
                inline: true
            });
        });

        // Afficher le premier GIF comme image principale
        embed.setImage(data.results[0].media_formats?.gif?.url || data.results[0].url);

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur lors de la recherche de GIF:', error);
        
        await interaction.editReply({
            content: '❌ Une erreur est survenue lors de la recherche de GIF. Veuillez réessayer plus tard.'
        });
    }
}