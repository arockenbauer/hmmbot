import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { TicketManager } from '../utils/ticket.js';
import { TicketStorage } from '../utils/ticketStorage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ticketManager = new TicketManager();
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const data = new SlashCommandBuilder()
    .setName('closeticket')
    .setDescription('Ferme le ticket actuel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false);

/**
 * Generate an HTML transcript of the ticket
 * @param {import('discord.js').TextChannel} channel 
 * @returns {Promise<string>}
 */
async function generateTranscript(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const sorted = Array.from(messages.values())
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        let html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset='utf-8'>
    <title>Transcript du ticket ${channel.name}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h2 { color: #2c3e50; }
        ul { list-style-type: none; padding: 0; }
        li { margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; }
        .timestamp { color: #7f8c8d; font-size: 0.9em; }
        .author { font-weight: bold; color: #3498db; }
        .content { margin-top: 5px; }
        .system { color: #e74c3c; }
    </style>
</head>
<body>
    <h2>Transcript du ticket ${channel.name}</h2>
    <ul>`;

        for (const msg of sorted) {
            const isSystem = msg.author.bot && msg.author.system;
            html += `
        <li>
            <span class="author${isSystem ? ' system' : ''}">${msg.author.tag}</span>
            <span class="timestamp">[${new Date(msg.createdTimestamp).toLocaleString()}]</span>
            <div class="content">${msg.content || ''}</div>
            ${msg.attachments.size > 0 ? 
                `<div class="attachments">Pièces jointes: ${msg.attachments.map(a => 
                    `<a href="${a.url}" target="_blank">${a.name}</a>`).join(', ')}</div>` : ''}
        </li>`;
        }

        html += `
    </ul>
</body>
</html>`;

        return html;
    } catch (error) {
        console.error('Erreur lors de la génération du transcript:', error);
        throw new Error('Impossible de générer le transcript');
    }
}

/**
 * Save transcript to file with retry mechanism
 * @param {string} transcriptDir 
 * @param {string} transcriptPath 
 * @param {string} html 
 * @returns {Promise<void>}
 */
async function saveTranscriptWithRetry(transcriptDir, transcriptPath, html) {
    let attempts = 0;
    let lastError = null;

    while (attempts < MAX_RETRIES) {
        try {
            await fs.mkdir(transcriptDir, { recursive: true });
            await fs.writeFile(transcriptPath, html);
            return;
        } catch (error) {
            lastError = error;
            attempts++;
            if (attempts < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }

    throw lastError || new Error('Échec de la sauvegarde du transcript après plusieurs tentatives');
}

export async function execute(interaction) {
    if (!interaction.channel || !interaction.channel.isTextBased()) {
        return interaction.reply({ 
            content: 'Cette commande doit être utilisée dans un salon textuel.', 
            ephemeral: true 
        });
    }

    const channel = interaction.channel;
    const config = ticketManager.getTicketConfig();

    // Vérifier si le système de tickets est activé
    if (!config.enabled) {
        return interaction.reply({ 
            content: '❌ Le système de tickets est actuellement désactivé.', 
            ephemeral: true 
        });
    }

    // Vérification que c'est bien un ticket
    if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ 
            content: 'Cette commande ne peut être utilisée que dans un ticket.', 
            ephemeral: true 
        });
    }

    // Vérification des permissions
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({
            content: 'Vous n\'avez pas la permission de fermer ce ticket.',
            ephemeral: true
        });
    }

    try {
        // Répondre immédiatement pour éviter l'erreur "interaction failed"
        await interaction.deferReply({ ephemeral: true });

        // Générer le transcript
        const html = await generateTranscript(channel);
        
        // Chemin de sauvegarde
        const transcriptDir = path.join(__dirname, '..', 'data', 'transcripts');
        const transcriptPath = path.join(transcriptDir, `${channel.id}.html`);
        
        // Sauvegarder avec mécanisme de réessai
        await saveTranscriptWithRetry(transcriptDir, transcriptPath, html);

        // Enregistrer la fermeture dans le stockage
        await TicketStorage.closeTicket(channel.id);

        // Envoyer un message de confirmation
        await interaction.editReply({ 
            content: config.close_message || 'Ticket fermé avec succès. Transcript sauvegardé.' 
        });

        // Supprimer le canal après un court délai
        setTimeout(async () => {
            try {
                await channel.delete('Ticket fermé par commande');
            } catch (deleteError) {
                console.error('Erreur lors de la suppression du canal:', deleteError);
                // Essayer d'envoyer un message à l'utilisateur si possible
                if (!channel.deleted) {
                    await interaction.followUp({
                        content: 'Le ticket a été fermé mais je n\'ai pas pu supprimer le canal. Veuillez le supprimer manuellement.',
                        ephemeral: true
                    }).catch(console.error);
                }
            }
        }, 3000);

    } catch (error) {
        console.error('Erreur lors de la fermeture du ticket:', error);

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ 
                    content: 'Une erreur est survenue lors de la fermeture du ticket. Veuillez réessayer ou contacter un administrateur.' 
                });
            } else {
                await interaction.reply({ 
                    content: 'Une erreur est survenue lors de la fermeture du ticket. Veuillez réessayer ou contacter un administrateur.',
                    ephemeral: true 
                });
            }
        } catch (replyError) {
            console.error('Erreur lors de l\'envoi du message d\'erreur:', replyError);
        }
    }
}