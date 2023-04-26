const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const fs = require('fs');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const request = require('request');

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
          const request = require('request');
          const formData = {
            sample: {
              value: Buffer.from(result.audioData),
              options: {
                filename: 'output.wav',
                contentType: 'audio/wav'
              }
            },
            fPitchChange: '1',
            sampleRate: '44100'
          };
          const options = {
            url: 'http://121.41.44.246:7860/voiceChangeModel',
            formData: formData,
            headers: { Authorization: process.env.AUTH },
          };
          request.post(options, async (error, response, body) => {
            resolve(Buffer.from(body));
          });
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
    const filename = 'output.wav';
    const { promisify } = require('util');
    await promisify(fs.createWriteStream(filename)).write(buffer);

    const fileStream = createReadStream(filename);

    await interaction.editReply({
      files: [{
        attachment: fileStream,
        name: fileName
      }]
    });
  }
}
