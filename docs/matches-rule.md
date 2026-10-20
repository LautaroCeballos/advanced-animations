# Matches rule

Use to check the current state of a sprite against a rule. Returns `true` if every predicate in the rule is currently true for the sprite.

Be careful: sprites will only be facing a direction if they have an animation that uses one of the facing direction rules (e.g. facing left, facing up, etc.).

## Parameters

- **sprite**: the sprite to check
- **rule**: the rule to check

## Example

`if mySprite is attacking then ...`
