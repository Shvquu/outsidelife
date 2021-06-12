import * as alt from 'alt-server';
import { DoorList } from '../../shared/enums/vehicle';
import { AnimationFlag } from '../../shared/enums/animation';
import { Item } from '../../shared/interfaces/item';
import { Task, TaskCallback } from '../../shared/interfaces/task-timeline';
import { playerFuncs } from '../extensions/player';
import { vehicleFuncs } from '../extensions/vehicle';
import { getForwardVector } from '../utility/vector';
import * as TlrpMath from '../utility/math';

const isUsingTimeline: Array<{ player: alt.Player; vehicle: alt.Vehicle }> = [];

alt.onClient('task:Vehicle:Repair:Timeline', handleRepairTimeline);
alt.on('effect:Vehicle:Repair', handleRepair);

function handleRepair(player: alt.Player) {
    const closestVehicle = playerFuncs.utility.getVehicleInFrontOf(player, 2);

    if (!closestVehicle) {
        playerFuncs.emit.notification(player, `Could not find a vehicle to use this on.`);
        return;
    }

    if (player.vehicle) {
        playerFuncs.emit.notification(player, `You must exit the vehicle first.`);
        return;
    }

    const removedKit = playerFuncs.inventory.findAndRemove(player, 'Repair Kit');
    if (!removedKit) {
        playerFuncs.emit.notification(player, `You do not have a repair kit.`);
        return;
    }

    const fwdVector = getForwardVector(closestVehicle.rot);
    const fwdPosition = {
        x: TlrpMath.add(closestVehicle.pos.x, TlrpMath.multiply(fwdVector.x, 2)),
        y: TlrpMath.add(closestVehicle.pos.y, TlrpMath.multiply(fwdVector.y, 2)),
        z: closestVehicle.pos.z
    };

    const timeline: Array<Task | TaskCallback> = [
        {
            // taskGoToCoordAnyMeans(ped: number, x: number, y: number, z: number, speed: number, p5: any, p6: boolean, walkingStyle: number, p8: number
            nativeName: 'taskGoToCoordAnyMeans',
            params: [fwdPosition.x, fwdPosition.y, fwdPosition.z, 1, 0, false, 786603, 0],
            timeToWaitInMs: 5000
        },
        {
            // taskTurnPedToFaceCoord(ped: number, x: number, y: number, z: number, duration: number)
            nativeName: 'taskTurnPedToFaceCoord',
            params: [closestVehicle.pos.x, closestVehicle.pos.y, closestVehicle.pos.z, 2000],
            timeToWaitInMs: 2000
        },
        {
            callbackName: 'task:Vehicle:Repair:Timeline'
        }
    ];

    isUsingTimeline.push({ player, vehicle: closestVehicle });
    playerFuncs.emit.taskTimeline(player, timeline);
}

function handleRepairTimeline(player: alt.Player) {
    const index = isUsingTimeline.findIndex((data) => data.player === player);
    if (index <= -1) {
        return;
    }

    const closestVehicle = isUsingTimeline[index].vehicle;
    isUsingTimeline.splice(index, 1);

    if (!closestVehicle || !closestVehicle.valid) {
        return;
    }

    playerFuncs.emit.animation(player, 'mp_car_bomb', 'car_bomb_mechanic', AnimationFlag.NORMAL | AnimationFlag.REPEAT, 12000);

    vehicleFuncs.setter.doorOpen(closestVehicle, player, DoorList.HOOD, true, true);

    alt.setTimeout(() => {
        vehicleFuncs.utility.repair(closestVehicle);
    }, 12000);
}