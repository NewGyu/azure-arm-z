"use strict";

const { EasyCommander } = require("../lib");

const config = require("./config");
const template = require("./template");

const commander = new EasyCommander(config, template);
commander.exec(process.argv);
