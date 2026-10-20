# pxt-advanced-animations

A MakeCode Arcade extension for creating rules that control when animations run on a sprite. It is a superset of [arcade-character-animations](https://github.com/microsoft/arcade-character-animations): all of the original movement rules work unchanged, and it adds button, attack, and collision predicates plus event blocks so you can play attack animations without disabling movement animations.

Do not install this extension together with `arcade-character-animations` in the same project — use this one instead.

## Basic Rules

To attach animations to a sprite, you first need to create a "Rule" that dictates when the animation will run. Rules are made up of several predicates that describe a sprite's behavior. For example, if we were making a platformer here are some of the rules we might use to control the walking animations:

- Running Right: "moving" + "facing right" + "hitting wall down"
- Running Left: "moving" + "facing left" + "hitting wall down"

If we wanted to add jumping to our sprite, we could create two more rules:

- Jumping Right: "moving" + "facing right"
- Jumping Left: "moving" + "facing left"

The most specific rule (the one with the most predicates) always overrides the others, so the running rules win over the jumping rules while the sprite is on the ground.

## Attack predicates and triggers

Unlike the original extension, attacks do not require disabling animations or replacing the sprite state. New predicates are **added** to the sprite's automatic state every frame, so "moving", "facing", and "hitting wall" predicates keep working during an attack:

- `button A pressed` / `button B pressed` — held checks
- `button A just pressed` / `button B just pressed` — true for exactly one frame, great for starting an animation with "run frames"
- `action button pressed` / `action button just pressed` — uses the button you pick with the "use action button" block (A, B, or any direction)
- `attacking` — true while an attack started with the attack trigger is playing
- `hitting a sprite` — true while overlapping the target set with "detect collisions with"

### Rule-based attacks

Register an attack animation that wins over the walk cycle by being more specific:

- Walk attack right: "moving" + "facing right" + "attacking" (3 predicates) beats "moving" + "facing right" (2 predicates)

### Trigger-based attacks

The "run attack frames" block plays frames on top of the rule system for a duration (or one pass if no duration is given). When it finishes, the best matching rule animation resumes automatically. While the attack plays, the "attacking" predicate is true, and "on attack start" / "on attack end" / "is attacking" / "attack time remaining" blocks reflect it.

Rules with an equally specific score keep the currently executing animation, so always give your attack rule more predicates than the movement rule it should override.

## Supported targets

- for PXT/Arcade
- for PXT/Arcade (The metadata above is needed for package search.)

## Credits

Based on [microsoft/arcade-character-animations](https://github.com/microsoft/arcade-character-animations) (MIT).
