#!/usr/bin/env node
import { parseArgs } from 'node:util';
import dotenv from 'dotenv';
import { join } from 'desm';
import { readFile } from 'node:fs/promises';
import { request } from 'undici';

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

const fullPath = join(import.meta.url, filepath);
const fileContents = JSON.parse((await readFile(fullPath)).toString());

console.log(fileContents);

const { statusCode, headers, trailers, body } = await request(
	fileContents.url,
	{
		method: fileContents.get,
	}
);

let bodyData;
for await (const data of body) {
	bodyData = data.toString();
}

console.log('response received', statusCode);
console.log(headers);
console.log(trailers);

console.log('Response', {
	statusCode,
	headers,
	rawBody: body,
	body: bodyData,
	trailers,
});
