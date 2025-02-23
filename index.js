"use strict";
var __importDefault = this && this.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : {
        default: mod
    }
};
const ytdl_core_1 = __importDefault(require("radikodl-core")),
    prism_media_1 = require("prism-media"),
    evn = ["info", "progress", "abort", "request", "response", "error", "redirect", "retry", "reconnect"],
    StreamDownloader = (url, token, options) => {
        if (!url) throw new Error("No input url provided");
        if ("string" != typeof url) throw new SyntaxError(`input URL must be a string. Received ${typeof url}!`);
        null != options || (options = {});
        let FFmpegArgs = ["-analyzeduration", "0", "-loglevel", "0", "-f", `${"string"==typeof options.fmt?options.fmt:"s16le"}`, "-ar", "48000", "-ac", "2"];
        isNaN(options.seek) || FFmpegArgs.unshift("-ss", options.seek.toString()), Array.isArray(options.encoderArgs) && (FFmpegArgs = FFmpegArgs.concat(options.encoderArgs));
        const transcoder = new prism_media_1.FFmpeg({
                args: FFmpegArgs,
                shell: !1
            }),
            inputStream = ytdl_core_1.default(url, token, options).on("error", () => transcoder.destroy()),
            output = inputStream.pipe(transcoder);
        if (options && !options.opusEncoded) {
            for (const event of evn) inputStream.on(event, (...args) => output.emit(event, ...args));
            return output.on("close", () => transcoder.destroy()), output
        }
        const opus = new prism_media_1.opus.Encoder({
                rate: 48e3,
                channels: 2,
                frameSize: 960
            }),
            outputStream = output.pipe(opus);
        output.on("error", e => outputStream.emit("error", e));
        for (const event of evn) inputStream.on(event, (...args) => outputStream.emit(event, ...args));
        return outputStream.on("close", () => {
            transcoder.destroy(), opus.destroy()
        }), outputStream
    },
    arbitraryStream = (stream, options) => {
        if (!stream) throw new Error("No stream source provided");
        let FFmpegArgs;
        null != options || (options = {}), FFmpegArgs = "string" == typeof stream ? ["-reconnect", "1", "-reconnect_streamed", "1", "-reconnect_delay_max", "5", "-i", stream, "-analyzeduration", "0", "-loglevel", "0", "-f", `${"string"==typeof options.fmt?options.fmt:"s16le"}`, "-ar", "48000", "-ac", "2"] : ["-analyzeduration", "0", "-loglevel", "0", "-f", `${"string"==typeof options.fmt?options.fmt:"s16le"}`, "-ar", "48000", "-ac", "2"], isNaN(options.seek) || FFmpegArgs.unshift("-ss", options.seek.toString()), Array.isArray(options.encoderArgs) && (FFmpegArgs = FFmpegArgs.concat(options.encoderArgs));
        let transcoder = new prism_media_1.FFmpeg({
            args: FFmpegArgs,
            shell: !1
        });
        if ("string" != typeof stream && (transcoder = stream.pipe(transcoder), stream.on("error", () => transcoder.destroy())), options && !options.opusEncoded) return transcoder.on("close", () => transcoder.destroy()), transcoder;
        const opus = new prism_media_1.opus.Encoder({
                rate: 48e3,
                channels: 2,
                frameSize: 960
            }),
            outputStream = transcoder.pipe(opus);
        return outputStream.on("close", () => {
            transcoder.destroy(), opus.destroy()
        }), outputStream
    };
StreamDownloader.arbitraryStream = arbitraryStream, StreamDownloader.version = require("./package.json").version;
const DiscordYTDLCore = Object.assign(StreamDownloader, ytdl_core_1.default);
module.exports = DiscordYTDLCore;
