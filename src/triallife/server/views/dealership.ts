import * as alt from 'alt-server';
import { PhoneEvents } from '../../shared/enums/phoneEvent';
import { VehicleData } from '../../shared/configs/vehicle-list';
import { DefaultConfig } from '../configs/settings';
import { playerFuncs } from '../extensions/Player';
import { vehicleFuncs } from '../extensions/Vehicle';

/*alt.onClient(PhoneEvents.DEALERSHIP_BUY.name, handlePurchase);

function handlePurchase(player: alt.Player, model: string, color: alt.RGBA) {
    if (!player || !player.valid) {
        return;
    }

    if (!model) {
        return;
    }

    const vehicleData = VehicleData.find((veh) => veh.name === model);
    if (!vehicleData) {
        return;
    }

    if (!vehicleData.sell) {
        playerFuncs.emit.notification(player, `Nice try... but the ${model} is not for sale.`);
        return;
    }

    if (!DefaultConfig.VEHICLE_DEALERSHIP_SPAWNS[vehicleData.class]) {
        playerFuncs.emit.notification(player, `Notify Admin that vehicle class... ${vehicleData.class} has no spawn point.`);
        return;
    }

    if (!playerFuncs.economy.subAllCurrencies(player, vehicleData.price)) {
        playerFuncs.emit.notification(player, `Not enough money for this vehicle. \$${vehicleData.price}.`);
        return;
    }

    vehicleFuncs.create.add(player, {
        model: vehicleData.name,
        fuel: 100,
        position: DefaultConfig.VEHICLE_DEALERSHIP_SPAWNS[vehicleData.class],
        rotation: { x: 0, y: 0, z: 0 },
        color
    });

    playerFuncs.emit.notification(player, `Vehicle has been added to your personal vehicles. Check your phone to locate it.`);

    playerFuncs.emit.notification(player, `~r~-\$${vehicleData.price}`);
    playerFuncs.emit.sound2D(player, 'item_purchase');
}*/
