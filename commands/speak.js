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

        // 将文本转换为语音
        synthesizer.speakTextAsync(
            text,
            (result) => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log(`Speech synthesized: ${result.audioData.length} bytes`);

                    // 将语音数据作为此API的输入，通过HTTP POST请求将其发送到API
                    // 请注意，这里只是提供了一个示例URL，您需要根据实际情况替换URL。
                    const options = {
                        url: 'http://121.41.44.246:7860/voiceChangeModel',
                        formData: {
                            sample: {
                                value: result.audioData,
                                options: {
                                    filename: 'output.wav',
                                    contentType: 'audio/wav'
                                }
                            },
                            fPitchChange: '1',
                            sampleRate: '44100'
                        }
                    };
                    request.post(options, async (error, response, body) => {
                        if (error) {
                            console.error(error);
                            await interaction.editReply('发生错误，请稍后重试。');
                            return;
                        }

                        const audioBuffer = Buffer.from(body);
                        const buff = [];
                        buff.push(audioBuffer);
                        await interaction.editReply({ files: buff });
                    });
                }
            },
            (error) => {
                console.error(error);
                synthesizer.close();
            }
        );
    }
}
