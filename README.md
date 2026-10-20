# pxt-advanced-animations

A MakeCode Arcade extension for creating rules that control when animations run on a sprite. It is a superset of [arcade-character-animations](https://github.com/microsoft/arcade-character-animations): all of the original movement rules work unchanged, and it adds button and action button predicates so you can trigger attack or action animations without disabling movement animations.

Do not install this extension together with `arcade-character-animations` in the same project — use this one instead.

## Basic Rules

To attach animations to a sprite, you first need to create a "Rule" that dictates when the animation will run. Rules are made up of several predicates that describe a sprite's behavior. For example, if we were making a platformer here are some of the rules we might use to control the walking animations:

- Running Right: "moving" + "facing right" + "hitting wall down"
- Running Left: "moving" + "facing left" + "hitting wall down"

If we wanted to add jumping to our sprite, we could create two more rules:

- Jumping Right: "moving" + "facing right"
- Jumping Left: "moving" + "facing left"

The most specific rule (the one with the most predicates) always overrides the others, so the running rules win over the jumping rules while the sprite is on the ground.

## Button predicates

Unlike the original extension, button predicates are **added** to the sprite's automatic state every frame, so "moving", "facing", and "hitting wall" predicates keep working while a button is held:

- `button A pressed` / `button B pressed` — held checks
- `button A just pressed` / `button B just pressed` — true for exactly one frame, great for starting an animation with "run frames"
- `action button pressed` / `action button just pressed` — uses the button you pick with the "use action button" block (A, B, or any direction)

### Example: attack animations with A

Use `run frames` (plays once, then returns to the matching loop animation) with a rule that combines a direction and the button:

- Attack right: "button A pressed" + "moving right"
- Attack left: "button A pressed" + "moving left"
- Attack down: "button A pressed" + "moving down"
- Attack while standing: "button A pressed" + "not moving"

Because the rule engine picks the most specific rule, the attack rules take over only while A is held; when released, the walk or idle animation resumes automatically.

## Supported targets

- for PXT/Arcade
- for PXT/Arcade (The metadata above is needed for package search.)

## Credits

Based on [microsoft/arcade-character-animations](https://github.com/microsoft/arcade-character-animations) (MIT).
