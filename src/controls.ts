import type * as kt from "kaplay";
import k from "./main"
export type GamepadControlMapping = Array<kt.KGamepadButton | "left-x" | "left-y" | "left-xy" | "right-x" | "right-y" | "right-xy">
export type KeyboardControlMapping = Array<kt.Key>
const XBOX_CONTROLS_MAPPING: GamepadControlMapping = [
    "rshoulder",
    "lshoulder",
    "ltrigger",
    "rtrigger",
    "left-x",
    "right-x",
    "south",
    "east",
    "west",
    "north",
    "home",
    "select"
]
const KEYBOARD_MAPPING: KeyboardControlMapping = Array.from("QWERTYUIOPASDFGHJKLZXCVBNM1234567890[]()}{;,.\\/'\":><!?|@#$%^&*-_+=")
const KEYBOARD_LONG_MAPPING: KeyboardControlMapping = [
    "space", "shift", "control", "alt", "enter"
]
k.loadSprite("xbox-controls", "sprites/controls-xbox.png", {
    sliceX: 9,
    sliceY: 1
})
k.loadSprite("keyboard-controls", "sprites/controls-keyboard.png", {
    sliceX: 66,
    sliceY: 1
})
k.loadSprite("keyboard-long-controls", "sprites/controls-keyboard-long.png", {
    sliceX: 5,
    sliceY: 1
})
export const gamepad_types: Record<string, [string, GamepadControlMapping, (id: string) => boolean]> = {
    xbox: ["xbox-controls", XBOX_CONTROLS_MAPPING, (id) => /xinput/i.test(id)]
}
export function getGamepadTypeFromID(id: string) {
    return Object.entries(gamepad_types).find(elem=>elem[1][2](id))?.[0]
}
export type ControlPlusToken = { type: "plus" }
export type ControlSpriteToken = { type: "sprite", value: string, frame?: number }
export type ControlTextToken = { type: "text", value: string }
export type ControlToken = ControlPlusToken | ControlSpriteToken | ControlTextToken
export function getControl(mapping: kt.ChordedKey | kt.ChordedKGamepadButton, gamepad_type?: keyof typeof gamepad_types): Array<ControlToken> {
    const combo = mapping.split("+")
    let data: Array<ControlToken> = []
    let chain: Array<[string, string[]]> = []
    if (gamepad_type in gamepad_types) {
        chain.push(gamepad_types[gamepad_type].slice(0,1) as [string, GamepadControlMapping])
    }
    chain.push(["keyboard-controls", KEYBOARD_MAPPING])
    chain.push(["keyboard-long-controls", KEYBOARD_LONG_MAPPING])
    for (const [index,button] of combo.entries()) {
        if (index > 0) data.push({ type: "plus" })
        let found = false
        for (const [sprite, mapping] of chain) {
            if (mapping.includes(button)) {
                data.push({ type: "sprite", value: sprite, frame: mapping.indexOf(button) })
                found = true
                break
            }
        }
        if (!found) data.push({ type: "text", value: button })
    }
    return data
}

export function renderControl(pos: kt.Vec2, chain: Array<ControlToken>, opts: {
    size: number,
    spacing: number,
    z: number
}) {
    const { size = 32, spacing = 8, z = 25 } = opts
    let offset = 0;
    const control_obj = k.add([
        k.pos(pos),
        k.area()
    ])
    for (const { type, ...data } of chain) {
        switch (type) {
            case "plus": {
                const obj = control_obj.add([
                    k.pos(pos.add(offset, 0)),
                    k.text("+", {
                        size
                    }),
                    k.area(),
                    k.z(z)
                ])
                offset += obj.width + spacing
                break
            }
            case "sprite": {
                const { value: spr, frame } = data as ControlSpriteToken
                const obj = control_obj.add([
                    k.pos(pos.add(offset, 0)),
                    k.sprite(spr),
                    k.area(),
                    k.z(z)
                ])
                obj.frame = frame
                offset += obj.width + spacing
                break
            }
            case "text": {
                const obj = control_obj.add([
                    k.pos(pos.add(offset, 0)),
                    k.text((data as ControlTextToken).value, {
                        size
                    }),
                    k.area(),
                    k.z(z)
                ])
                offset += obj.width + spacing
                break
            }
        } 
    }
    return control_obj
}
let lastLastInput = null 
export function onControlChange(func: (type: kt.ButtonBindingDevice) => void): () => void {
    const handler = () => {
        if (k.getLastInputDeviceType() !== lastLastInput) {
            lastLastInput = k.getLastInputDeviceType()
            func(k.getLastInputDeviceType())
        }
    }
    const handlers = []
    handlers.push(k.onCharInput(handler).cancel)
    handlers.push(k.onGamepadButtonDown(handler).cancel)
    handlers.push(k.onTouchStart(handler).cancel)
    return () => handlers.forEach(h=>h())
}