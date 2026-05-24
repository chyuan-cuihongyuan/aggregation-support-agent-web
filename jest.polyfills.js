/* eslint-disable @typescript-eslint/no-require-imports */
// Polyfill TextEncoder/TextDecoder（jsdom 环境中不可用）
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill ReadableStream（jsdom 环境中不可用）
const { ReadableStream, WritableStream, TransformStream } = require("stream/web");
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;
