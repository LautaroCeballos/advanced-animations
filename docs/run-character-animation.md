# Run character animation

Runs the passed frames on the sprite at the given interval whenever the specified rule begins to be true for that sprite. If there are loop frames for a rule, they will take effect after the run is complete.

This is useful for one-shot animations that trigger on a single frame of state, such as `button A just pressed` or `action button just pressed`.

## Parameters

- **sprite**: the sprite to animate
- **frames**: the images that make up the animation
- **frame interval**: milliseconds to spend on each frame
- **rule**: the rule that decides when this animation will play

## Example

Play a punch animation once when A is pressed:

`run frames [punch] 80 when button A just pressed`
