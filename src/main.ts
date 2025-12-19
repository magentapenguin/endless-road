import kaplay from "kaplay";
import type * as kt from "kaplay";
// import "kaplay/global"; // uncomment if you want to use without the k. prefix

const k = kaplay({
    width: 240,
    height: 280,
    scale: 2,
    pixelDensity: 2,
    crisp: true,
    buttons: {
        left: {
            keyboard: ["left",  "a"]
        },
        right: {
            keyboard: ["right", "d"]
        },
        accel: {
            keyboard: ["up",    "w"],
            gamepad: ["rtrigger"]
        },
        brake: {
            keyboard: ["down",  "s"],
            gamepad: ["ltrigger"]
        },
        pbrake: {
            keyboard: ["space"],
            gamepad: ["west"]
        },
    },
    backgroundColor: [50, 110, 0],
    debugKey: "i"
});

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadSprite("bean", "sprites/bean.png");
k.loadSprite("car", "sprites/car.png");
k.loadSprite("green_car", "sprites/green_car.png");

function npcCar(lane: number) {
    const slow = k.rand() as number < 0.5;
    const x = 38 + (lane - 1) * 32;
    let dir = 1;
    let y = k.height() + 50;
    if (lane <= 3) {
        dir = -1;
        y = -50;
    }
    const speed = slow ? 100 : 150;
    const npc = k.add([
        k.pos(x, y),
        k.rotate(dir === -1 ? 180 : 0),
        k.anchor("center"),
        k.sprite("green_car"),
        k.area(),
        k.body(),
        "npc",
        { speed: speed, target_speed: speed },
    ]);
    npc.onUpdate(() => {
        const car = k.get("car")[0];
        npc.move(0, -npc.speed * dir + car.speed);
        if (npc.pos.y < -100) {
            npc.pos.y = k.height() + 50;
            lane = k.randi(1, 6);
            const x = 38 + (lane - 1) * 32;
            npc.pos.x = x;
            const slow = k.rand() as number < 0.5;
            npc.speed = slow ? 100 : 150;
            if (lane <= 3) {
                dir = -1;
            } else {
                dir = 1;
            }
        }
        if (npc.pos.y > k.height() + 100) {
            npc.pos.y = -50;
            lane = k.randi(1, 6);
            const x = 38 + (lane - 1) * 32;
            npc.pos.x = x;
            const slow = k.rand() as number < 0.5;
            npc.speed = slow ? 100 : 150;
            if (lane <= 3) {
                dir = -1;
            } else {
                dir = 1;
            }
        }
        npc.angle = dir === 1 ? 0 : 180;
    });
    return npc;
}

k.scene("main", () => {
    let roadOffset = 0;
    
    k.onDraw(() => {
        k.drawRect({ pos: k.vec2(20, -4), width: k.width() - 40, height: k.height()+8, color: k.rgb(35, 35, 35) })
        k.drawRect({ pos: k.vec2(k.width() / 2 - 3, -4), width: 6, height: k.height()+8, color: k.rgb(255, 238, 0) })
        k.drawRect({ pos: k.vec2(k.width() / 2 - 1, -4), width: 2, height: k.height()+8, color: k.rgb(35, 35, 35) })
        const line = (x: number, height: number, color: kt.Color) => {
            for (let y = 0; y < k.height() + height * 3; y += height * 3) {
                k.drawRect({ pos: k.vec2(x, y+(roadOffset % (height * 3) - height * 3)), width: 2, height: height, color: color })
            }
        }
        const laneWidth = 32;
        line(k.width() / 2 - laneWidth, 20, k.rgb(255, 255, 255));
        line(k.width() / 2 + laneWidth, 20, k.rgb(255, 255, 255));
        line(k.width() / 2 - laneWidth*2, 20, k.rgb(255, 255, 255));
        line(k.width() / 2 + laneWidth*2, 20, k.rgb(255, 255, 255));
        k.drawRect({ pos: k.vec2(k.width() / 2 - laneWidth*3, -4), width: 2, height: k.height() + 8, color: k.rgb(255, 255, 255) });
        k.drawRect({ pos: k.vec2(k.width() / 2 + laneWidth*3 - 2, -4), width: 2, height: k.height() + 8, color: k.rgb(255, 255, 255) });
    });

    const ACCEL_FORCE = 300;
    const BRAKE_FORCE = 400;
    const DRAG = 0.98;
    const MAX_SPEED = 250;
    const STEERING_SPEED = 15;
    
    const car = k.add([
        k.pos(50, k.height() / 2),
        k.rotate(),
        k.anchor("center"),
        k.sprite("car"),
        k.body(),
        k.area(),
        k.z(10),
        "car",
        { target_angle: 0, rumble: false, speed: 120, throttle: 0, braking: 0 },
    ]);
    
    car.onGamepadStick("left", (dir) => {
        if (Math.abs(dir.x) > 0.2) {
            car.target_angle = dir.x * 15;
        } 
    });
    car.onButtonDown("left", () => {
        car.target_angle = -15;
    });
    car.onButtonDown("right", () => {
        car.target_angle = 15;
    });
    car.onButtonDown("accel", () => {
        car.throttle = 1;
    });
    car.onButtonDown("brake", () => {
        car.braking = 1;
    });
    car.onButtonDown("pbrake", () => {
        car.braking = 2;
    });
    car.onUpdate(() => {
        const dt = k.dt();
        
        // Steering
        car.angle = k.lerp(car.angle, car.target_angle, 0.1);
        car.target_angle = 0;
        
        // Apply throttle force
        if (car.throttle > 0) {
            car.speed += ACCEL_FORCE * dt * car.throttle;
        }
        
        // Apply braking force
        if (car.braking > 0) {
            car.speed -= BRAKE_FORCE * dt * car.braking;
        }
        
        // Apply drag (friction)
        car.speed *= DRAG;
        
        // Clamp speed
        car.speed = k.clamp(car.speed, 0, MAX_SPEED);
        
        // Reset inputs
        car.throttle = 0;
        car.braking = 0;
        
        // Use body velocity for horizontal movement
        car.vel.x = car.angle * STEERING_SPEED;
        car.vel.y = 0;
        
        // Update road offset based on speed
        roadOffset += car.speed * dt;
        
        // Clamp position to screen bounds
        if (car.pos.x < car.width / 2) {
            car.pos.x = car.width / 2;
            car.vel.x = 0;
        }
        if (car.pos.x > k.width() - car.width / 2) {
            car.pos.x = k.width() - car.width / 2;
            car.vel.x = 0;
        }
        
        car.rumble = Math.abs(car.pos.x - k.width() / 2) > k.width() / 2 - (20 + car.width / 2) || Math.abs(car.pos.x - k.width() / 2) < 10;
        if (car.rumble) {
            car.speed *= 0.9;
            k.setCamPos(k.vec2(k.rand(-2, 2), k.rand(-2, 2)).add(k.vec2(k.width() / 2, k.height() / 2)));
        } else {
            k.setCamPos(k.vec2(k.width() / 2, k.height() / 2));
        }
    });
    npcCar(1);
    npcCar(2);
    npcCar(3);
    npcCar(4);
    npcCar(5);
    npcCar(6);
});

k.go("main");

k.onClick(() => k.addKaboom(k.mousePos()));
