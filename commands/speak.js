const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const fs = require('fs');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const request = require('request');

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

        // 设置语音转换器的配置
        const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);

        // 创建语音合成器
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

        synthesizer.speakTextAsync(
            text,
            result => {
                synthesizer.close();
                const request = require('request');
                const options = {
                    url: 'http://121.41.44.246:7860/voiceChangeModel',
                    formData: {
                        sample: Buffer.from(result.audioData),
                        fPitchChange: '1',
                        sampleRate: '44100'
                    }
                };
                request.post(options, async (error, response, body) => {
                    let buff =[];
                    buff.push(Buffer.from(body))
                    console.log(body);
                    await interaction.editReply({files: buff});
                });
            },
            error => {
                console.log(error);
                synthesizer.close();
            });
    }
}
