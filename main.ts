/**
 * Rules used to dictate when animations should be looped on
 * a sprite.
 *
 * These are redundant on purpose. We need to preserve the
 * number of predicates in a rule, so every predicate needs
 * to be unique. We favor rules that use more predicates.
 *
 * Bits 0-13 match microsoft/arcade-character-animations
 * exactly so existing rule behavior is preserved. Bits 14+
 * are additions for button and action button predicates.
 */
enum Predicate {
    //% block="sin moverse"
    NotMoving = 1,
    //% block="moviéndose"
    Moving = 1 << 1,
    //% block="mirando hacia arriba"
    FacingUp = 1 << 2,
    //% block="mirando hacia la derecha"
    FacingRight = 1 << 3,
    //% block="mirando hacia abajo"
    FacingDown = 1 << 4,
    //% block="mirando hacia la izquierda"
    FacingLeft = 1 << 5,
    //% block="moviéndose hacia arriba"
    MovingUp = 1 << 6,
    //% block="moviéndose hacia la derecha"
    MovingRight = 1 << 7,
    //% block="moviéndose hacia abajo"
    MovingDown = 1 << 8,
    //% block="moviéndose hacia la izquierda"
    MovingLeft = 1 << 9,
    //% block="chocando con pared arriba"
    HittingWallUp = 1 << 10,
    //% block="chocando con pared derecha"
    HittingWallRight = 1 << 11,
    //% block="chocando con pared abajo"
    HittingWallDown = 1 << 12,
    //% block="chocando con pared izquierda"
    HittingWallLeft = 1 << 13,
    //% block="botón A presionado"
    ButtonA = 1 << 14,
    //% block="botón B presionado"
    ButtonB = 1 << 15,
    //% block="botón A recién presionado"
    ButtonAJust = 1 << 16,
    //% block="botón B recién presionado"
    ButtonBJust = 1 << 17,
    //% block="botón de acción presionado"
    Action = 1 << 18,
    //% block="botón de acción recién presionado"
    ActionJust = 1 << 19,
}

//% color="#7d6282" icon="\uf03d" block="Character+"
namespace animations {
    export type Rule = number;

    export enum FacingDirection {
        //% block="arriba"
        //% blockIdentity="animations._direction"
        Up = Predicate.FacingUp,
        //% block="derecha"
        //% blockIdentity="animations._direction"
        Right = Predicate.FacingRight,
        //% block="abajo"
        //% blockIdentity="animations._direction"
        Down = Predicate.FacingDown,
        //% block="izquierda"
        //% blockIdentity="animations._direction"
        Left = Predicate.FacingLeft,
    }

    /**
     * A controller button that acts as the sprite's action button.
     */
    export enum ActionButton {
        //% block="A"
        //% blockIdentity="animations._actionButton"
        A = 1,
        //% block="B"
        //% blockIdentity="animations._actionButton"
        B = 2,
        //% block="arriba"
        //% blockIdentity="animations._actionButton"
        Up = 3,
        //% block="abajo"
        //% blockIdentity="animations._actionButton"
        Down = 4,
        //% block="izquierda"
        //% blockIdentity="animations._actionButton"
        Left = 5,
        //% block="derecha"
        //% blockIdentity="animations._actionButton"
        Right = 6,
    }

    const FACING = Predicate.FacingUp | Predicate.FacingRight | Predicate.FacingDown | Predicate.FacingLeft;
    const MOVING = Predicate.MovingUp | Predicate.MovingRight | Predicate.MovingDown | Predicate.MovingLeft | Predicate.Moving;

    let sceneStack: CharacterAnimationSceneState[];

    class CharacterAnimationSceneState {
        public characters: CharacterState[];

        constructor() {
            this.characters = [];
        }

        update() {
            const dt = game.currentScene().eventContext.deltaTimeMillis;

            let cleanup = false;
            for (const character of this.characters) {
                if (character.sprite.flags & sprites.Flag.Destroyed) cleanup = true;
                character.update(dt);
            }

            if (cleanup) {
                this.characters = this.characters.filter(character => !(character.sprite.flags & sprites.Flag.Destroyed))
            }
        }
    }

    class CharacterAnimation {
        startFrames: Image[];
        loopFrames: Image[];
        startInterval: number;
        loopInterval: number;

        constructor(public rule: Rule) {
        }
    }

    class CharacterState {
        protected animations: CharacterAnimation[];
        protected lastState: number;
        protected current: CharacterAnimation;
        protected possibleFacingDirections: number;
        protected enabled: boolean;

        protected lastX: number;
        protected lastY: number;

        protected runningStartFrames: boolean;

        protected timer: number;
        protected frame: number;

        protected manualFlags: number;

        protected controller: controller.Controller;
        protected lockedFacingDirection: number;

        protected actionButton: ActionButton;
        protected prevA: boolean;
        protected prevB: boolean;
        protected prevAction: boolean;

        protected forcedAnimation: CharacterAnimation;
        protected forcedFrames: Image[];
        protected forcedInterval: number;
        protected forcedLoop: boolean;
        protected forcedTimer: number;
        protected forcedFrame: number;
        protected forcedRunning: boolean;

