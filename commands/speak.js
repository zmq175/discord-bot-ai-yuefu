const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const fs = require('fs');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const request = require('request');
const axios = require('axios');

async function speakAndChangeVoice(text) {
  const { AudioConfig, SpeechSynthesizer, ResultReason } = require('microsoft-cognitiveservices-speech-sdk');
  const config = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
  config.speechSynthesisLanguage = 'zh-CN';
  const synthesizer = new SpeechSynthesizer(config, AudioConfig.fromAudioFileOutput('./output.wav'));

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      async (result) => {
        if (result.reason === ResultReason.SynthesizingAudioCompleted) {
          console.log(result.audioData.byteLength);
          
          const axios = require('axios');
          const FormData = require('form-data');
          const form = new FormData();
          form.append('sample', Buffer.from(result.audioData), {
            filename: 'output.wav',
            contentType: 'audio/wav'
          });
          form.append('fPitchChange', '1');
          form.append('sampleRate', '44100');
          
          const headers = {
            "Content-Type": `multipart/form-data; boundary=${form._boundary}`,
            Authorization: process.env.AUTH
          }
          
          try {
            const response = await axios.post('http://121.41.44.246:7860/voiceChangeModel', form, { headers });
            resolve( new Blob([response], {
              type: 'audio/wav'
          }));
          } catch (error) {
            reject(error);
          }
        }
        synthesizer.close();
      },
      (error) => {
        reject(error);
        synthesizer.close();
      }
    );
  });
}


module.exports = {
  data: new SlashCommandBuilder()
    .setName('speak')
    .setDescription('让乐府说话')
    .addStringOption(option => option
      .setName('text')
      .setDescription('要说什么')
      .setRequired(true)),
  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    const text = interaction.options.getString('text');
    const message = await interaction.deferReply({
      fetchReply: true
    });

    const buffer = await speakAndChangeVoice(text);
  
    await interaction.editReply({
      files: Buffer.from(await buffer.arrayBuffer())
    });
  }
}
