import type * as kt from "kaplay";
import k, { LANE_WIDTH, mouse, ROAD, ROAD_PADDING } from "./main";
import { npc } from "./npc";
import credits from "./credits.json";
import { getSetting, setSetting } from "./settings";

function addButton(
    txt = "start game",
    p = k.vec2(k.width() / 2, 100),
    f = () => k.debug.log("hello"),
    s = [160, 40],
) {
    // add a parent background object
    const btn = k.add([
        k.rect(s[0], s[1], { radius: 4 }),
        k.pos(p),
        k.area(),
        k.scale(1),
        k.anchor("center"),
        k.outline(2),
        k.color(255, 255, 255),
        k.z(20),
        k.fixed(),
    ]);

    // add a child object that displays the text
    btn.add([
        k.text(txt, { size: 15 }),
        k.anchor("center"),
        k.z(20),
        k.color(0, 0, 0),
    ]);

    // onHoverUpdate() comes from area() component
    // it runs every frame when the object is being hovered
    btn.onHoverUpdate(() => {
        btn.scale = k.vec2(1.2);
        mouse.frame = 1;
    });

    // onHoverEnd() comes from area() component
    // it runs once when the object stopped being hovered
    btn.onHoverEnd(() => {
        btn.scale = k.vec2(1);
        btn.color = k.rgb();
    });

    // onClick() comes from area() component
    // it runs once when the object is clicked
    btn.onClick(f);

    return btn;
}

function slider(
    p = k.vec2(k.width() / 2, 100),
    f = (v: number) => k.debug.log(v),
    v = 0.5,
    s = [160, 10],
) {
    const container = k.add([
        k.rect(s[0]+4,s[1]+4, {radius:6}),
        k.pos(p),
        k.area(),
        k.anchor("center"),
        k.color(0,0,0),
        {
            value: v
        }
    ])
    const inner = container.add([
        k.rect(s[0]*v,s[1], {radius:4}),
        k.pos(-s[0]/2,0),
        k.anchor("left")
    ])
    container.onHoverUpdate(() => {
        if (k.isMouseDown()) {
            const pos = k.mousePos()
            const value = k.clamp(-container.pos.sub(pos).sub(s[0]/2,0).x/s[0],0,1)
            inner.width = s[0]*value
            container.value = value
            f(value)
        }
    })
}

k.scene("menu", () => {
    k.setBackground(50, 110, 0);
    k.onUpdate(() => (mouse.frame = 0));
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
    for (let index = 0; index < 12; index++) {
        npc(index % 6);
    }
    k.onUpdate(() => {
        k.setCamPos(k.getCamPos().add(0, -5));
    });
    k.add([
        k.sprite("title"),
        k.scale(4),
        k.pos(k.width() / 2, 60),
        k.fixed(),
        k.z(20),
        k.anchor("center"),
    ]);
    addButton("Start Game", k.vec2(k.width() / 2, 160), () => k.go("main"));
    addButton("Settings", k.vec2(k.width() / 2, 210), () => k.go("settings"));
    addButton("Credits", k.vec2(k.width() / 2, 260), () => k.go("credits"));
});

k.scene("credits", () => {
    k.onButtonPress("menu", () => k.go("menu"));
    k.setBackground(90, 130, 190);
    k.onUpdate(() => (mouse.frame = 0));
    addButton("Back", k.vec2(k.width() / 2, 20), () => k.go("menu"), [
        k.width() / 3,
        30,
    ]);
    credits.forEach((data, index) => {
        const obj = k.add([
            k.pos(k.width() / 2, index * 30 + 60),
            k.text(data.text, { size: 12, align: "center" }),
            k.anchor("center"),
            k.area(),
            k.scale(1),
        ]);
        obj.onHoverUpdate(() => {
            obj.scale = k.vec2(1.2);
            mouse.frame = 1;
        });
        obj.onHoverEnd(() => {
            obj.scale = k.vec2(1);
        });
        obj.onClick(() => window.open(data.link, "_blank"));
    });
});

k.scene("settings", () => {
    k.onButtonPress("menu", () => k.go("menu"));
    k.setBackground(90, 130, 190);
    k.onUpdate(() => (mouse.frame = 0));
    addButton("Back", k.vec2(k.width() / 2, 20), () => k.go("menu"), [
        k.width() / 3,
        30,
    ]);
    const text_pos   = k.vec2(k.width()/2-20, 100)
    const option_pos = k.vec2(k.width()/2+(160/2), 100)
    k.add([
        k.pos(text_pos),
        k.anchor("right"),
        k.text("Music Volume", {size:12})
    ])
    slider(option_pos, v=>setSetting('music_volume',v.toFixed(5)),parseFloat(getSetting('music_volume','1')))
});
