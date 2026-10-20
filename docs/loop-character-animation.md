# Loop character animation

Loops the passed frames on the sprite at the given interval whenever the specified rule is true for that sprite.

If more than one rule applies, the most specific rule (the one with the most predicates) will be used. If multiple rules are equally specific, the currently executing rule is favored.

## Parameters

- **sprite**: the sprite to animate
- **frames**: the images that make up the animation
- **frame interval**: milliseconds to spend on each frame
- **rule**: the rule that decides when this animation will play

## Example

Loop a walk cycle when the sprite is moving right and on the ground:

`loop frames [walkRight] 100 when moving AND facing right AND hitting wall down`
