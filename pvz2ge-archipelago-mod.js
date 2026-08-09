function WaitForInitialization() {

	if (typeof System === "undefined" || typeof System.get("chunks:///_virtual/JSONs.ts") == "undefined" || System.get("chunks:///_virtual/JSONs.ts").PvZ2ObjectContainer.PlantAlmanac[0] == void 0) { setTimeout(WaitForInitialization, 500); return }
	else { InitiateMod(); }

}
WaitForInitialization();


function InitiateMod() {

/*~=~=~=~=~=~=~=~=~=~=

Plant Stats Randomizer

~=~=~=~=~=~=~=~=~=~=*/

// YAML variables:
var RandomizeRange = 2 - 1; // Maximum multiplier per round. This should be subtracted by 1 in the APWorld - before reaching the client.
var RandomizeRounds = 3; // Rounds of randomization. Higher values lead to homogenized stat spreads with more stats effected.
//

// The APWorld should generate this seed.
// Having stat randomization in the Javascript-clientside reduces maintenance required per update.
// It also allows for rudimentary support of modded-in plants. If those have ever existed for Gardendless.
var seed;

// This seed generator is for testing purposes.
seed = ( Math.random() * (2**32) ) >>> 0;
console.log("Original Seed: " + seed);

function random() { // xorshift random.
	seed ^= seed << 1;
	seed ^= seed >> 3;
	seed ^= seed << 10;

	return seed >>> 0
}

// Randomize plant stats:
var PlantProps = System.get("chunks:///_virtual/JSONs.ts").PvZ2ObjectContainer["PlantProps"];
for (var plant = 0; PlantProps[plant] != void 0; plant++) {

	var PlantData = PlantProps[plant].objdata;

	var AlmanacIndex = System.get("chunks:///_virtual/JSONs.ts").PvZ2ObjectContainer["PlantAlmanac"].findIndex(
		(Entry) => Entry.aliases[0] == PlantProps[plant].aliases[0]
	);
	var AlmanacTypes = [];
	var AlmanacEntries = [];

	var PlantStats = [];
	var PlantModifiers = [];

	// Create pool of stats to randomize.
	// SUN-COST:
	var plantCost = [];
	if (PlantData["SunCost"] != void 0) {
		plantCost.push("SunCost");
	}
	if (PlantData["BeghouledCost"] != void 0) {
		plantCost.push("BeghouledCost");
	}
	if (plantCost.length > 0) { PlantStats.push(plantCost); PlantModifiers.push(0); AlmanacTypes.push("Sun Cost: "); }
	// FIRE-RATE:
	var plantFireRate = [];
	if (PlantData["ShootInterval"] != void 0) {
		plantFireRate.push("ShootInterval");
	}
	if (PlantData["ShootIntervalAdditional"] != void 0) {
		plantFireRate.push("ShootIntervalAdditional");
	}
	if (PlantData["AttackInterval"] != void 0) {
		plantFireRate.push("AttackInterval");
	}
	if (PlantData["AttackIntervalAdditional"] != void 0) {
		plantFireRate.push("AttackIntervalAdditional");
	}
	if (PlantData["ThrowInterval"] != void 0) {
		plantFireRate.push("ThrowInterval");
	}
	if (PlantData["ThrowIntervalAdditional"] != void 0) {
		plantFireRate.push("ThrowIntervalAdditional");
	}
	if (plantFireRate.length > 0) { PlantStats.push(plantFireRate); PlantModifiers.push(0); AlmanacTypes.push("Firerate: "); }
	// SUN RATE:
	var plantSunRate = [];
	if (PlantData["ProduceCountdownStart"] != void 0) {
		plantSunRate.push("ProduceCountdownStart");
	}
	if (PlantData["ProduceCountdownStartAdditional"] != void 0) {
		plantSunRate.push("ProduceCountdownStartAdditional");
	}
	if (PlantData["ProduceInterval"] != void 0) {
		plantSunRate.push("ProduceInterval");
	}
	if (PlantData["ProduceIntervalAdditional"] != void 0) {
		plantSunRate.push("ProduceIntervalAdditional");
	}
	if (plantSunRate.length > 0) { PlantStats.push(plantSunRate); PlantModifiers.push(0); AlmanacTypes.push("Sun Generation: "); }
	// SUN VALUE:
	if (PlantData["SunValue"] != void 0) {
		PlantStats.push(["SunValue"]);
		PlantModifiers.push(0);

		AlmanacTypes.push("Sun Value: ");
	}

	var NerfPossible = PlantStats.length; // If Plantfood effects were allowed to be nerfed, then you could just not use Plantfood on the plant and it would strictly be buffed.
											// If Toughness were allowed to be nerfed, then you could just position the plant away from zombies and it would strictly be buffed.
											// If Cooldown were allowed to be nerfed, then you could just plant one of them and win instantly. (This happened in testing).
	// COOLDOWN:
	if (PlantData["Cooldown"] != void 0) {
		PlantStats.push(["Cooldown"]);
		PlantModifiers.push(0);

		AlmanacTypes.push("Cooldown: ");
	}
	// TOUGHNESS:
	if (PlantData["Toughness"] != void 0) {
		PlantStats.push(["Toughness"]);
		PlantModifiers.push(0);

		AlmanacTypes.push("Toughness: ");
	}
	// PLANTFOOD:
	var plantFood = Object.entries( PlantData ).filter( (stat) => stat[0].startsWith("Plantfood") || stat[0] == "ArmorToughness" );
	if (plantFood.length > 0) {
		var temp = [];
		for (stat of plantFood) {
			temp.push(stat[0]);
		}
		PlantStats.push(temp);
		PlantModifiers.push(0);
		AlmanacTypes.push("Plantfood: ");
	}

	if (NerfPossible < 2) { NerfPossible = PlantStats.length; } // Prevents the stat balancer from being forced to draw an invalid stat or get stuck in for loop.

	// Generate randomized stats.
	for (var i = 0; i < RandomizeRounds; i++) {

		var ratio = random() / 2**32;
		// Buff.
		if (seed&1) {
			var target = random() % PlantStats.length;

			PlantModifiers[target] += ratio;

			// Balance out initial stat change.
			while (ratio > 0.1) {
				var newTarget = random() % NerfPossible;
				if (newTarget == target) {
					if (newTarget == 0) { newTarget++; }
					else { newTarget--; }
				}

				var newRatio = ratio * (random() / 2**32);
				PlantModifiers[newTarget] -= newRatio;
				ratio -= newRatio;
			}
			// Remaining ~0.1 to balance:
			var newTarget = random() % NerfPossible;
			if (newTarget == target) {
				if (newTarget == 0) { newTarget++; }
				else { newTarget--; }
			}

			PlantModifiers[newTarget] -= ratio;
		}
		// Nerf.
		else {
			var target = random() % NerfPossible;

			PlantModifiers[target] -= ratio;

			// Balance out initial stat change.
			while (ratio > 0.1) {
				var newTarget = random() % PlantStats.length;
				if (newTarget == target) {
					if (newTarget == 0) { newTarget++; }
					else { newTarget--; }
				}

				var newRatio = ratio * (random() / 2**32);
				PlantModifiers[newTarget] += newRatio;
				ratio -= newRatio;
			}
			// Remaining ~0.1 to balance:
			var newTarget = random() % PlantStats.length;
			if (newTarget == target) {
				if (newTarget == 0) { newTarget++; }
				else { newTarget--; }
			}

			PlantModifiers[newTarget] += ratio;
		}

	}

	// Apply stat changes.
	for (stat in PlantStats) {

		// Fill in Plant Almanac.
		if (AlmanacIndex != -1) {
			var AlmanacString = AlmanacTypes[stat] + (PlantModifiers[stat] >= 0 ? "+" : "") + (PlantModifiers[stat]*RandomizeRange).toFixed(2) + "x";

			AlmanacEntries.push (
				{ TYPE: "SPECIAL", SORT: { en: AlmanacString, zh: AlmanacString } }
			);
		}

		// Fill in plant stats.
		if (PlantModifiers[stat] != 0) {
			for (statName of PlantStats[stat]) {
				var modifier = PlantModifiers[stat];
				var SunRounder = 1;
				var DecimalRounder = 1;
				var actualStat = PlantData[statName];
				if (actualStat == 0) { actualStat = 5 * RandomizeRange; }

				switch (statName) {

					// Nerfs decrease value; buffs increase value.
					case "SunValue":
						SunRounder = 5;
					case "Toughness":
						if (modifier < 0) { // If nerfed:
							modifier = 1 / (modifier * -1 * RandomizeRange + 1);
						}
						else { // If buffed:
							modifier = (modifier * RandomizeRange) + 1;
						}

						// Assign stat.
						System.get("chunks:///_virtual/JSONs.ts").PvZ2ObjectContainer["PlantProps"][plant].objdata[statName] = Math.floor((actualStat / SunRounder) * modifier * DecimalRounder) * SunRounder / DecimalRounder;
						break;
					// Nerfs increase value; buffs decrease value.
					case "SunCost":
					case "BeghouledCost":
						SunRounder = 5;
					case "ShootInterval":
					case "ShootIntervalAdditional":
					case "AttackInterval":
					case "AttackIntervalAdditional":
					case "ThrowInterval":
					case "ThrowIntervalAdditional":
						if (SunRounder == 1) { DecimalRounder = 100; }
					default:
						if (modifier < 0) { // If nerfed:
							modifier = (modifier * -1 * RandomizeRange) + 1;
						}
						else { // If buffed:
							modifier = 1 / (modifier * RandomizeRange + 1);
						}

						// Assign stat.
						System.get("chunks:///_virtual/JSONs.ts").PvZ2ObjectContainer["PlantProps"][plant].objdata[statName] = Math.floor((actualStat / SunRounder) * modifier * DecimalRounder) * SunRounder / DecimalRounder;
						break;

				}
			}
		}

	}
	// Write additional almanac entries to Plant Almanac.
	if (AlmanacEntries.length > 0) {
		System.get("chunks:///_virtual/JSONs.ts").PvZ2ObjectContainer.PlantAlmanac[AlmanacIndex].objdata.Elements.unshift(
			...AlmanacEntries
		);
	}

}

/*~=~=~=~=~=~=~=~=~=~=~

Lower Daily Event Timer

~=~=~=~=~=~=~=~=~=~=~*/

//YAML variables:
var LODcooldown = 20; // In minutes.
//

var TimeUntil = Date.now() + (LODcooldown * 60000);
function reset_daily() {
	System.get("chunks:///_virtual/PlayerProperties.ts").AllPlayerProperties.currentPlayer["yeti_spawned_today"] = false;
	System.get("chunks:///_virtual/PlayerProperties.ts").AllPlayerProperties.currentPlayer.arcade_plant_decoding["played_today"] = false;
	System.get("chunks:///_virtual/PlayerProperties.ts").AllPlayerProperties.currentPlayer.arcade_plant_decoding["gem_today"] = 0;

	var y = System.get("chunks:///_virtual/PlayerProperties.ts").AllPlayerProperties.getLevelOfTheDayProps();
	y.date_changed = true; y.failed_time = void 0; y.finished = false;
	TimeUntil = Date.now() + (LODcooldown * 60000);
}
setInterval(reset_daily, LODcooldown*60000);

// Visual. (Level of the Day).
var editLODcooldown = String(System.get("chunks:///_virtual/LevelOfTheDayDisplayer.ts").LevelOfTheDayDisplayer.prototype["readLOD"]);
editLODcooldown = editLODcooldown.replace("(new Date).setHours(24,0,0,0)",
	"TimeUntil");

System.get("chunks:///_virtual/LevelOfTheDayDisplayer.ts").LevelOfTheDayDisplayer.prototype["readLOD"] = eval("(" + editLODcooldown + ")");

/*~=~=~=~=~=~=~=~=~=~

Fast Forward Up To 2.5x

~=~=~=~=~=~=~=~=~=~*/

// Add option for 2.5x speed.
var GameSpeed = 1;
System.get("chunks:///_virtual/UI.ts").UIInGame.prototype["speedUp"] = function (playSound) {

	var V = System.get("chunks:///_virtual/SoundRescourses.ts").sounds;
	var Y = System.get("chunks:///_virtual/levelController.ts").LevelPlay;
	var _ = cc.Color;

	if (playSound === void 0) {
		playSound = true;
	}
	if (!playSound) {
		GameSpeed = 1;
		(this.s2xButton.normalSprite = this.normal2x, this.s2xButton.pressedSprite = this.pressed2x, this.s2xButton.hoverSprite = this.hover2x);
		return
	}

	switch(GameSpeed) {
		case 1:
			GameSpeed = 1.5;
			(this.s2xButton.normalSprite = this.pressed2x, this.s2xButton.pressedSprite = this.pressed2x, this.s2xButton.hoverSprite = this.hover2x, Y.setScreenFlashLeftColor(new _(122, 242, 255, 75), .5));
			break;
		case 1.5:
			GameSpeed = 2.5;
			(this.s2xButton.normalSprite = this.pressed2x, this.s2xButton.pressedSprite = this.pressed2x, this.s2xButton.hoverSprite = this.hover2x, Y.setScreenFlashLeftColor(new _(255, 122, 142, 75), .5));
			V.playPlantThrow();
			break;
		case 2.5:
			GameSpeed = 1;
			(this.s2xButton.normalSprite = this.normal2x, this.s2xButton.pressedSprite = this.pressed2x, this.s2xButton.hoverSprite = this.hover2x, Y.setScreenFlashLeftColor(new _(122, 242, 255, 75), .5));
			break;
	}
	V.playSpeedUp();

}

// oldTickReturn returns newly created GameSpeed to 1.
System.get("chunks:///_virtual/UI.ts").UIInGame.oldTickReturn = function() {
	GameSpeed = 1;
	cc.director.gameSpeed = 1; System.get("chunks:///_virtual/UI.ts")["gamingSpeed"] = 1;
}

// Some functions check the local variable before slowing the game down.
var editWarnToNewSpeed = String(System.get("chunks:///_virtual/UI.ts").UIInGame.prototype["playZombieTooCloseWarn"]);
var originalSpeedCheck = editWarnToNewSpeed.indexOf(">1&&this.speedUp(!1)");
var originalSound = editWarnToNewSpeed.indexOf(".play",originalSpeedCheck);

editWarnToNewSpeed = editWarnToNewSpeed.slice(0,originalSpeedCheck-2) + "GameSpeed > 1 && this.speedUp(false)" + editWarnToNewSpeed.slice(originalSpeedCheck+20,originalSound-1) + 'System.get("chunks:///_virtual/SoundRescourses.ts").sounds' + editWarnToNewSpeed.slice(originalSound);

System.get("chunks:///_virtual/UI.ts").UIInGame.prototype["playZombieTooCloseWarn"] = eval("(" + editWarnToNewSpeed + ")");

// The update function constantly sets the gameSpeed to a local variable. This wrapper sets it back afterwards.
const old_update = System.get("chunks:///_virtual/UI.ts").UIInGame.prototype["update"];

System.get("chunks:///_virtual/UI.ts").UIInGame.prototype["update"] = function (...args) {
	old_update.apply(this, args); // Run original update function.

	if (cc.director.gameSpeed < 1) { return } // If the speed is less than 1, let the original speed manager handle it.

	var Y = System.get("chunks:///_virtual/levelController.ts").LevelPlay;

	if (Y.sandBoxModeOn && !Y.gameStarted) {
		var skipIntroSpeed = GameSpeed*4;
		System.get("chunks:///_virtual/UI.ts")["gamingSpeed"] = skipIntroSpeed;
		cc.director.gameSpeed = skipIntroSpeed;
	}
	else {
		System.get("chunks:///_virtual/UI.ts")["gamingSpeed"] = GameSpeed;
		cc.director.gameSpeed = GameSpeed;
	}
}

/*~=~=~=~=~=~=~=~=~

Return 25 Sun Meta

~=~=~=~=~=~=~=~=~*/

// YAML variables:
var SunValues = [75,50,25,5]; // Sets the value of collected Sun. 25 Sun Meta: [35,25,15,5];
//

System.get("chunks:///_virtual/Droppings.ts").droppings["SunLarge"]["data"]["_components"][1].value = SunValues[0];
System.get("chunks:///_virtual/Droppings.ts").droppings["SunMid"]["data"]["_components"][1].value = SunValues[1];
System.get("chunks:///_virtual/Droppings.ts").droppings["SunSmall"]["data"]["_components"][1].value = SunValues[2];
System.get("chunks:///_virtual/Droppings.ts").droppings["SunTiny"]["data"]["_components"][1].value = SunValues[3];

}