        protected triggers: Array<{
            frames: Image[],
            interval: number,
            rule: Rule,
            loop: boolean,
            lastMatch: boolean
        }> = [];

        constructor(public sprite: Sprite) {
            this.animations = [];
            this.timer = 0;
            this.frame = 0;
            this.lastState = Predicate.FacingRight;
            this.possibleFacingDirections = 0;
            this.enabled = true;
            this.lastX = sprite.x;
            this.lastY = sprite.y;
            this.manualFlags = 0;
            this.actionButton = ActionButton.A;
            this.prevA = false;
            this.prevB = false;
            this.prevAction = false;
            this.forcedAnimation = null;
            this.forcedFrames = null;
            this.forcedInterval = 0;
            this.forcedLoop = false;
            this.forcedTimer = 0;
            this.forcedFrame = 0;
            this.forcedRunning = false;
            this.triggers = [];

        setFrames(loop: boolean, frames: Image[], interval: number, rule: Rule) {
            this.possibleFacingDirections |= (rule & FACING);
            for (const animation of this.animations) {
                if (animation.rule === rule) {
                    if (loop) {
                        animation.loopFrames = frames;
                        animation.loopInterval = interval;
                    }
                    else {
                        animation.startFrames = frames;
                        animation.startInterval = interval;
                    }
                    return;
                }
            }

            const anim = new CharacterAnimation(rule);

            if (loop) {
                anim.loopFrames = frames;
                anim.loopInterval = interval;
            }
            else {
                anim.startFrames = frames;
                anim.startInterval = interval;
            }

            this.animations.push(anim);
        }

        setLoopFrames(frames: Image[], interval: number, rule: Rule) {
            this.setFrames(true, frames, interval, rule);
        }

        setStartFrames(frames: Image[], interval: number, rule: Rule) {
            this.setFrames(false, frames, interval, rule);
        }

        updateButtons() {
            const c = this.controller || controller.player1;
            const a = c.A.isPressed();
            const b = c.B.isPressed();

            let action = false;
            switch (this.actionButton) {
                case ActionButton.A: action = a; break;
                case ActionButton.B: action = b; break;
                case ActionButton.Up: action = c.up.isPressed(); break;
                case ActionButton.Down: action = c.down.isPressed(); break;
                case ActionButton.Left: action = c.left.isPressed(); break;
                case ActionButton.Right: action = c.right.isPressed(); break;
            }

            const justA = a && !this.prevA;
            const justB = b && !this.prevB;
            const justAction = action && !this.prevAction;

            this.prevA = a;
            this.prevB = b;
            this.prevAction = action;

            let flags = 0;
            if (a) flags |= Predicate.ButtonA;
            if (b) flags |= Predicate.ButtonB;
            if (justA) flags |= Predicate.ButtonAJust;
            if (justB) flags |= Predicate.ButtonBJust;
            if (action) flags |= Predicate.Action;
            if (justAction) flags |= Predicate.ActionJust;

            return flags;
        }

        update(dt: number) {
            if (this.enabled && !this.forcedAnimation && this.triggers && this.triggers.length) {
                let state = 0;

                if (this.sprite.vx | this.sprite.vy) {
                    state |= Predicate.Moving;

                    if (this.sprite.vx > 0) {
                        state |= (Predicate.FacingRight & this.possibleFacingDirections) | Predicate.MovingRight;
                    }
                    else if (this.sprite.vx < 0) {
                        state |= (Predicate.FacingLeft & this.possibleFacingDirections) | Predicate.MovingLeft;
                    }

                    if (this.sprite.vy > 0) {
                        state |= (Predicate.FacingDown & this.possibleFacingDirections) | Predicate.MovingDown;
                    }
                    else if (this.sprite.vy < 0) {
                        state |= (Predicate.FacingUp & this.possibleFacingDirections) | Predicate.MovingUp;
                    }

                    if (!(state & FACING)) {
                        state |= (this.lastState & FACING);
                    }
                }
                else if (this.sprite.x != this.lastX || this.sprite.y != this.lastY && (this.lastX != undefined && this.lastY != undefined)) {
                    state |= Predicate.Moving;

                    if (this.sprite.x > this.lastX) {
                        state |= (Predicate.FacingRight & this.possibleFacingDirections) | Predicate.MovingRight;
                    }
                    else if (this.sprite.x < this.lastX) {
                        state |= (Predicate.FacingLeft & this.possibleFacingDirections) | Predicate.MovingLeft;
                    }

                    if (this.sprite.y > this.lastY) {
                        state |= (Predicate.FacingDown & this.possibleFacingDirections) | Predicate.MovingDown;
                    }
                    else if (this.sprite.y < this.lastY) {
                        state |= (Predicate.FacingUp & this.possibleFacingDirections) | Predicate.MovingUp;
                    }

                    if (!(state & FACING)) {
                        state |= (this.lastState & FACING);
                    }
                }
                else {
                    state |= Predicate.NotMoving;
                    state |= (this.lastState & FACING);
                }

                if (this.sprite.isHittingTile(CollisionDirection.Bottom)) {
                    state |= Predicate.HittingWallDown;
                }
                if (this.sprite.isHittingTile(CollisionDirection.Top)) {
                    state |= Predicate.HittingWallUp;
                }
                if (this.sprite.isHittingTile(CollisionDirection.Right)) {
                    state |= Predicate.HittingWallRight;
                }
                if (this.sprite.isHittingTile(CollisionDirection.Left)) {
                    state |= Predicate.HittingWallLeft;
                }

                state |= this.updateButtons();

                if (this.lockedFacingDirection) {
                    state = (state & ~FACING) | this.lockedFacingDirection;
                }
                else if (this.controller) {
                    let facing = 0;
                    if (this.controller.up.isPressed() && Predicate.FacingUp & this.possibleFacingDirections) {
                        facing |= Predicate.FacingUp;
                    }
                    else if (this.controller.down.isPressed() && Predicate.FacingDown & this.possibleFacingDirections) {
                        facing |= Predicate.FacingDown;
                    }

                    if (this.controller.left.isPressed() && Predicate.FacingLeft & this.possibleFacingDirections) {
                        facing |= Predicate.FacingLeft;
                    }
                    else if (this.controller.right.isPressed() && Predicate.FacingRight & this.possibleFacingDirections) {
                        facing |= Predicate.FacingRight;
                    }

                    state &= ~FACING;

                    if (facing) {
                        state |= facing;
                    }
                    else if (this.lastState & FACING) {
                        state |= (this.lastState & FACING);
                    }
                }

                const currentState = this.manualFlags || state;

                for (const t of this.triggers) {
                    const matches = !((currentState & t.rule) ^ t.rule);
                    if (matches && !t.lastMatch) {
                        t.lastMatch = true;
                        if (!this.forcedAnimation) {
                            this.playForcedAnimation(t.frames, t.interval, t.loop);
                        }
                        break;
                    } else if (!matches) {
                        t.lastMatch = false;
                    }
                }
            }

            if (this.forcedAnimation && this.enabled) {
                this.forcedTimer += dt;

                if (this.forcedRunning) {
                    while (this.forcedTimer >= this.forcedInterval && this.forcedRunning && this.forcedFrames) {
                        this.forcedTimer -= this.forcedInterval;
                        this.forcedFrame++;

                        if (this.forcedFrame >= this.forcedFrames.length) {
                            if (this.forcedLoop && this.current && this.current.loopFrames) {
                                this.forcedAnimation = null;
                                this.forcedFrames = null;
                                this.forcedRunning = false;
                            } else if (this.current) {
                                this.forcedAnimation = null;
                                this.forcedFrames = null;
                                this.forcedRunning = false;
                                this.frame = 0;
                                this.timer = 0;
                                this.runningStartFrames = !!(this.current.startFrames);
                                if (this.enabled) {
                                    if (this.runningStartFrames) {
                                        this.sprite.setImage(this.current.startFrames[0]);
                                    } else if (this.current.loopFrames) {
                                        this.sprite.setImage(this.current.loopFrames[0]);
                                    }
                                }
                            } else {
                                this.forcedAnimation = null;
                                this.forcedFrames = null;
                                this.forcedRunning = false;
                            }
                        } else {
                            this.sprite.setImage(this.forcedFrames[this.forcedFrame]);
                        }
                    }
                } else if (this.forcedLoop && this.forcedFrames) {
                    while (this.forcedTimer >= this.forcedInterval) {
                        this.forcedTimer -= this.forcedInterval;
                        this.forcedFrame = (this.forcedFrame + 1) % this.forcedFrames.length;
                        this.sprite.setImage(this.forcedFrames[this.forcedFrame]);
                    }
                }

                this.lastX = this.sprite.x;
                this.lastY = this.sprite.y;
                return;
            }

            let state = 0;

            if (this.sprite.vx | this.sprite.vy) {
                state |= Predicate.Moving;

                if (this.sprite.vx > 0) {
                    state |= (Predicate.FacingRight & this.possibleFacingDirections) | Predicate.MovingRight;
                }
                else if (this.sprite.vx < 0) {
                    state |= (Predicate.FacingLeft & this.possibleFacingDirections) | Predicate.MovingLeft
                }

                if (this.sprite.vy > 0) {
                    state |= (Predicate.FacingDown & this.possibleFacingDirections) | Predicate.MovingDown;
                }
                else if (this.sprite.vy < 0) {
                    state |= (Predicate.FacingUp & this.possibleFacingDirections) | Predicate.MovingUp
                }

                if (!(state & FACING)) {
                    state |= (this.lastState & FACING)
                }
            }
            else if (this.sprite.x != this.lastX || this.sprite.y != this.lastY && (this.lastX != undefined && this.lastY != undefined)) {
                state |= Predicate.Moving;

                if (this.sprite.x > this.lastX) {
                    state |= (Predicate.FacingRight & this.possibleFacingDirections) | Predicate.MovingRight;
                }
                else if (this.sprite.x < this.lastX) {
                    state |= (Predicate.FacingLeft & this.possibleFacingDirections) | Predicate.MovingLeft
                }

                if (this.sprite.y > this.lastY) {
                    state |= (Predicate.FacingDown & this.possibleFacingDirections) | Predicate.MovingDown;
                }
                else if (this.sprite.y < this.lastY) {
                    state |= (Predicate.FacingUp & this.possibleFacingDirections) | Predicate.MovingUp
                }

                if (!(state & FACING)) {
                    state |= (this.lastState & FACING)
                }
            }
            else {
                state |= Predicate.NotMoving;
                state |= (this.lastState & FACING);
            }

            if (this.sprite.isHittingTile(CollisionDirection.Bottom)) {
                state |= Predicate.HittingWallDown;
            }
            if (this.sprite.isHittingTile(CollisionDirection.Top)) {
                state |= Predicate.HittingWallUp;
            }
            if (this.sprite.isHittingTile(CollisionDirection.Right)) {
                state |= Predicate.HittingWallRight;
            }
            if (this.sprite.isHittingTile(CollisionDirection.Left)) {
                state |= Predicate.HittingWallLeft;
            }

            // Button predicates are additive: they never clear movement
            // predicates, so walk/idle rules keep matching.
            state |= this.updateButtons();

            this.lastX = this.sprite.x;
            this.lastY = this.sprite.y;

            if (this.lockedFacingDirection) {
                state = (state & ~FACING) | this.lockedFacingDirection;
            }
            // If this sprite is controlled by a controller, use that to
            // determine facing direction
            else if (this.controller) {
                let facing = 0;
                if (this.controller.up.isPressed() && Predicate.FacingUp & this.possibleFacingDirections) {
                    facing |= Predicate.FacingUp;
                }
                else if (this.controller.down.isPressed() && Predicate.FacingDown & this.possibleFacingDirections) {
                    facing |= Predicate.FacingDown;
                }

                if (this.controller.left.isPressed() && Predicate.FacingLeft & this.possibleFacingDirections) {
                    facing |= Predicate.FacingLeft;
                }
                else if (this.controller.right.isPressed() && Predicate.FacingRight & this.possibleFacingDirections) {
                    facing |= Predicate.FacingRight;
                }

                state &= ~FACING;

                if (facing) {
                    state |= facing;
                }
                else if (this.lastState & FACING) {
                    state |= (this.lastState & FACING);
                }
                else if (this.possibleFacingDirections & Predicate.FacingLeft) {
                    state |= Predicate.FacingLeft;
                }
                else if (this.possibleFacingDirections & Predicate.FacingDown) {
                    state |= Predicate.FacingDown;
                }
                else if (this.possibleFacingDirections & Predicate.FacingUp) {
                    state |= Predicate.FacingUp;
                }
                else if (this.possibleFacingDirections & Predicate.FacingRight) {
                    state |= Predicate.FacingRight;
                }
            }

            const newAnimation = this.pickRule(this.manualFlags || state);

            if (newAnimation !== this.current) {
                this.frame = 0;
                this.timer = 0;

                this.runningStartFrames = !!(newAnimation && newAnimation.startFrames);

                this.current = newAnimation;

                if (this.current && this.enabled) {
                    if (this.runningStartFrames) {
                        this.sprite.setImage((this.current.startFrames[0]))
                    }
                    else {
                        this.sprite.setImage((this.current.loopFrames[0]))
                    }
                }
            }

            if (!this.current || !this.enabled) return;

            this.timer += dt;

            if (this.runningStartFrames) {
                while (this.timer >= this.current.startInterval && this.runningStartFrames) {
                    this.timer -= this.current.startInterval;
                    this.frame++;

                    if (this.frame >= this.current.startFrames.length) {
                        this.runningStartFrames = false;
                        if (this.current.loopFrames) {
                            this.sprite.setImage(this.current.loopFrames[0]);
                            this.timer = 0;
                            this.frame = 0;
                        }
                    }
                    else {
                        this.sprite.setImage(this.current.startFrames[this.frame])
                    }
                }
            }
            else if (this.current.loopFrames) {
                while (this.timer >= this.current.loopInterval) {
                    this.timer -= this.current.loopInterval;
                    this.frame = (this.frame + 1) % this.current.loopFrames.length;

                    this.sprite.setImage(this.current.loopFrames[this.frame])
                }
            }
        }

        playForcedAnimation(frames: Image[], interval: number, loop: boolean) {
            if (!this.enabled || !frames || !frames.length) return;
            if (Number.isNaN(interval) || interval < 5) interval = 5;

            this.forcedFrames = frames;
            this.forcedInterval = interval;
            this.forcedLoop = loop;
            this.forcedTimer = 0;
            this.forcedFrame = 0;
            this.forcedRunning = !loop;
            this.forcedAnimation = new CharacterAnimation(0);

            this.sprite.setImage(this.forcedFrames[0]);
        }

        addTrigger(frames: Image[], interval: number, rule: Rule, loop: boolean) {
            if (!frames || !frames.length || !rule) return;
            if (Number.isNaN(interval) || interval < 5) interval = 5;
            if (!this.triggers) this.triggers = [];
            this.triggers.push({
                frames: frames,
                interval: interval,
                rule: rule,
                loop: loop,
                lastMatch: false
            });
        }

        matchesRule(rule: Rule) {
            return !(((this.manualFlags || this.lastState) & rule) ^ rule);
        }

        setEnabled(enabled: boolean) {
            if (this.enabled === enabled) return;

            this.enabled = enabled;
            if (enabled) {
                if (this.current) {
                    if (this.runningStartFrames) {
                        this.sprite.setImage(this.current.startFrames[this.frame])
                    }
                    else {
                        this.sprite.setImage(this.current.loopFrames[this.frame])
                    }
                }
                this.lastX = undefined;
                this.lastY = undefined;
            }
        }

        setController(controller: controller.Controller) {
            this.controller = controller;
        }

        lockFacingDirection(direction: number) {
            this.lockedFacingDirection = direction;
        }

        setActionButton(button: ActionButton) {
            this.actionButton = button;
        }

        setManualFlags(flags: Rule) {
            // Check if invalid
            flags = rule(flags);
            if (!flags) return;

            this.manualFlags = flags;
        }

        clearState() {
            this.manualFlags = 0;
            this.lastState = 0;
        }

        protected pickRule(state: number) {
            this.lastState = state;

            // If we have multiple animations with the same best score, we
            // want to prioritize the current animation and then the rest
            // by the order they were added
            let best = this.current;
            let bestScore = this.current && score(state, best.rule);
            let currentScore: number;

            for (const animation of this.animations) {
                currentScore = score(state, animation.rule);
                if (currentScore > bestScore) {
                    bestScore = currentScore;
                    best = animation;
                }
            }

            if (bestScore === 0 || bestScore == undefined) return null;

            return best;
        }
    }

