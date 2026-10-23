# Running Virtual Lab VR on a Meta Quest Pro

A step-by-step guide for someone who has never used VR. It takes about 10 minutes the first time.

## 1. Before you start

- **Charge** the headset and both controllers (the Quest Pro charging dock charges all three).
- Clear a space about **2 × 2 m** with nothing to trip over. You can also do the lab sitting down.
- The headset and the computer running the lab must be on the **same Wi-Fi**. If the school Wi-Fi
  blocks devices from seeing each other, turn on your **phone's hotspot** and connect both the PC and
  the headset to it.

## 2. Put on the headset and set it up

1. Press the **power button** on the left side of the headset until it chimes. Turn on the controllers
   by holding the **Meta button** (the oval button on the right controller) until it vibrates.
2. Put the headset on: rest the front on your forehead, pull the back band down, and turn the **dial at
   the back** until it's snug. Move the lenses with the side wheel until the picture is sharp.
3. First time only: follow the setup on screen. It asks for Wi-Fi, your Meta account (through the
   **Meta Horizon app** on your phone) and a **boundary**. Choose **Stationary** (a small circle
   around you) to keep it simple.

## 3. Learn the controllers

```
         LEFT controller                       RIGHT controller
   ┌─────────────────────────┐          ┌─────────────────────────┐
   │   (X) (Y)   [ ◎ stick ] │          │ [ ◎ stick ]   (A) (B)   │
   │   ≡ menu                │          │                ⬭ Meta   │
   │                         │          │                         │
   │   Trigger: index finger │          │ Trigger: index finger   │
   │   Grip: middle finger   │          │ Grip: middle finger     │
   └─────────────────────────┘          └─────────────────────────┘
```

- **Trigger**: the front button under your index finger.
- **Grip**: the side button under your middle finger.
- **Thumbstick**: the little joystick under your thumb.
- **Meta button** (right controller, oval): opens the Quest menu. Press it any time you're lost.

Outside the lab, you point at things with the white ray from a controller and press the **trigger**
to click, like a mouse.

## 4. Open the lab in the headset

**On the computer** (in the project folder):

```bash
npm run dev:vr
```

It prints a line like `➜  Network: https://192.168.1.23:5174/`. Write that address down.

**In the headset:**

1. Press the **Meta button** to open the menu, then open the **Browser** app (globe icon).
2. Point at the address bar at the top and press the **trigger**. A keyboard appears: type the address
   exactly, including `https://` and the `:5174` port, and press **Go**.
3. You'll see **"Your connection is not private"**. That's expected: the certificate is homemade.
   Click **Advanced**, then **Proceed to … (unsafe)**.
4. The lab appears on a flat page. Press **Enter VR**. If the browser asks to allow VR, press **Allow**.
5. You're now standing at the lab bench. A **Controls** card floats above your left controller.

**If the page won't load:** check both devices are on the same Wi-Fi, or use a phone hotspot. If
Windows asked about **Node.js** network access, allow it on private and public networks.

**Once the site is on GitHub Pages** you don't need the computer at all: just type the
`https://…github.io/…` address in the Quest browser and skip the warning step.

## 5. Controls in the lab

| Button | What it does |
|---|---|
| **Grip** (middle finger), held | Grab what's at your hand, or what the ray points at. Let go to put it back in its place. |
| **Tilt your hand** | Pour from a bottle or beaker, as in real life. Pour slowly near the container's opening. |
| **Trigger** (index finger) | While holding a dropper: squeeze one drop. Otherwise: press buttons on the wall board, or tap the spirit lamp to light or put it out. |
| **Left thumbstick** | Walk around (slowly). |
| **Right thumbstick ◀ ▶** | Turn 30° left or right. |
| **Right thumbstick ▲ ▼** | Make yourself taller or shorter (handy when sitting). |
| **A** or **X** | Go back to the bench, facing it. Use this if you get lost. |
| **B** or **Y** | Hide or show the Controls card. |
| **Meta button** | Quest menu: exit the lab or the browser. |

The **wall board** behind the bench shows your tasks and what you've used. Its buttons
(Topics, Reset bench, O‘zbekcha, Seated mode, ✕ VR) are pressed by pointing and pulling the trigger.

## 6. A first experiment (Acids, bases and indicators)

1. Reach for the **HCl** bottle (red label) and hold **Grip**.
2. Bring its mouth over the middle beaker and slowly **tilt** your hand until it pours. Straighten up
   to stop. Let go of **Grip**: the bottle goes back to its place.
3. Grab the **Universal indicator** dropper, hold it over the same beaker and pull the **trigger**
   two or three times. The liquid turns red: acid.
4. Do the same with **NaOH** (blue label) in another beaker: it turns purple-blue.
5. Grab the **pH meter**, lower its tip into a liquid and read the screen on it.

Spills are real: miss the beaker and it splashes on the bench. **Reset bench** on the wall board
cleans everything up.

## 7. Recording the demo video

- In the headset: press the **Meta button** → **Camera** → **Record video**. Recordings save to the
  headset; copy them to the PC with a USB cable or through the Meta Horizon app.
- Or **cast** to a phone or PC so the class (and your video) can see what you see:
  Meta button → **Cast** → choose the phone or computer.
