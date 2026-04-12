const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Limit parallel workers — each worker gets more RAM, fixes OOM on first build
config.maxWorkers = 2;

module.exports = config;
