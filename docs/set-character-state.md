# Set character state

Manually set the state of a sprite. This state remains in effect until you call "clear state" or set the state to something else. Invalid states (e.g. "moving" and "not moving") are ignored.

Note: a manual state completely replaces the automatic state — including button and attacking predicates — until it is cleared. To combine states (e.g. "moving" and "attacking"), build a single rule with both predicates instead.

## Parameters

- **sprite**: the sprite to set the state of
- **rule**: the state to set on the sprite
