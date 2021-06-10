import * as alt from 'alt-server';
import { BehaviorTypes, LockTypes } from '../../../shared/utility/enums';
import { isFlagEnabled } from '../../../shared/utility/usefull';

function lockState(v: alt.Vehicle): LockTypes {
    if (v.lockStatus === null || v.lockStatus === undefined) {
        return LockTypes.LOCKED;
    }

    return v.lockStatus;
}

function hasFuel(v: alt.Vehicle): boolean {
    if (isFlagEnabled(v.behavior, BehaviorTypes.UNLIMITED_FUEL)) {
        return true;
    }

    if (v.fuel <= 0) {
        return false;
    }

    return true;
}

function isOwner(v: alt.Vehicle, target: alt.Player): boolean {
    // If the vehicle has a null owner. There is no owner.
    if (v.player_id === null || v.player_id === undefined) {
        return true;
    }

    if (v.player_id !== target.id) {
        return false;
    }

    return true;
}

export default { isOwner, lockState, hasFuel };