    function init() {
        if (sceneStack) {
            if (!sceneStack.length) {
                initScene();
            }
            return;
        }
        sceneStack = [];

        game.addScenePushHandler(initScene);

        game.addScenePopHandler(function (oldScene: scene.Scene) {
            sceneStack.pop();
        });

        initScene();
    }

    function initScene() {
        sceneStack.push(new CharacterAnimationSceneState());
        const sceneState = sceneStack[sceneStack.length - 1];

        game.currentScene().eventContext.registerFrameHandler(scene.ANIMATION_UPDATE_PRIORITY, function () {
            if (sceneState) {
                sceneState.update();
            }
        });
    }

    function score(state: number, rule: Rule) {
        let res = 0;
        let check = state & rule;

        if (check ^ rule) return 0;

        while (check) {
            if (check & 1) ++res;
            check >>= 1;
        }

        return res;
    }

    function getStateForSprite(sprite: Sprite, createIfNotFound: boolean) {
        init();

        if (!sprite) return undefined;

        const sceneState = sceneStack[sceneStack.length - 1];
        for (const state of sceneState.characters) {
            if (state.sprite === sprite) {
                return state;
            }
        }

        if (createIfNotFound) {
            const newState = new CharacterState(sprite);
            sceneState.characters.push(newState);
            return newState;
        }
        return undefined;
    }

