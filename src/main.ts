import kaplay from "kaplay";
import type * as kt from "kaplay";
import { GamepadHapticManager } from "./haptics"
import { npc } from "./npc";
import { getSetting, loadSettings } from './settings'
// import "kaplay/global"; // uncomment if you want to use without the k. prefix

export const k = kaplay({
    width: 340,
    height: 320,
    scale: 2,
    pixelDensity: 2,
    crisp: true,
    buttons: {
        left: {
            keyboard: ["left", "a"],
        },
        right: {
            keyboard: ["right", "d"],
        },
        accel: {
            keyboard: ["up", "w"],
            gamepad: "rtrigger",
        },
        brake: {
            keyboard: ["down", "s"],
            gamepad: "ltrigger",
        },
        pbrake: {
            keyboard: ["space"],
            gamepad: "east",
        },
        cruise: {
            keyboard: ["q"],
            gamepad: "west",
        },
        menu: {
            keyboard: ["escape"],
            gamepad: ["home"]
        }
    },
    background: [0,0,0],
    debugKey: "i",
    font: "happy",
    letterbox: true
});
k.setLayers(["game", "mouse"], "game")
export default k

loadSettings()

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadBitmapFont("happy", "fonts/happy.png", 28, 37);
k.loadSprite("car", "sprites/car.png");
k.loadSprite("green_car", "sprites/green_car.png");
k.loadSprite("cursors", "sprites/cursors.png", {
    sliceX: 2
})
k.loadMusic("lets_go", "music/lets_go_already.mp3");

export const ROAD = k.rgb(33, 33, 34);
export const LANE_WIDTH = 33;
export const NORMAL_WIDTH = 240
export let ROAD_PADDING = 20 + (k.width() - NORMAL_WIDTH)/2;
export function getRoadPadding() {
    return ROAD_PADDING
}
export const SPEED_LIMIT = 350;

