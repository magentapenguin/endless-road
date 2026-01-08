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