    export function ruleToString(rule: Rule) {
        let out = "";
        if (rule & Predicate.NotMoving) {
            out += "not-moving "
        }
        if (rule & Predicate.Moving) {
            out += "moving "
        }
        if (rule & Predicate.FacingUp) {
            out += "facing-up "
        }
        if (rule & Predicate.FacingRight) {
            out += "facing-right "
        }
        if (rule & Predicate.FacingDown) {
            out += "facing-down "
        }
        if (rule & Predicate.FacingLeft) {
            out += "facing-left "
        }
        if (rule & Predicate.MovingUp) {
            out += "moving-up "
        }
        if (rule & Predicate.MovingRight) {
            out += "moving-right "
        }
        if (rule & Predicate.MovingDown) {
            out += "moving-down "
        }
        if (rule & Predicate.MovingLeft) {
            out += "moving-left "
        }
        if (rule & Predicate.HittingWallUp) {
            out += "hitting-wall-up "
        }
        if (rule & Predicate.HittingWallRight) {
            out += "hitting-wall-right "
        }
        if (rule & Predicate.HittingWallDown) {
            out += "hitting-wall-down "
        }
        if (rule & Predicate.HittingWallLeft) {
            out += "hitting-wall-left "
        }
        if (rule & Predicate.ButtonA) {
            out += "button-a "
        }
        if (rule & Predicate.ButtonB) {
            out += "button-b "
        }
        if (rule & Predicate.ButtonAJust) {
            out += "button-a-just "
        }
        if (rule & Predicate.ButtonBJust) {
            out += "button-b-just "
        }
        if (rule & Predicate.Action) {
            out += "action-button "
        }
        if (rule & Predicate.ActionJust) {
            out += "action-button-just "
        }

        return out.trim();
    }

