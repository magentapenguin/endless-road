import k, { LANE_WIDTH, SPEED_LIMIT, getRoadPadding } from "./main"
export const npc = (lane: number) => {
    const oncoming = lane < 3;
    const car = k.add([
        k.sprite("green_car"),
        k.anchor("center"),
        k.scale(k.rand(0.9,1.1)),
        k.rotate(oncoming ? 180 : 0),
        k.pos(
            k.width() / 2 + LANE_WIDTH * (lane - 3) + LANE_WIDTH / 2,
            oncoming
                ? k.getCamPos().y - k.height() / 2 - 50
                : k.getCamPos().y + k.height() / 2 + 50
        ),
        k.area(),
        k.body({
            damping: 0.01,
        }),
        { target_angle: oncoming ? 180 : 0, lane, past_vel: null, dead: false, speed: 0, rage: 5 },
    ]);
    car.onUpdate(() => {
        if (car.rage > 0) car.rage -= 0.01
        car.target_angle += k.clamp(
            (k.width() / 2 +
                LANE_WIDTH * (lane - 3) +
                LANE_WIDTH / 2 -
                car.pos.x) /
                8,
            -15,
            15
        );
        car.angle = k.lerp(car.angle, car.target_angle, 0.05);
        car.target_angle = oncoming ? 180 : 0;
        car.addForce(
            k.vec2(
                (car.angle - (oncoming ? 180 : 0)) *
                    car.vel.y *
                    (oncoming ? 0.05 : -0.05) -
                    car.vel.x,
                0
            )
        );
        if (oncoming) {
            if (car.vel.y < car.speed) {
                car.addForce(k.vec2(0, 60));
            }
        } else {
            if (-car.vel.y < car.speed) {
                car.addForce(k.vec2(0, -60));
            }
        }
        const cast = k.raycast(
            car.pos.add(
                k.Vec2.fromAngle(car.target_angle - 90).scale(
                    car.height / 2 + 3
                )
            ),
            k.Vec2.fromAngle(car.target_angle - 90).scale(
                car.height / 2 + 15
            )
        )
        if (
            (k.rand() as number) < 0.001 || cast            
        ) {
            if (cast) car.rage += 0.05
            car.addForce(k.vec2(0, -car.vel.y / 2));
            car.speed -= 1
            lane += k.randi(-1, 1);
            if ((k.rand() as number) > 0.1) {
                lane = oncoming ? k.clamp(lane, 0, 2) : k.clamp(lane, 3, 6);
            }
        }
        const rear_cast = k.raycast(
            car.pos.add(
                k.Vec2.fromAngle(car.target_angle + 90).scale(
                    car.height / 2 + 3
                )
            ),
            k.Vec2.fromAngle(car.target_angle + 90).scale(
                car.height / 2 + 15
            )
        )
        if (rear_cast && car.rage > 10) {
            car.addForce(k.vec2(0, -car.vel.y / 5));
        } 
        car.speed += Math.max(0, car.rage) / 20
        if (car.speed > SPEED_LIMIT + 50 + car.rage*2) car.speed -= 5
        car.onCollideUpdate(() => {
            car.rage += 0.0001
        })
        let rumble = 0;
        rumble +=
            Math.abs(k.width() / 2 - car.pos.x) < 8 ? car.vel.y * -0.01 : 0; // Center Line
        rumble +=
            Math.abs(k.width() / 2 - car.pos.x) >
            k.width() / 2 - getRoadPadding()
                ? car.vel.y * -0.2
                : 0; // Offroading
        car.damping =
            Math.abs(car.angle - (oncoming ? 180 : 0)) / 60 + 0.01;
        car.damping *= Math.max(rumble / 10, 1);
        if (!car.past_vel) car.past_vel = car.vel;
        if (Math.abs(car.past_vel.y - car.vel.y) > 250) car.dead = true
        if (
            oncoming &&
            (car.pos.y > k.getCamPos().y + k.height() / 2 + 50 || car.dead)
        ) {
            if (car.dead) {
                k.addKaboom(car.pos, { scale: 0.5 });
                k.shake(0.5);
            }
            car.paused = true;
            setTimeout(() => {
                lane = k.randi(0, 3);
                car.lane = lane;
                car.pos = k.vec2(
                    k.width() / 2 +
                        LANE_WIDTH * (lane - 3) +
                        LANE_WIDTH / 2,
                    oncoming
                        ? k.getCamPos().y - k.height() / 2 - 50
                        : k.getCamPos().y + k.height() / 2 + 50
                );
                car.vel = k.vec2(0, SPEED_LIMIT);
                car.paused = false;
                car.dead = false;
                car.speed = SPEED_LIMIT + k.randi(-100, 100)
                car.rage = 0
            }, k.rand(0, 800));
        }
        if (
            !oncoming &&
            (car.pos.y < k.getCamPos().y - k.height() / 2 - 250 || car.dead)
        ) {
            if (car.dead) {
                k.addKaboom(car.pos, { scale: 0.5 });
                k.shake(1);
            }
            car.paused = true;
            setTimeout(() => {
                lane = k.randi(3, 6);
                car.lane = lane;
                car.pos = k.vec2(
                    k.width() / 2 +
                        LANE_WIDTH * (lane - 3) +
                        LANE_WIDTH / 2,
                    oncoming
                        ? k.getCamPos().y - k.height() / 2 - 50
                        : k.getCamPos().y + k.height() / 2 + 50
                );
                car.vel = k.vec2(0, -SPEED_LIMIT);
                car.paused = false;
                car.dead = false;
                car.speed = SPEED_LIMIT + k.randi(-100, 100)
                car.rage = 0
            }, k.rand(0, 800));
        }
        if (!oncoming && car.pos.y > k.getCamPos().y + k.height() / 2 + 200) {
            car.paused = true;
            setTimeout(() => {
                lane = k.randi(3, 6);
                car.lane = lane;
                car.pos = k.vec2(
                    k.width() / 2 +
                        LANE_WIDTH * (lane - 3) +
                        LANE_WIDTH / 2,
                    k.getCamPos().y - k.height() / 2 - 50
                );
                car.vel = k.vec2(0, -SPEED_LIMIT);
                car.paused = false;
                car.speed = SPEED_LIMIT + k.randi(-100, 100)
                car.rage = 0
            }, k.rand(0, 800));
        }
        car.past_vel = car.vel;
    });
};