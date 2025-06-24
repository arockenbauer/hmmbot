import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Logger } from './logger.js';

export class ModerationUtils {
  static async ban(interaction, user, reason, deleteMessages = false) {
    try {
      // Vérifier si l'interaction a déjà été répondue
      if (interaction.replied || interaction.deferred) return;
      
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      
      // Vérifier si le bot a les permissions nécessaires
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        return await interaction.reply({ content: '❌ Je n\'ai pas la permission de bannir des membres !', ephemeral: true });
      }
      
      // Vérifier les permissions de hiérarchie pour le bot
      if (member) {
        if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
          return await interaction.reply({ content: '❌ Je ne peux pas bannir ce membre (son rôle est supérieur ou égal au mien).', ephemeral: true });
        }
        
        if (member.id === interaction.guild.ownerId) {
          return await interaction.reply({ content: '❌ Je ne peux pas bannir le propriétaire du serveur !', ephemeral: true });
        }
        
        // Vérifier les permissions de hiérarchie pour l'utilisateur
        if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.member.id !== interaction.guild.ownerId) {
          return await interaction.reply({ content: '❌ Vous ne pouvez pas bannir ce membre (rôle supérieur ou égal).', ephemeral: true });
        }
      }
      
      // Envoyer un MP à l'utilisateur avant le ban
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('🔨 Vous avez été banni')
          .setDescription(`Vous avez été banni du serveur **${interaction.guild.name}**`)
          .addFields(
            { name: 'Raison', value: reason || 'Aucune raison fournie', inline: false },
            { name: 'Modérateur', value: interaction.user.tag, inline: true }
          )
          .setColor('#ff0000')
          .setTimestamp();
        
        await user.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log('Impossible d\'envoyer un MP à l\'utilisateur banni');
      }
      
      // Bannir l'utilisateur
      await interaction.guild.members.ban(user, {
        reason: `${reason || 'Aucune raison fournie'} - Par ${interaction.user.tag}`,
        deleteMessageSeconds: deleteMessages ? 7 * 24 * 60 * 60 : 0 // 7 jours si deleteMessages = true
      });
      
      // Répondre à l'interaction
      const embed = new EmbedBuilder()
        .setTitle('🔨 Membre banni')
        .setDescription(`**${user.tag}** a été banni du serveur`)
        .addFields(
          { name: 'Raison', value: reason || 'Aucune raison fournie', inline: false },
          { name: 'Modérateur', value: interaction.user.tag, inline: true }
        )
        .setColor('#ff0000')
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
      // Logger l'action
      await Logger.log(interaction.client, 'MODERATION', {
        action: 'Ban',
        moderator: interaction.user.tag,
        target: user.tag,
        reason: reason || 'Aucune raison fournie'
      });
      
    } catch (error) {
      console.error('Erreur lors du ban:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Une erreur est survenue lors du bannissement.', ephemeral: true });
      }
    }
  }

  static async kick(interaction, member, reason) {
    try {
      if (interaction.replied || interaction.deferred) return;
      
      // Vérifier les permissions du bot
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
        return await interaction.reply({ content: '❌ Je n\'ai pas la permission d\'expulser des membres !', ephemeral: true });
      }
      
      // Vérifications de hiérarchie
      if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        return await interaction.reply({ content: '❌ Je ne peux pas expulser ce membre (rôle supérieur ou égal).', ephemeral: true });
      }
      
      if (member.id === interaction.guild.ownerId) {
        return await interaction.reply({ content: '❌ Je ne peux pas expulser le propriétaire du serveur !', ephemeral: true });
      }
      
      if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.member.id !== interaction.guild.ownerId) {
        return await interaction.reply({ content: '❌ Vous ne pouvez pas expulser ce membre (rôle supérieur ou égal).', ephemeral: true });
      }
      
      // Envoyer un MP
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('👢 Vous avez été expulsé')
          .setDescription(`Vous avez été expulsé du serveur **${interaction.guild.name}**`)
          .addFields(
            { name: 'Raison', value: reason || 'Aucune raison fournie', inline: false },
            { name: 'Modérateur', value: interaction.user.tag, inline: true }
          )
          .setColor('#ff9500')
          .setTimestamp();
        
        await member.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log('Impossible d\'envoyer un MP au membre expulsé');
      }
      
      // Expulser le membre
      await member.kick(`${reason || 'Aucune raison fournie'} - Par ${interaction.user.tag}`);
      
      // Répondre
      const embed = new EmbedBuilder()
        .setTitle('👢 Membre expulsé')
        .setDescription(`**${member.user.tag}** a été expulsé du serveur`)
        .addFields(
          { name: 'Raison', value: reason || 'Aucune raison fournie', inline: false },
          { name: 'Modérateur', value: interaction.user.tag, inline: true }
        )
        .setColor('#ff9500')
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
      // Logger
      await Logger.log(interaction.client, 'MODERATION', {
        action: 'Kick',
        moderator: interaction.user.tag,
        target: member.user.tag,
        reason: reason || 'Aucune raison fournie'
      });
      
    } catch (error) {
      console.error('Erreur lors du kick:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'expulsion.', ephemeral: true });
      }
    }
  }

  static async timeout(interaction, member, duration, reason) {
    try {
      if (interaction.replied || interaction.deferred) return;
      
      // Vérifier les permissions
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return await interaction.reply({ content: '❌ Je n\'ai pas la permission de mettre en timeout !', ephemeral: true });
      }
      
      // Vérifications de hiérarchie
      if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        return await interaction.reply({ content: '❌ Je ne peux pas timeout ce membre (rôle supérieur ou égal).', ephemeral: true });
      }
      
      if (member.id === interaction.guild.ownerId) {
        return await interaction.reply({ content: '❌ Je ne peux pas timeout le propriétaire du serveur !', ephemeral: true });
      }
      
      if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.member.id !== interaction.guild.ownerId) {
        return await interaction.reply({ content: '❌ Vous ne pouvez pas timeout ce membre (rôle supérieur ou égal).', ephemeral: true });
      }
      
      // Convertir la durée
      const timeoutDuration = this.parseDuration(duration);
      if (!timeoutDuration) {
        return await interaction.reply({ content: '❌ Format de durée invalide ! Utilisez: 10m, 1h, 1d', ephemeral: true });
      }
      
      // Envoyer un MP
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('🔇 Vous avez été mis en timeout')
          .setDescription(`Vous avez été mis en timeout sur le serveur **${interaction.guild.name}**`)
          .addFields(
            { name: 'Durée', value: duration, inline: true },
            { name: 'Raison', value: reason || 'Aucune raison fournie', inline: false },
            { name: 'Modérateur', value: interaction.user.tag, inline: true }
          )
          .setColor('#ffaa00')
          .setTimestamp();
        
        await member.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log('Impossible d\'envoyer un MP au membre timeout');
      }
      
      // Appliquer le timeout
      await member.timeout(timeoutDuration, `${reason || 'Aucune raison fournie'} - Par ${interaction.user.tag}`);
      
      // Répondre
      const embed = new EmbedBuilder()
        .setTitle('🔇 Membre mis en timeout')
        .setDescription(`**${member.user.tag}** a été mis en timeout`)
        .addFields(
          { name: 'Durée', value: duration, inline: true },
          { name: 'Raison', value: reason || 'Aucune raison fournie', inline: false },
          { name: 'Modérateur', value: interaction.user.tag, inline: true }
        )
        .setColor('#ffaa00')
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
      // Logger
      await Logger.log(interaction.client, 'MODERATION', {
        action: 'Timeout',
        moderator: interaction.user.tag,
        target: member.user.tag,
        reason: reason || 'Aucune raison fournie',
        duration: duration
      });
      
    } catch (error) {
      console.error('Erreur lors du timeout:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Une erreur est survenue lors du timeout.', ephemeral: true });
      }
    }
  }

  static parseDuration(duration) {
    const regex = /^(\d+)([smhd])$/;
    const match = duration.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return null;
    }
  }

  static formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}j ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}