    /**
     * Loops the passed frames on the sprite at the given interval whenever
     * the specified rule is true for that sprite.
     *
     * If more than one rule applies, the most specific rule will be used.
     * If multiple rules are equally specific, the currently executing rule
     * is favored (or one is chosen at random).
     *
     *
     * @param sprite    the sprite to animate
     * @param frames    the images that make up that animation
     * @param frameInterval the amount of time to spend on each frame in milliseconds
     * @param rule      the rule that decides when this animation will play
     */
    //% blockId=animations_loop_frames
    //% block="$sprite repetir animación $frames $frameInterval cuando $rule"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% frames.shadow=animation_editor
    //% frameInterval.shadow=timePicker
    //% rule.shadow=animations_make_rule
    //% weight=100
    //% blockGap=8
    //% help=github:pxt-advanced-animations/docs/loop-character-animation
    export function loopFrames(sprite: Sprite, frames: Image[], frameInterval: number, rule: Rule) {
        init();
        if (!sprite || !frames || !frames.length || !rule) return;
        if (Number.isNaN(frameInterval) || frameInterval < 5) frameInterval = 5;

        const state = getStateForSprite(sprite, true);
        state.setLoopFrames(frames, frameInterval, rule);
    }

    /**
     * Runs the passed frames on the sprite at the given interval whenever
     * the specified rule begins to be true for that sprite. If there are loop
     * frames for a rule, they will take effect after the run is complete.
     *
     * If more than one rule applies, the most specific rule will be used.
     * If multiple rules are equally specific, the currently executing rule
     * is favored (or one is chosen at random).
     *
     *
     * @param sprite    the sprite to animate
     * @param frames    the images that make up that animation
     * @param frameInterval the amount of time to spend on each frame in milliseconds
     * @param rule      the rule that decides when this animation will play
     */
    //% blockId=animations_run_frames
    //% block="$sprite ejecutar animación $frames $frameInterval cuando $rule se vuelva true"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% frames.shadow=animation_editor
    //% frameInterval.shadow=timePicker
    //% rule.shadow=animations_make_rule
    //% weight=90
    //% help=github:pxt-advanced-animations/docs/run-character-animation
    export function runFrames(sprite: Sprite, frames: Image[], frameInterval: number, rule: Rule) {
        init();
        if (!sprite || !frames || !frames.length || !rule) return;
        if (Number.isNaN(frameInterval) || frameInterval < 5) frameInterval = 5;

        const state = getStateForSprite(sprite, true);
        state.setStartFrames(frames, frameInterval, rule);
    }

