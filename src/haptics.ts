export class GamepadHapticManager {
    readonly gamepad: Gamepad;
    protected hapticActuators: GamepadHapticActuator[];
    constructor(gamepad: Gamepad) {
        this.gamepad = gamepad;
        this.init();
    }
    protected init() {
        this.hapticActuators = this.gamepad.vibrationActuator
            ? [this.gamepad.vibrationActuator]
            : (
                  this.gamepad as unknown as {
                      hapticActuators: GamepadHapticActuator[];
                  }
              ).hapticActuators;
    }
    vibrate(strength: number, duration: number, type: GamepadHapticEffectType) {
        if (this.hapticActuators[0].playEffect) {
            return this.vibrate_chrome(strength, duration, type);
        } else if ("pulse" in this.hapticActuators[0]) {
            return this.vibrate_firefox(strength, duration, type)
        }
    }
    protected async vibrate_chrome(
        strength: number,
        duration: number,
        type: GamepadHapticEffectType
    ): Promise<HapticResult> {
        try {
            const response = await this.hapticActuators[0].playEffect(type, {
                duration,
                strongMagnitude: strength,
                weakMagnitude: strength,
            });
            if (response === "complete") {
                return HapticResult.COMPLETED;
            } else {
                return HapticResult.SKIPPED;
            }
        } catch (e) {
            if (e.name === "NotSupportedError") {
                return HapticResult.UNSUPPORTED;
            } else {
                return HapticResult.FAILED
            }
        }
    }
    protected async vibrate_firefox(
        strength: number,
        duration: number,
        type?: GamepadHapticEffectType
    ): Promise<HapticResult> {
        const actuator = this.hapticActuators.find(
            (elem) => (elem as any).type === type || type === undefined
        );
        if (actuator) {
            if (await (actuator as any).pulse(strength, duration)) {
                return HapticResult.COMPLETED;
            } else {
                return HapticResult.FAILED;
            }
        }
        return HapticResult.UNSUPPORTED;
    }
    get vibration_types(): string[] {
        return Array.from(
            this.hapticActuators.reduce(
                (accumulator, currentValue) =>
                    accumulator.add(
                        (currentValue as any).effects ??
                            (currentValue as any).type
                    ),
                new Set()
            )
        ) as string[];
    }
    reset() {
        this.hapticActuators.forEach((a) => a.reset());
    }
}
export enum HapticResult {
    COMPLETED = "completed",
    SKIPPED = "preempted",
    UNSUPPORTED = "unsupported",
    FAILED = "failed",
}