k.scene("main", () => {
    const music = k.play("lets_go", {
        loop: true,
    });

    k.onButtonPress("menu", ()=>k.go("menu"))
    
    const keyboardAndGamepadValue = (
        btn: string,
        deadzone: number = 0.5
    ): number => {
        // @ts-expect-error
        const btnData = k.getButton(btn);
        if (btnData.gamepad && !btnData.gamepad.length) {
            let value = k.getGamepadAnalogButton(
                btnData.gamepad as kt.KGamepadButton
            );
            if (value > deadzone) {
                return value;
            }
        }
        // @ts-expect-error
        if (k.isButtonDown(btn)) {
            return 1;
        }
        return 0;
    };

    k.onDraw(() => {
        const offset = k.vec2(ROAD_PADDING, k.getCamPos().y - k.height() / 2);
        k.drawRect({
            width: k.width() - ROAD_PADDING * 2,
            height: k.height(),
            pos: offset,
            color: ROAD,
        });
        k.drawLine({
            p1: offset.add(2, 0),
            p2: offset.add(2, k.height()),
            width: 2,
        });
        k.drawLine({
            p1: offset.add(k.width() - ROAD_PADDING * 2, 0).add(-2, 0),
            p2: offset.add(k.width() - ROAD_PADDING * 2, 0).add(-2, k.height()),
            width: 2,
        });
        k.drawLine({
            p1: k.vec2(k.width() / 2, offset.y),
            p2: k.vec2(k.width() / 2, k.height() + offset.y),
            width: 6,
            color: k.YELLOW,
        });
        k.drawLine({
            p1: k.vec2(k.width() / 2, offset.y),
            p2: k.vec2(k.width() / 2, k.height() + offset.y),
            width: 3,
            color: ROAD,
        });
        const line = (x: number, height: number, color: kt.Color) => {
            const offset =
                Math.round((k.getCamPos().y - k.height() / 2) / (height * 3)) *
                height *
                3;
            for (
                let y = offset;
                y - offset < k.height() + height * 2;
                y += height * 3
            ) {
                k.drawLine({
                    p1: k.vec2(x, y),
                    p2: k.vec2(x, y + height),
                    color,
                });
            }
        };
        line(k.width() / 2 - LANE_WIDTH, 20, k.rgb(255, 255, 255));
        line(k.width() / 2 + LANE_WIDTH, 20, k.rgb(255, 255, 255));
        line(k.width() / 2 - LANE_WIDTH * 2, 20, k.rgb(255, 255, 255));
        line(k.width() / 2 + LANE_WIDTH * 2, 20, k.rgb(255, 255, 255));
    });
    const player = k.add([
        k.pos(k.width()/2 + LANE_WIDTH * 1.5, 0),
        k.sprite("car"),
        k.area(),
        k.body({
            damping: 0.2,
        }),
        k.rotate(),
        k.anchor("center"),
        "car",
        { target_angle: 0, rumble: 0, cruise: null, accel: 0, past_vel: null, touch_start: null, touch_point: null, x_start: null },
    ]);
    player.vel = k.vec2(0, -SPEED_LIMIT)
    player.onButtonDown("left", () => {
        player.target_angle = -15;
    });
    player.onButtonDown("right", () => {
        player.target_angle = 15;
    });
    player.onGamepadStick("left", (vec) => {
        if (Math.abs(vec.x) > 0.25) {
            player.target_angle = 15 * vec.x;
        }
    });
    player.onTouchStart((pos) => {
        let origin = k.vec2(
                k.width() - 5,
                k.height() - 5,
            ).sub(50,18)
        let area = new k.Rect(origin, 50, 18)
        if (k.testRectPoint(area, pos)) {
            if (player.cruise) {
                player.cruise = null;
            } else {
                player.cruise = player.vel.y;
            }
            return
        }
        player.touch_start = pos
        player.x_start = player.pos.x
    })
    player.onTouchMove((pos) => {
        if (!player.touch_start) return
        player.touch_point = pos
    })
    player.onTouchEnd(()=>{
        player.touch_point = null
    })
    player.onButtonDown("brake", (btn) => {
        player.accel = (-player.vel.y / 2) * keyboardAndGamepadValue(btn);
    });
    player.onButtonDown("accel", (btn) => {
        player.accel = -40 * keyboardAndGamepadValue(btn);
    });
    player.onButtonDown("pbrake", () => {
        player.accel = -player.vel.y / 1.2;
    });
    player.onButtonPress("cruise", () => {
        if (player.cruise) {
            player.cruise = null;
        } else {
            player.cruise = player.vel.y;
        }
    });
    player.onUpdate(() => {
        if (player.cruise) {
            player.accel -= k.clamp((player.vel.y - player.cruise) * 2, 0, 40);
        }
        if (player.touch_point) {
            let vec = player.touch_point.sub(player.touch_start)
            player.target_angle -= k.clamp((vec.x / player.vel.y) * 100, -15, 15)
            if (Math.abs(vec.y) > 30) {
                if (vec.y < 0) {
                    player.accel = vec.y * 40
                } else {
                    player.accel = (-player.vel.y / 2) * k.clamp(vec.y / 30, 0, 1);
                }
            }
        }
        player.accel = -Math.min(-player.accel, 40);
        player.addForce(k.vec2(0, player.accel));
        player.accel = 0

        // Steering
        player.angle = k.lerp(player.angle, player.target_angle, 0.05);
        player.target_angle = 0;
        player.addForce(
            k.vec2(player.angle * player.vel.y * -0.05 - player.vel.x, 0)
        );

        // Rumble
        player.rumble = 0;
        player.rumble +=
            Math.abs(k.width() / 2 - player.pos.x) < 8
                ? player.vel.y * -0.01
                : 0; // Center Line
        player.rumble +=
            Math.abs(k.width() / 2 - player.pos.x) >
            k.width() / 2 - ROAD_PADDING
                ? player.vel.y * -0.02
                : 0; // Offroading
        player.damping = Math.abs(player.angle) / 60 + 0.01;

        player.damping *= Math.max(player.rumble / 50, 1);

        // Speed limiter
        player.addForce(k.vec2(0, Math.max(-(player.vel.y + 500 - (player.rumble*100)), 0)));

        if (player.rumble) {
            k.setCamPos(
                k.width() / 2 + k.rand(-player.rumble, player.rumble) + (k.width() / 2 - player.pos.x + LANE_WIDTH * 1.5) / 10,
                player.pos.y + k.rand(-player.rumble, player.rumble)
            );
        } else {
            k.setCamPos(k.width() / 2 + (k.width() / 2 - player.pos.x + LANE_WIDTH * 1.5) / 10, player.pos.y);
        }
        k.setCamRot(player.angle / 50)

        if (player.pos.x > k.width()) {
            player.pos.x = k.width();
        }
        if (player.pos.x < 0) {
            player.pos.x = 0;
        }
        if (!player.past_vel) player.past_vel = player.vel;
        
        if (Math.abs(player.past_vel.y - player.vel.y) > 250 && !player.paused) {
            k.addKaboom(player.pos, { scale: 5, speed: 0.75 }).onDestroy(() => {
                music.stop();
                k.go("main");
            });
            k.shake(80);
            player.paused = true;
            player.hidden = true;
        }
        
    });

    for (let index = 0; index < 12; index++) {
        npc(index % 6);
    }

    k.onDraw(() => {
        if (k.debug.inspect) {
            k.drawLine({
                p1: player.pos,
                p2: player.pos.add(k.vec2(0, player.vel.y / 2)),
            });
            k.drawLine({
                p1: player.pos,
                p2: player.pos.add(k.vec2(player.vel.x / 2, 0)),
                color: k.BLUE,
            });
            k.drawLine({
                p1: player.pos,
                p2: player.pos.add(
                    k.vec2(0, Math.max(-(player.vel.y + 400), 0) / 2)
                ),
                color: k.RED,
            });
        }
        let camera_offset = k.getCamPos();
        k.drawText({
            text: (-player.pos.y / 10).toFixed(0),
            color: k.hsl2rgb((-player.pos.y / 800) % 1, 0.7, 0.1),
            pos: camera_offset.add(2, -k.height() / 2 + 2),
            anchor: "top",
            size: 18,
        });
        k.drawText({
            text: (-player.pos.y / 10).toFixed(0),
            color: k.hsl2rgb((-player.pos.y / 800) % 1, 0.7, 0.5),
            pos: camera_offset.add(0, -k.height() / 2),
            anchor: "top",
            size: 20,
        });

        k.drawText({
            text: (-player.vel.y / 5).toFixed(0),
            color: k.hsl2rgb(-player.vel.y / 400, 0.7, 0.1),
            pos: camera_offset.add(k.width() / 2 - 3, k.height() / 2 - 3),
            anchor: "botright",
            size: 18,
        });
        k.drawText({
            text: (-player.vel.y / 5).toFixed(0),
            color: k.hsl2rgb(-player.vel.y / 400, 0.7, 0.5),
            pos: camera_offset.add(k.width() / 2 - 5, k.height() / 2 - 5),
            anchor: "botright",
            size: 18,
        });
        if (player.cruise) {
            k.drawText({
                text: (-player.cruise / 5).toFixed(0),
                color: k.hsl2rgb(-player.cruise / 400, 0.7, 0.1),
                pos: camera_offset.add(
                    k.width() / 2 - 3,
                    k.height() / 2 - 3 - 18
                ),
                anchor: "botright",
                size: 8,
            });
            k.drawText({
                text: (-player.cruise / 5).toFixed(0),
                color: k.hsl2rgb(-player.cruise / 400, 0.7, 0.5),
                pos: camera_offset.add(
                    k.width() / 2 - 5,
                    k.height() / 2 - 5 - 18
                ),
                anchor: "botright",
                size: 8,
            });
        }
    });
});

k.setBackground(k.BLACK)
k.add([
    k.text('Loading Menu'),
    k.anchor('center'),
    k.pos(k.width()/2,k.height()/2)
])

export const mouse = k.add([
    k.pos(k.width()/2, k.height()/2),
    k.anchor(k.vec2(-0.5,-1)),
    k.stay(),
    k.fixed(),
    k.fakeMouse(),
    k.layer("mouse"),
    k.sprite("cursors"),
    k.area(),
    "mouse"
])
mouse.onUpdate(()=>{
    mouse.hidden = k.getSceneName() === "main" && !k.debug.inspect
})
k.setCursor("none")


import("./menu").then(()=>{
    k.setBackground(50, 110, 0)
    k.go("menu")
})