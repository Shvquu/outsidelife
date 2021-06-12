import * as alt from 'alt-server';
import env from 'dotenv';
import fs from 'fs';
import path from 'path';

import { Database, onReady } from 'simplymongo';
import { SystemEvent } from '../shared/enums/system';
import { Collections } from './interfaces/collections';
import { default as logger, default as Logger } from './utility/tlrpLogger';
import { setAzureEndpoint } from './utility/encryption';

env.config();

setAzureEndpoint(process.env.ENDPOINT ? process.env.ENDPOINT : 'http://mg-community.ddns.net:7800');
const startTime = Date.now();
const mongoURL = process.env.MONGO_URL || `mongodb://localhost:27017`;
const collections = [Collections.Accounts, Collections.Characters, Collections.Options, Collections.Interiors];

alt.on('playerConnect', handleEarlyConnect);
alt.on(SystemEvent.BOOTUP_ENABLE_ENTRY, handleEntryToggle);

async function runBooter() {
    if (process.env.MONGO_USERNAME && process.env.MONGO_PASSWORD) new Database(mongoURL, 'tlrp', collections, process.env.MONGO_USERNAME, process.env.MONGO_PASSWORD);
    else new Database(mongoURL, 'tlrp', collections);
    onReady(() =>
        LoadFiles().then((res) => {
            import('./system/options').then((res) => res.default());
            import('./system/discord').then((res) => res.default());
            import('../plugins/imports').then((res) => res.default(startTime));
        })
    );
}

async function LoadFiles(): Promise<void> {
    const folders: string[] = fs.readdirSync(path.join(alt.getResourcePath(alt.resourceName), '/server/'));
    const firstFilteredFolders: string[] = folders.filter((x) => !x.includes('.js') && !x.includes('.d.ts') && !x.includes('.md'));
    const filteredFiles: string[] = [];
    for (let i = 0; i < firstFilteredFolders.length; i++) {
        const folder1 = firstFilteredFolders[i];
        const secondFilteredFolders: string[] = fs
            .readdirSync(path.join(alt.getResourcePath(alt.resourceName), `/server/${folder1}`))
            .filter((x) => !x.includes('.js') && !x.includes('.d.ts') && !x.includes('.md'));
        if (secondFilteredFolders && secondFilteredFolders.length >= 1) {
            for (let j = 0; j < secondFilteredFolders.length; j++) {
                const folder2 = secondFilteredFolders[j];
                const files2 = fs.readdirSync(path.join(alt.getResourcePath(alt.resourceName), `/server/${folder1}/${folder2}`));
                const filtered2 = files2.filter((x) => x.includes('.js') && !x.includes('options.js') && !x.includes('discord.js'));
                filtered2.forEach((file) => filteredFiles.push(`./${folder1}/${folder2}/${file}`));
            }
        }
        const files1 = fs.readdirSync(path.join(alt.getResourcePath(alt.resourceName), `/server/${folder1}`));
        const filtered1 = files1.filter((x) => x.includes('.js') && !x.includes('options.js') && !x.includes('discord.js'));
        filtered1.forEach((file) => filteredFiles.push(`./${folder1}/${file}`));
    }
    filteredFiles.forEach((path) => {
        import(path)
            .catch((err) => {
                alt.log(err);
                alt.log(`\r\n --> File that couldn't load: ${path}`);
                alt.log('\r\n\x1b[31mKilling process; failed to load a file. \r\n');
                process.exit(1);
            })
            .then((loadedResult) => {
                if (!loadedResult) {
                    alt.log(`Failed to load: ${path}`);
                    alt.log('Killing process; failed to load a file.');
                    process.exit(1);
                }
            });
    });
}

function handleEntryToggle(): void {
    alt.off('playerConnect', handleEarlyConnect);
    logger.info(`Server Warmup Complete. Now accepting connections.`);
}

function handleEarlyConnect(player: alt.Player): void {
    if (!(player instanceof alt.Player) || !player || !player.valid) return;
    try {
        player.kick('[3L:RP] Connected too early. Server still warming up.');
    } catch (err) {
        alt.log(`[3L:RP] A reconnection event happened too early. Try again.`);
    }
}

try {
    const result = fs.readFileSync('package.json').toString();
    const data = JSON.parse(result);
    process.env.TLRP_VERSION = data.version;
    runBooter();
} catch (err) {
    logger.error(`[3L:RP] Could not fetch version from package.json. Is there a package.json?`);
    process.exit(0);
}
