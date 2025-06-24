import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import { Economy } from '../utils/economy.js'
import { Logger } from '../utils/logger.js'

export const data = new SlashCommandBuilder()
  .setName('work')
  .setDescription('Travaillez pour gagner de l\'argent')

export async function execute(interaction) {
  const userId = interaction.user.id
  
  if (!Economy.canWork(userId)) {
    const timeLeft = Economy.getTimeUntilWork(userId)
    const embed = new EmbedBuilder()
      .setTitle('⏰ Travail')
      .setDescription(`Vous êtes fatigué ! Reposez-vous encore **${timeLeft}**`)
      .setColor('#ff6b6b')
      .setTimestamp()
    
    return await interaction.reply({ embeds: [embed] })
  }

  const result = Economy.work(userId)
  
  const jobs = [
    'Vous avez livré des pizzas',
    'Vous avez promené des chiens',
    'Vous avez fait du jardinage',
    'Vous avez nettoyé des voitures',
    'Vous avez donné des cours particuliers',
    'Vous avez fait de la programmation',
    'Vous avez vendu des objets',
    'Vous avez fait du baby-sitting'
  ]
  
  const randomJob = jobs[Math.floor(Math.random() * jobs.length)]
  
  // Log de la transaction
  await Logger.log(interaction.client, 'ECONOMY', {
    user: interaction.user.tag,
    action: 'Travail',
    amount: result.amount
  })

  let description = `${randomJob} et avez gagné **${Economy.formatMoney(result.amount)}** !\n\n`
  
  if (result.levelBonus) {
    description += `💰 Salaire de base: ${Economy.formatMoney(result.amount - result.levelBonus)}\n`
    description += `⭐ Bonus niveau ${Economy.getUser(userId).level}: ${Economy.formatMoney(result.levelBonus)}\n\n`
  }

  const embed = new EmbedBuilder()
    .setTitle('💼 Travail')
    .setDescription(description)
    .setColor('#50C878')
    .setTimestamp()

  return await interaction.reply({ embeds: [embed] })
}