import kaplay from "kaplay";
import type * as kt from "kaplay";
import { crew } from "@kaplayjs/crew";
// import "kaplay/global"; // uncomment if you want to use without the k. prefix

const k = kaplay({
    width: 240,
    height: 280,
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
    },
    background: [50, 110, 0],
    debugKey: "i",
    plugins: [crew],
    font: "happy",
});

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadCrew("font", "happy");
k.loadSprite("car", "sprites/car.png");
k.loadSprite("green_car", "sprites/green_car.png");
k.loadMusic("lets_go", "/music/lets_go_already.mp3")

k.scene("input_tester", () => {
    k.onUpdate(() => {
        const buttons = Object.keys(k.getButtons());
        buttons.forEach((btn, i) => {
            // @ts-expect-error
            if (k.isButtonPressed(btn)) {
                k.debug.log(`Button "${btn}" is pressed`);
            }
        });
    });
});

const ROAD = k.rgb(33, 33, 34);
const LANE_WIDTH = 33;
const ROAD_PADDING = 20;
const SPEED_LIMIT = 350 // Pixels per second

k.scene("main", () => {
    const music = k.play("lets_go", {
        loop: true
    })
    const npc = (lane: number) => {
        const oncoming = lane <3
        const car = k.add([
            k.sprite("green_car"),
            k.anchor("center"),
            k.rotate(oncoming ? 180 : 0),
            k.pos(k.width() / 2 + LANE_WIDTH * (lane - 3) + LANE_WIDTH / 2, oncoming ? player.pos.y - k.height() / 2 - 50 : player.pos.y + k.height() / 2 + 50),
            k.area(),
            k.body({
                damping: 0.01,
            }), 
            { target_angle: oncoming ? 180 : 0, lane, past_vel: null }
        ]);
        car.onUpdate(() => {
            car.target_angle += k.clamp(((k.width() / 2 + LANE_WIDTH * (lane - 3) + LANE_WIDTH / 2) - car.pos.x) / 8, -15, 15)
            car.angle = k.lerp(car.angle, car.target_angle, 0.05);
            car.target_angle = oncoming ? 180 : 0;
            car.addForce(
                k.vec2((car.angle - (oncoming ? 180 : 0)) * car.vel.y * (oncoming ? 0.05 : -0.05) - car.vel.x, 0)
            );
            if (oncoming) {
                if (car.vel.y > SPEED_LIMIT) {
                    car.addForce(k.vec2(0, 60))
                }
            } else {
                if (-car.vel.y < SPEED_LIMIT) {
                    car.addForce(k.vec2(0, -60))
                }
            }
            if (k.rand() as number < 0.001) {
                lane += k.randi(-1,1)
                k.debug.log('changing lanes', lane)
                if (k.rand() as number > 0.1) {
                    lane = oncoming ? k.clamp(lane, 0, 2) : k.clamp(lane, 3, 6)
                } else {
                    k.debug.log('who cares about rules!')
                }
            }
            let rumble = 0;
            rumble +=
                Math.abs(k.width() / 2 - car.pos.x) < 8
                    ? car.vel.y * -0.01
                    : 0; // Center Line
            rumble +=
                Math.abs(k.width() / 2 - car.pos.x) >
                k.width() / 2 - ROAD_PADDING
                    ? car.vel.y * -0.1
                    : 0; // Offroading

            car.damping *= Math.max(rumble / 10, 1);
            if (!car.past_vel) car.past_vel = car.vel
            const dead = Math.abs(car.vel.y - car.past_vel.y) > 250
            if (oncoming && (car.pos.y > player.pos.y + k.height() / 2 + 50 || dead )) {
                if (dead) k.addKaboom(car.pos)
                car.paused = true
                setTimeout(()=>{
                    lane = k.randi(0,3)
                    car.lane = lane
                    car.pos = k.vec2(k.width() / 2 + LANE_WIDTH * (lane - 3) + LANE_WIDTH / 2, oncoming ? player.pos.y - k.height() / 2 - 50 : player.pos.y + k.height() / 2 + 50)
                    car.vel = k.vec2(0, SPEED_LIMIT)
                    car.paused = false
                }, k.rand(0, 800))
            }
            if (!oncoming && (car.pos.y < player.pos.y - k.height() / 2 - 250 || dead )) {
                if (dead) k.addKaboom(car.pos)
                car.paused = true
                setTimeout(()=>{
                    lane = k.randi(3,6)
                    car.lane = lane
                    car.pos = k.vec2(k.width() / 2 + LANE_WIDTH * (lane - 3) + LANE_WIDTH / 2, oncoming ? player.pos.y - k.height() / 2 - 50 : player.pos.y + k.height() / 2 + 50)
                    car.vel = k.vec2(0, -SPEED_LIMIT)
                    car.paused = false
                }, k.rand(0, 800))
            }
            if (!oncoming && car.pos.y > player.pos.y + k.height() / 2 + 150) {
                car.paused = true
                setTimeout(()=>{
                    lane = k.randi(3,6)
                    car.lane = lane
                    car.pos = k.vec2(k.width() / 2 + LANE_WIDTH * (lane - 3) + LANE_WIDTH / 2, player.pos.y - k.height() / 2 - 50)
                    car.vel = k.vec2(0, -SPEED_LIMIT)
                    car.paused = false
                }, k.rand(0, 800))
            }
            car.past_vel = car.vel
        });
    };
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
        const offset = k.vec2(ROAD_PADDING, player.pos.y - k.height() / 2);
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
                Math.round((player.pos.y - k.height() / 2) / (height * 3)) *
                height *
                3;
            for (
                let y = offset;
                y + offset < k.height() + height * 3;
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
        k.pos(160, 200),
        k.sprite("car"),
        k.area(),
        k.body({
            damping: 0.2
        }),
        k.rotate(),
        k.anchor("center"),
        "car",
        { target_angle: 0, rumble: 0, cruise: null, accel: 0, past_vel: null },
    ]);
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
    player.onButtonDown("brake", (btn) => {
        player.accel += (-player.vel.y / 2) * keyboardAndGamepadValue(btn);
    });
    player.onButtonDown("accel", (btn) => {
        player.accel += -40 * keyboardAndGamepadValue(btn);
    });
    player.onButtonDown("pbrake", () => {
        player.accel += -player.vel.y / 1.2;
    });
    player.onButtonPress("cruise", () => {
        if (player.cruise) {
            player.cruise = null
        } else {
            player.cruise = player.vel.y
        }
    });
    player.onUpdate(() => {
        if (player.cruise) {
            if (player.vel.y > player.cruise) {
                player.accel -= 40
            }
        }
        player.accel = -Math.min(-player.accel, 40)
        k.debug.log(player.accel)
        player.addForce(k.vec2(0, player.accel));
        player.accel = 0;

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
                ? player.vel.y * -0.1
                : 0; // Offroading

        player.damping = Math.abs(player.angle) / 60 + 0.01;

        player.damping *= Math.max(player.rumble / 10, 1);

        // Speed limiter
        player.addForce(k.vec2(0, Math.max(-(player.vel.y + 400), 0)));

        if (player.rumble) {
            k.setCamPos(
                k.width() / 2 + k.rand(-player.rumble, player.rumble),
                player.pos.y + k.rand(-player.rumble, player.rumble)
            );
        } else {
            k.setCamPos(k.width() / 2, player.pos.y);
        }

        if (player.pos.x > k.width()) {
            player.pos.x = k.width();
        }
        if (player.pos.x < 0) {
            player.pos.x = 0;
        }
        if (!player.past_vel) player.past_vel = player.vel
        if (Math.abs(player.vel.y - player.past_vel.y) > 150) {
            k.addKaboom(player.pos)
            player.paused = true
            player.hidden = true
            setTimeout(()=>{
                music.stop()
                k.go('main')
            }, 1000)
        }
    });

    for (let index = 0; index < 12; index++) {
        npc(index % 6)
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
                pos: camera_offset.add(k.width() / 2 - 3, k.height() / 2 - 3 - 18),
                anchor: "botright",
                size: 8,
            })
            k.drawText({
                text: (-player.cruise / 5).toFixed(0),
                color: k.hsl2rgb(-player.cruise / 400, 0.7, 0.5),
                pos: camera_offset.add(k.width() / 2 - 5, k.height() / 2 - 5 - 18),
                anchor: "botright",
                size: 8,
            })
        }
        
    });
});
k.go("main");