    /**
     * Use to check the current state of a sprite. Be careful, sprites
     * will only be facing a direction if they have an animation
     * that uses the one of the facing direction rules (e.g. FacingLeft, FacingUp, etc.).
     *
     *
     * @param sprite    The sprite to check the state of
     * @param rule      The rule to check
     */
    //% blockId=animations_is_facing
    //% block="$sprite es $rule"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% rule.shadow=animations_make_rule
    //% weight=80
    //% help=github:pxt-advanced-animations/docs/matches-rule
    export function matchesRule(sprite: Sprite, rule: Rule): boolean {
        const existing = getStateForSprite(sprite, false);
        if (existing) return existing.matchesRule(rule);

        // If this sprite isn't in the system, then do the best we can. Note that this
        // logic is slightly different than the logic above because we do not have a list
        // of possible facing directions to narrow by or a reliable last x/y or an existing
        let state = 0;
        if (sprite.vx | sprite.vy) {
            state |= Predicate.Moving;

            if (sprite.vx > 0) {
                state |= Predicate.FacingRight | Predicate.MovingRight;
            }
            else if (sprite.vx < 0) {
                state |= Predicate.FacingLeft | Predicate.MovingLeft
            }

            if (sprite.vy > 0) {
                state |= Predicate.FacingDown | Predicate.MovingDown;
            }
            else if (sprite.vy < 0) {
                state |= Predicate.FacingUp | Predicate.MovingUp
            }
        }
        else {
            state |= Predicate.NotMoving;
        }

        if (sprite.isHittingTile(CollisionDirection.Bottom)) {
            state |= Predicate.HittingWallDown;
        }
        if (sprite.isHittingTile(CollisionDirection.Top)) {
            state |= Predicate.HittingWallUp;
        }
        if (sprite.isHittingTile(CollisionDirection.Right)) {
            state |= Predicate.HittingWallRight;
        }
        if (sprite.isHittingTile(CollisionDirection.Left)) {
            state |= Predicate.HittingWallLeft;
        }

        if (controller.player1.A.isPressed()) {
            state |= Predicate.ButtonA;
        }
        if (controller.player1.B.isPressed()) {
            state |= Predicate.ButtonB;
        }

        return !((state & rule) ^ rule);
    }

    /**
     * Enable or disable all rule animations on the specified sprite.
     * This is useful for temporarily turning off animations while
     * another animation plays (e.g. an attack animation)
     *
     *
     * @param sprite    The sprite to enable/disable animations on
     * @param enabled   True to enable, false to disable
     */
    //% blockId=animations_set_enabled
    //% block="$sprite activar animaciones de personaje $enabled"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% weight=70
    //% blockGap=8
    //% help=github:pxt-advanced-animations/docs/set-character-animations-enabled
    export function setCharacterAnimationsEnabled(sprite: Sprite, enabled: boolean) {
        const state = getStateForSprite(sprite, false);
        if (!state) return;

        state.setEnabled(enabled);
    }

