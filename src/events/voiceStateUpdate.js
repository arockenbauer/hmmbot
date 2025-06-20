import { Logger } from '../utils/logger.js';
import { VoiceTracker } from '../utils/voiceTracker.js';

export const name = 'voiceStateUpdate';
export const once = false;

export async function execute(oldState, newState) {
  const member = newState.member;
  if (!member || member.user.bot) return;

  // Membre rejoint un salon vocal
  if (!oldState.channel && newState.channel) {
    VoiceTracker.onVoiceJoin(member, newState.channel);
    
    await Logger.log(member.client, 'VOICE_JOIN', {
      member: member,
      channel: newState.channel.name
    });
  }
  
  // Membre quitte un salon vocal
  else if (oldState.channel && !newState.channel) {
    VoiceTracker.onVoiceLeave(member);
    
    await Logger.log(member.client, 'VOICE_LEAVE', {
      member: member,
      channel: oldState.channel.name
    });
  }
  
  // Membre change de salon vocal
  else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    VoiceTracker.onVoiceSwitch(member, oldState.channel, newState.channel);
    
    await Logger.log(member.client, 'VOICE_SWITCH', {
      member: member,
      oldChannel: oldState.channel.name,
      newChannel: newState.channel.name
    });
  }
}