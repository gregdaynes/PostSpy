#!/usr/bin/env node
import { parseArgs } from 'node:util';
import dotenv from 'dotenv';

// load .env to process.env
dotenv.config();

console.log(process.env);

const options = {
	help: {
		type: 'boolean',
		short: 'h',
		default: false,
		desc: 'Print help info',
	},
};

// extract data from the run command
const { values, positionals } = parseArgs({
	options,
	allowPositionals: true,
});

const [filepath] = positionals;

console.log('Hello world', { values, positionals, filepath, env: process.env });