    /**
     * Manually set the state of a sprite. This state will remain in
     * effect until you call clear state or set the state to something else.
     * Invalid states (i.e. "moving" and "not moving") are ignored.
     *
     * Note: a manual state completely replaces the automatic state
     * (including button predicates) until it is cleared.
     *
     *
     * @param sprite    The sprite to set the state of
     * @param rule      The state to set on the sprite
     */
    //% blockId=animations_set_state
    //% block="$sprite establecer estado a $rule"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% rule.shadow=animations_make_rule
    //% weight=60
    //% blockGap=8
    //% help=github:pxt-advanced-animations/docs/set-character-state
    export function setCharacterState(sprite: Sprite, rule: Rule) {
        const state = getStateForSprite(sprite, true);
        state.setManualFlags(rule);
    }

    /**
     * Clear the current state of the sprite. This will also disable any
     * manually set state and re-enable automatic state tracking.
     *
     *
     * @param sprite    The sprite to clear the state of
     */
    //% blockId=animations_clear_state
    //% block="$sprite limpiar estado"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% weight=50
    //% help=github:pxt-advanced-animations/docs/clear-character-state
    export function clearCharacterState(sprite: Sprite) {
        const state = getStateForSprite(sprite, false);
        if (state) state.clearState();
    }

    /**
     * Plays an animation immediately on the sprite, taking priority
     * over rule-based animations. Can be used in events like "on button pressed".
     *
     * @param sprite        The sprite to animate
     * @param frames        The images that make up the animation
     * @param frameInterval The amount of time to spend on each frame in milliseconds
     * @param loop          True to loop the animation, false to play once
     */
    //% blockId=animations_play_animation
    //% block="$sprite reproducir animación $frames $frameInterval||repetir $loop"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% frames.shadow=animation_editor
    //% frameInterval.shadow=timePicker
    //% loop.defl=false
    //% weight=49
    //% blockGap=8
    export function playAnimation(sprite: Sprite, frames: Image[], frameInterval: number, loop: boolean = false) {
        init();
        if (!sprite || !frames || !frames.length) return;
        if (Number.isNaN(frameInterval) || frameInterval < 5) frameInterval = 5;

        const state = getStateForSprite(sprite, true);
        state.playForcedAnimation(frames, frameInterval, loop);
    }

    /**
     * Plays an animation with priority when the specified rule becomes true
     * (e.g. when pressing a button, or when moving in a direction). The animation
     * takes priority over rule-based animations while playing.
     *
     * @param sprite        The sprite to animate
     * @param frames        The images that make up the animation
     * @param frameInterval The amount of time to spend on each frame in milliseconds
     * @param rule          The rule that triggers the animation
     * @param loop          True to loop the animation, false to play once
     */
    //% blockId=animations_play_on_rule
    //% block="$sprite reproducir animación $frames $frameInterval cuando $rule se active||repetir $loop"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% frames.shadow=animation_editor
    //% frameInterval.shadow=timePicker
    //% rule.shadow=animations_make_rule
    //% loop.defl=false
    //% weight=48
    //% blockGap=8
    export function playAnimationOnRule(sprite: Sprite, frames: Image[], frameInterval: number, rule: Rule, loop: boolean = false) {
        init();
        if (!sprite || !frames || !frames.length || !rule) return;
        if (Number.isNaN(frameInterval) || frameInterval < 5) frameInterval = 5;

        const state = getStateForSprite(sprite, true);
        state.addTrigger(frames, frameInterval, rule, loop);
    }

    /**
     * Sets the controller that controls this sprite. When enabled, the directional
     * buttons of the controller will set the facing direction of the sprite instead
     * of the velocity and position changes. Button predicates (button A pressed,
     * action button pressed, etc.) are also read from this controller.
     *
     *
     * @param sprite The sprite to set the controller for
     * @param enabled True if this sprite is controlled by a controller, false otherwise
     * @param controlledBy The controller that controls this sprite. If not specified, player 1 controller is used.
     */
    //% blockId=animations_set_controller
    //% block="$sprite controlar dirección con botones $enabled||$controlledBy"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% weight=48
    //% blockGap=8
    //% group="Dirección"
    //% help=github:pxt-advanced-animations/docs/set-controller
    export function setController(sprite: Sprite, enabled: boolean, controlledBy?: controller.Controller) {
        if (enabled) {
            if (!controlledBy) {
                controlledBy = controller.player1;
            }
        }
        else {
            controlledBy = null;
        }

        const state = getStateForSprite(sprite, true);
        state.setController(controlledBy);
    }

