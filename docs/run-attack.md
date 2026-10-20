# Run attack

Plays the passed frames on top of any rule animation. While the attack is playing, the `attacking` predicate is true for the sprite, and when the attack finishes the best matching rule animation resumes automatically. Movement animations are never disabled and no manual state is required.

If no duration is given, the attack lasts exactly one pass through the frames. If a duration is given, the frames loop until the duration elapses.

## Parameters

- **sprite**: the sprite to animate
- **frames**: the images that make up the attack animation
- **interval**: milliseconds to spend on each frame
- **duration**: how long the attack lasts in milliseconds (optional; 0 or omitted = one pass)

## Example

Swing a sword for 500 ms when A is just pressed:

```
when mySprite: run attack frames [swordSwing] every 80 ms for 500 ms
```

triggered from your own code with:

```
on button A pressed
    run attack frames [swordSwing] every 80 ms for 500 ms
```
