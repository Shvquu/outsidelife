import * as alt from 'alt-server';
import { Account } from '../../interface/account';
import { getUniquePlayerHash } from '../../utility/encryption';
import { Database, getDatabase } from 'simplymongo';
import { DEFAULT_CONFIG } from '../../configs/settings';
import { distance2d } from '../../../shared/utility/vector';
import { SYSTEM_EVENTS, Permissions } from '../../../shared/utility/enums';
import emit from './emit';
import save from './save';
import dataUpdater from './dataUpdater';
import safe from './safe';
import sync from './sync';
import { EVENTS_PLAYER } from '../../utility/enums';
import { ActionMenu } from '../../../shared/interfaces/Actions';
import { playerFuncs } from '../player';
import { Collections } from '../../utility/enums';

const db: Database = getDatabase();

async function account(p: alt.Player, accountData: Partial<Account>): Promise<void> {
    if (!accountData.permissionLevel) {
        accountData.permissionLevel = Permissions.None;
        db.updatePartialData(accountData._id, { permissionLevel: Permissions.None }, Collections.Accounts);
    }
    if (!accountData.quickToken || Date.now() > accountData.quickTokenExpiration || p.needsQT) {
        const quickToken: string = getUniquePlayerHash(p, p.discord.id);
        const quickTokenExpiration: number = Date.now() + 60000 * 60 * 48;
        db.updatePartialData(accountData._id, { quickToken, quickTokenExpiration }, Collections.Accounts);
        alt.emitClient(p, SYSTEM_EVENTS.QUICK_TOKEN_UPDATE, p.discord.id);
    }
    emit.meta(p, 'permissionLevel', accountData.permissionLevel);
    p.account = accountData;
}

function actionMenu(player: alt.Player, actionMenu: ActionMenu) {
    alt.emitClient(player, SYSTEM_EVENTS.SET_ACTION_MENU, actionMenu);
}

/**
 *
 * @param {alt.Player} killer
 * @param {*} weaponHash
 * @memberof SetPrototype
 */
function dead(p: alt.Player, killer: alt.Player = null, weaponHash: any = null): void {
    p.spawn(p.pos.x, p.pos.y, p.pos.z, 0);

    if (!p.data.isUnconscious) {
        p.data.isUnconscious = true;
        emit.meta(p, 'isUnconscious', true);
        save.field(p, 'isUnconscious', true);
        alt.log(`(${p.id}) ${p.data.name} has died.`);
    }
    if (!p.nextDeathSpawn) {
        p.nextDeathSpawn = Date.now() + DEFAULT_CONFIG.RESPAWN_TIME;
    }

    alt.emit(EVENTS_PLAYER.UNCONSCIOUS, p);
}

/**
 * Called when a player does their first connection to the server.
 * @memberof SetPrototype
 */
async function firstConnect(p: alt.Player): Promise<void> {
    if (!p || !p.valid) {
        return;
    }

    if (process.env.ATHENA_READY === 'false') {
        p.kick('Still warming up...');
        return;
    }

    const pos = { ...DEFAULT_CONFIG.CHARACTER_SELECT_POS };

    p.dimension = p.id + 1; // First ID is 0. We add 1 so everyone gets a unique dimension.
    p.pendingLogin = true;

    dataUpdater.init(p, null);
    safe.setPosition(p, pos.x, pos.y, pos.z);
    sync.time(p);
    sync.weather(p);

    alt.setTimeout(() => {
        if (!p || !p.valid) {
            return;
        }

        alt.emitClient(p, SYSTEM_EVENTS.QUICK_TOKEN_FETCH);
    }, 500);
}
/**
 * Set if this player should be frozen.
 * @param {boolean} value
 * @memberof SetPrototype
 */
function frozen(p: alt.Player, value: boolean): void {
    alt.emitClient(p, SYSTEM_EVENTS.PLAYER_SET_FREEZE, value);
}

/**
 * Set this player as respawned.
 * @param {(alt.Vector3 | null)} position Use null to find closest hospital.
 * @memberof SetPrototype
 */
function respawned(p: alt.Player, position: alt.Vector3 = null): void {
    p.nextDeathSpawn = null;
    p.data.isUnconscious = false;
    emit.meta(p, 'isUnconscious', false);
    save.field(p, 'isUnconscious', false);

    let nearestHopsital = position;
    if (!position) {
        const hospitals = [...DEFAULT_CONFIG.VALID_HOSPITALS];
        let index = 0;
        let lastDistance = distance2d(p.pos, hospitals[0]);

        for (let i = 1; i < hospitals.length; i++) {
            const distanceCalc = distance2d(p.pos, hospitals[i]);
            if (distanceCalc > lastDistance) {
                continue;
            }

            lastDistance = distanceCalc;
            index = i;
        }

        nearestHopsital = hospitals[index] as alt.Vector3;

        if (DEFAULT_CONFIG.RESPAWN_LOSE_WEAPONS) {
            playerFuncs.inventory.removeAllWeapons(p);
        }
    }

    safe.setPosition(p, nearestHopsital.x, nearestHopsital.y, nearestHopsital.z);
    p.spawn(nearestHopsital.x, nearestHopsital.y, nearestHopsital.z, 0);

    alt.nextTick(() => {
        p.clearBloodDamage();
        safe.addBlood(p, DEFAULT_CONFIG.RESPAWN_HEALTH);
        safe.addArmour(p, DEFAULT_CONFIG.RESPAWN_ARMOUR, true);
    });

    alt.emit(EVENTS_PLAYER.SPAWNED, p);
}

export default {
    account,
    actionMenu,
    dead,
    firstConnect,
    frozen,
    respawned
};