    /**
     * Locks the direction that the sprite is facing to the specified direction. While locked,
     * the sprite will always be facing that direction regardless of movement or controller input.
     *
     *
     * @param sprite The sprite to lock the facing direction for
     * @param direction The direction to lock the sprite's facing direction to
     */
    //% blockId=animations_lock_facing_direction
    //% block="$sprite fijar dirección a $direction"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% direction.shadow=animations_facing_direction
    //% weight=45
    //% blockGap=8
    //% group="Dirección"
    //% help=github:pxt-advanced-animations/docs/lock-facing-direction
    export function lockFacingDirection(sprite: Sprite, direction: number) {
        const state = getStateForSprite(sprite, true);
        state.lockFacingDirection(direction);
    }

    /**
     * Unlocks the facing direction of the specified sprite, allowing it to change
     * based on movement and controller input again. This only has an effect if
     * the facing direction was previously locked.
     *
     *
     * @param sprite The sprite to unlock the facing direction for
     */
    //% blockId=animations_unlock_facing_direction
    //% block="$sprite liberar dirección"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% weight=44
    //% blockGap=8
    //% group="Dirección"
    //% help=github:pxt-advanced-animations/docs/unlock-facing-direction
    export function unlockFacingDirection(sprite: Sprite) {
        const state = getStateForSprite(sprite, false);
        if (state) {
            state.lockFacingDirection(0);
        }
    }

    /**
     * Picks the controller button used by the "action button pressed" and
     * "action button just pressed" predicates for this sprite. Player 1's
     * buttons are used unless a different controller is configured.
     *
     *
     * @param sprite The sprite to set the action button for
     * @param button The button that acts as the sprite's action button
     */
    //% blockId=animations_set_action_button
    //% block="$sprite usar botón de acción $button"
    //% sprite.defl=mySprite
    //% sprite.shadow=variables_get
    //% button.shadow=animations_action_button
    //% weight=42
    //% blockGap=8
    //% group="Botones"
    //% help=github:pxt-advanced-animations/docs/set-action-button
    export function setActionButton(sprite: Sprite, button: ActionButton) {
        const state = getStateForSprite(sprite, true);
        state.setActionButton(button);
    }

    /**
     * Constructs a rule for checking the state of a sprite. Rules
     * with more clauses will override rules with fewer clauses. Invalid
     * rules (e.g. "moving left AND moving right") are ignored.
     */
    //% blockId=animations_make_rule
    //% block="$p1||y $p2 y $p3 y $p4 y $p5 y $p6 y $p7"
    //% inlineInputMode=inline
    //% p1.shadow=animations_predicate
    //% p2.shadow=animations_predicate
    //% p3.shadow=animations_predicate
    //% p4.shadow=animations_predicate
    //% p5.shadow=animations_predicate
    //% p6.shadow=animations_predicate
    //% p7.shadow=animations_predicate
    //% weight=40
    //% blockGap=8
    //% help=github:pxt-advanced-animations/docs/rule
    export function rule(p1: number, p2?: number, p3?: number, p4?: number, p5?: number, p6?: number, p7?: number): Rule {
        let rule = p1;
        if (p2) rule |= p2;
        if (p3) rule |= p3;
        if (p4) rule |= p4;
        if (p5) rule |= p5;
        if (p6) rule |= p6;
        if (p7) rule |= p7;

        // Check for invalid rules
        if (
            // Moving and not moving
            (rule & Predicate.NotMoving) && (rule & MOVING) ||
            // moving/facing left and right
            (rule & (Predicate.MovingLeft | Predicate.FacingLeft)) && (rule & (Predicate.MovingRight | Predicate.FacingRight)) ||
            // moving/facing up and down
            (rule & (Predicate.MovingUp | Predicate.FacingUp)) && (rule & (Predicate.MovingDown | Predicate.FacingDown)) ||

            // moving down and on ground
            (rule & Predicate.MovingDown) && (rule & Predicate.HittingWallDown) ||
            // moving up and on ceiling
            (rule & Predicate.MovingUp) && (rule & Predicate.HittingWallUp) ||
            // moving right and on right wall
            (rule & Predicate.MovingRight) && (rule & Predicate.HittingWallRight) ||
            // moving left and on left wall
            (rule & Predicate.MovingLeft) && (rule & Predicate.HittingWallLeft)
        ) {
            return 0;
        }

        return rule;
    }

    /**
     * A clause for a sprite animation rule.
     */
    //% blockId=animations_predicate block="$predicate"
    //% shim=TD_ID
    //% weight=20
    //% help=github:pxt-advanced-animations/docs/predicate
    export function _predicate(predicate: Predicate): number {
        return predicate
    }

    /**
     * A direction a sprite can face
     */
    //% blockId=animations_facing_direction block="$direction"
    //% shim=TD_ID
    //% weight=11
    //% group="Facing"
    //% help=github:pxt-advanced-animations/docs/facing-direction
    export function _direction(direction: FacingDirection): number {
        return direction;
    }

    /**
     * A controller button that can act as a sprite's action button
     */
    //% blockId=animations_action_button block="$button"
    //% shim=TD_ID
    //% weight=10
    //% group="Buttons"
    //% help=github:pxt-advanced-animations/docs/set-action-button
    export function _actionButton(button: ActionButton): number {
        return button;
    }
}
