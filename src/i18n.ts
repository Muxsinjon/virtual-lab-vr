// All on-screen text, in English and Uzbek (Latin script). Uzbek uses ‘ for o‘/g‘ and ’ for the
// tutuq belgisi.

export type Lang = 'en' | 'uz';

const en = {
  'app.title': 'Virtual Lab VR',
  'app.tagline': 'A chemistry lab where the chemicals never run out.',
  'ui.enterVR': 'Enter VR',
  'ui.enterVRLab': 'Enter in VR',
  'ui.enterScreen': 'Open on this screen (no headset)',
  'ui.noHeadset': 'Enter in VR (no headset found)',
  'ui.launchHint': 'With a headset: Enter in VR, then reach out and grab with the grip button. No headset: open it on this screen and use the mouse, or touch on a phone or tablet.',
  'ui.exitVR': 'Exit VR',
  'ui.noVR': 'No VR headset found. The lab works on this screen too.',
  'ui.topics': 'Topics',
  'ui.back': 'Back',
  'ui.reset': 'Reset bench',
  'ui.lang': 'O‘zbekcha',
  'ui.table': 'Table',
  'ui.putBack': 'Put back',
  'ui.up': 'Raise',
  'ui.down': 'Lower',
  'ui.use.pour': 'Hold to pour',
  'ui.use.drip': 'Add a drop',
  'ui.soon': 'Coming soon',
  'ui.steps': 'Your tasks',
  'ui.used': 'Used this session',
  'ui.usedNone': 'Nothing used yet',
  'ui.supply': 'Supply left: unlimited',
  'ui.allDone': 'All tasks done! Keep experimenting — nothing runs out here.',
  'ui.holding': 'Holding: {name}',
  'hint.mouse': 'Click an item to pick it up · Move it anywhere; scroll or ↑/↓ to raise and lower it · Hold the mouse button to pour · Right-click or Esc to put it back',
  'hint.touch': 'Tap an item to pick it up · Drag to move it · ▲▼ raise and lower · Hold the pour button to pour',

  'toast.spill': 'Spilled! Hold it right above a container.',
  'ui.help': 'Step by step',
  'ui.stuck': 'Stuck? Press the ! next to the task for step-by-step help.',
  'ind.h1': '1) Reach for the HCl bottle (red label) and hold Grip. 2) Hold its mouth over an empty beaker. 3) Tilt slowly until it pours: about 50 mL. 4) Straighten it, then let go.',
  'ind.h2': '1) Take a dropper, e.g. Universal indicator. 2) Hold its tip right above the beaker with acid. 3) Press the trigger (or click) 2–3 times and watch the colour change.',
  'ind.h3': '1) Pour NaOH (blue label) into a different, empty beaker. 2) Add 2–3 drops of an indicator to it. 3) Compare its colour with the acid.',
  'ind.h4': '1) Pick up the pH meter (the blue pen by the droppers). 2) Lower its glass tip into a liquid (scroll down on a computer). 3) Read the screen: below 7 is acid, above 7 is base.',
  'ind.h5': '1) Pour about 40 mL of NaOH into an empty beaker. 2) Add 3 drops of phenolphthalein: it turns pink. 3) Pour HCl into it slowly, a little at a time. 4) Stop when the pink disappears: neutral.',
  'h2.h1': 'Pick up the zinc jar and tip it over the first test tube in the rack until 3–5 granules drop in.',
  'h2.h2': 'Pour HCl from the red-label bottle into the same test tube, about a third full. Hydrogen bubbles appear on the zinc.',
  'h2.h3': 'Take the empty collecting tube from the rack, turn it mouth-down and hold it just above the bubbling tube until it fills (watch the haze).',
  'h2.h4': 'Keep it mouth-down and bring its mouth to the spirit lamp flame. If the lamp is out, light it first (point at it and press the trigger).',
  'h2.h5': 'Fill the tube again, then turn it mouth-up for a few seconds (or let go so it stands in the rack). Hydrogen is lighter than air and escapes.',
  'o2.h1': 'Pour hydrogen peroxide (the brown bottle) into the first test tube in the rack, about a third full.',
  'o2.h2': 'Tip the MnO₂ jar over the same tube until a few black grains fall in. It starts to fizz: that is oxygen.',
  'o2.h3': 'Pick up the wooden splint lying on the bench and hold its tip in the spirit lamp flame until it catches fire.',
  'o2.h4': 'Move the burning splint away from the flame and wait a few seconds: the flame goes out but the tip keeps glowing red.',
  'o2.h5': 'Put the glowing tip into the fizzing tube, just below its mouth. It bursts back into flame.',
  'room.chem': 'Chemistry',
  'room.phLine': 'pH < 7 acid   pH = 7 neutral   pH > 7 base',
  'room.periodic': 'Periodic Table of the Elements',
  'room.safety': 'LAB SAFETY',
  'room.rules': 'Safety rules',
  'room.r1': 'Wear goggles',
  'room.r2': 'Wear gloves',
  'room.r3': 'No food or drink',
  'room.r4': 'Never sniff chemicals',
  'room.hood': 'FUME HOOD',
  'ui.record': 'Record',
  'ui.stopRec': 'Stop',
  'ui.saved': 'Video saved to Downloads: {name}',
  'ui.noRec': 'This browser can’t record video. Use the headset’s Camera or casting instead.',
  'warn.wall': 'You can’t walk through the wall',
  'warn.furniture': 'Careful: there’s furniture in the way',
  'vr.title': 'Controls',
  'vr.grip': 'Reach out and hold to pick up · let go to put back',
  'vr.tilt': 'Tilt your hand to pour',
  'vr.trigger': 'Dropper: one drop · Press board buttons',
  'vr.leftStick': 'Walk',
  'vr.rightStick': 'Turn ◀ ▶ · Table height ▲ ▼',
  'vr.recenter': 'Back to the bench',
  'vr.toggleHelp': 'Hide / show this card',
  'toast.full': 'It’s full. Pour some into the sink.',

  'unit.ml': 'mL',
  'unit.pieces': 'pcs',
  'unit.drops': 'drops',
  'unit.spoons': 'portions',

  // Things on the bench
  'item.hcl': 'Hydrochloric acid',
  'item.hclDilute': 'Hydrochloric acid',
  'item.naoh': 'Sodium hydroxide',
  'item.water': 'Distilled water',
  'item.beaker': 'Beaker',
  'item.litmus': 'Litmus',
  'item.phenol': 'Phenolphthalein',
  'item.methyl': 'Methyl orange',
  'item.universal': 'Universal indicator',
  'item.probe': 'pH meter',
  'item.zinc': 'Zinc granules',
  'item.collector': 'Collecting tube',
  'item.h2o2': 'Hydrogen peroxide',
  'item.mno2': 'Manganese dioxide',
  'item.splint': 'Wooden splint',
  'item.burner': 'Spirit lamp',

  // Topics
  'topic.indicators': 'Acids, bases and indicators',
  'topic.hydrogen': 'Making hydrogen',
  'topic.oxygen': 'Making oxygen',
  'topic.separation': 'Separating a mixture',
  'topic.equipment': 'Lab equipment',

  'ind.info': 'Indicators change colour with pH. Acids: pH below 7. Bases: above 7. HCl + NaOH → NaCl + H₂O',
  'ind.s1': 'Pour hydrochloric acid into a beaker',
  'ind.s2': 'Add an indicator to it',
  'ind.s3': 'Do the same with sodium hydroxide',
  'ind.s4': 'Measure a pH with the pH meter',
  'ind.s5': 'Neutralise: turn pink phenolphthalein colourless with acid',

  'h2.info': 'Zn + 2HCl → ZnCl₂ + H₂↑   Hydrogen is lighter than air and burns with a squeaky pop.',
  'h2.s1': 'Drop zinc granules into the test tube',
  'h2.s2': 'Pour in hydrochloric acid',
  'h2.s3': 'Hold the collecting tube upside down over it',
  'h2.s4': 'Bring the full tube to the flame: listen for the pop',
  'h2.s5': 'Turn a full tube mouth-up, or stand it back in the rack. What happens?',
  'h2.pop': 'Squeaky pop! That’s hydrogen burning.',
  'h2.popBig': 'Loud pop! Lots of hydrogen in that tube.',
  'h2.empty': 'No pop: the tube had almost no hydrogen in it.',
  'h2.leak': 'Mouth-up, the light hydrogen escapes upwards!',

  'o2.info': '2H₂O₂ → 2H₂O + O₂↑   MnO₂ is a catalyst: it speeds the reaction up and is not used up.',
  'o2.s1': 'Pour hydrogen peroxide into the test tube',
  'o2.s2': 'Add manganese dioxide',
  'o2.s3': 'Light the splint in the spirit lamp',
  'o2.s4': 'Wait for the flame to go out. The tip keeps glowing',
  'o2.s5': 'Put the glowing splint into the tube',
  'o2.relit': 'The splint bursts into flame: that’s oxygen!',
  'o2.glowing': 'The flame went out, but the tip is still glowing.',
  'o2.noO2': 'Not enough oxygen here yet.',
};

export type Key = keyof typeof en;

const uz: Record<Key, string> = {
  'app.title': 'Virtual Lab VR',
  'app.tagline': 'Kimyoviy moddalar hech qachon tugamaydigan laboratoriya.',
  'ui.enterVR': 'VR rejimiga kirish',
  'ui.enterVRLab': 'VR’da kirish',
  'ui.enterScreen': 'Shu ekranda ochish (ko‘zoynaksiz)',
  'ui.noHeadset': 'VR’da kirish (ko‘zoynak topilmadi)',
  'ui.launchHint': 'Ko‘zoynak bo‘lsa: VR’da kiring, so‘ng qo‘lingizni cho‘zib, yon tugma bilan buyumlarni oling. Ko‘zoynak bo‘lmasa: shu ekranda oching va sichqoncha yoki telefon/planshetda barmoq bilan boshqaring.',
  'ui.exitVR': 'VR rejimidan chiqish',
  'ui.noVR': 'VR ko‘zoynak topilmadi. Laboratoriya shu ekranda ham ishlaydi.',
  'ui.topics': 'Mavzular',
  'ui.back': 'Orqaga',
  'ui.reset': 'Stolni tozalash',
  'ui.lang': 'English',
  'ui.table': 'Stol',
  'ui.putBack': 'Joyiga qo‘yish',
  'ui.up': 'Ko‘tarish',
  'ui.down': 'Tushirish',
  'ui.use.pour': 'Quyish uchun bosib turing',
  'ui.use.drip': 'Bir tomchi tomizish',
  'ui.soon': 'Tez orada',
  'ui.steps': 'Vazifalar',
  'ui.used': 'Bu mashg‘ulotda ishlatildi',
  'ui.usedNone': 'Hali hech narsa ishlatilmadi',
  'ui.supply': 'Qolgan zaxira: cheksiz',
  'ui.allDone': 'Barcha vazifalar bajarildi! Tajriba qilishda davom eting — bu yerda hech narsa tugamaydi.',
  'ui.holding': 'Qo‘lingizda: {name}',
  'hint.mouse': 'Buyumni olish uchun ustiga bosing · Istalgan joyga olib boring; g‘ildirak yoki ↑/↓ bilan ko‘taring va tushiring · Quyish uchun sichqoncha tugmasini bosib turing · Joyiga qo‘yish uchun o‘ng tugma yoki Esc',
  'hint.touch': 'Buyumni olish uchun ustiga bosing · Siljitish uchun suring · ▲▼ ko‘tarish va tushirish · Quyish uchun tugmani bosib turing',

  'toast.spill': 'To‘kildi! Idishning naq ustida ushlang.',
  'ui.help': 'Bosqichma-bosqich',
  'ui.stuck': 'Qiynalyapsizmi? Vazifa yonidagi ! belgisini bosing: bosqichma-bosqich yordam.',
  'ind.h1': '1) HCl shishasiga (qizil yorliq) qo‘l cho‘zib, yon tugmani bosib turing. 2) Og‘zini bo‘sh stakan ustiga keltiring. 3) Quyila boshlaguncha sekin egiting: taxminan 50 ml. 4) To‘g‘rilang va qo‘yib yuboring.',
  'ind.h2': '1) Tomizgichni oling, masalan Universal indikator. 2) Uchini kislotali stakanning naq ustida ushlang. 3) Old tugmani (yoki sichqonchani) 2–3 marta bosing va rang o‘zgarishini kuzating.',
  'ind.h3': '1) NaOH ni (ko‘k yorliq) boshqa, bo‘sh stakanga quying. 2) Unga 2–3 tomchi indikator qo‘shing. 3) Rangini kislota bilan solishtiring.',
  'ind.h4': '1) pH-metrni oling (tomizgichlar yonidagi ko‘k ruchka). 2) Shisha uchini suyuqlikka tushiring (kompyuterda g‘ildirakni pastga aylantiring). 3) Ekranni o‘qing: 7 dan kichik — kislota, 7 dan katta — ishqor.',
  'ind.h5': '1) Bo‘sh stakanga 40 ml chamasi NaOH quying. 2) 3 tomchi fenolftalein qo‘shing: pushti rangga kiradi. 3) Unga HCl ni sekin, oz-ozdan quying. 4) Pushti rang yo‘qolganda to‘xtating: neytral.',
  'h2.h1': 'Rux bankasini oling va tokchadagi birinchi probirka ustida 3–5 ta granula tushguncha egiting.',
  'h2.h2': 'Qizil yorliqli shishadan HCl ni o‘sha probirkaga, uchdan bir qismigacha quying. Ruxda vodorod pufakchalari paydo bo‘ladi.',
  'h2.h3': 'Tokchadagi bo‘sh yig‘uvchi probirkani oling, og‘zini pastga qaratib, pufaklanayotgan probirka ustida to‘lguncha ushlang (tumanga qarang).',
  'h2.h4': 'Og‘zini pastga qaratgan holda uni spirt lampa alangasiga yaqinlashtiring. Lampa o‘chgan bo‘lsa, avval yoqing (unga ko‘rsatib, old tugmani bosing).',
  'h2.h5': 'Probirkani yana to‘ldiring, so‘ng bir necha soniya og‘zini yuqoriga qarating (yoki qo‘yib yuboring). Vodorod havodan yengil, uchib chiqib ketadi.',
  'o2.h1': 'Vodorod peroksidni (jigarrang shisha) tokchadagi birinchi probirkaga, uchdan bir qismigacha quying.',
  'o2.h2': 'MnO₂ bankasini o‘sha probirka ustida bir necha qora donacha tushguncha egiting. Ko‘piklana boshlaydi: bu kislorod.',
  'o2.h3': 'Stol ustidagi cho‘pni oling va uchini alanga olguncha spirt lampa alangasida ushlab turing.',
  'o2.h4': 'Yonayotgan cho‘pni alangadan uzoqlashtiring va bir necha soniya kuting: alanga o‘chadi, lekin uchi qizarib cho‘g‘lanib turadi.',
  'o2.h5': 'Cho‘g‘langan uchini ko‘piklanayotgan probirkaga, og‘zidan biroz pastroqqa tushiring. U yana alangalanib ketadi.',
  'room.chem': 'Kimyo',
  'room.phLine': 'pH < 7 kislota   pH = 7 neytral   pH > 7 ishqor',
  'room.periodic': 'Kimyoviy elementlar davriy jadvali',
  'room.safety': 'XAVFSIZLIK',
  'room.rules': 'Xavfsizlik qoidalari',
  'room.r1': 'Ko‘zoynak taqing',
  'room.r2': 'Qo‘lqop kiying',
  'room.r3': 'Ovqat va ichimlik mumkin emas',
  'room.r4': 'Moddalarni hidlamang',
  'room.hood': 'MO‘RILI SHKAF',
  'ui.record': 'Yozib olish',
  'ui.stopRec': 'To‘xtatish',
  'ui.saved': 'Video «Yuklanmalar»ga saqlandi: {name}',
  'ui.noRec': 'Bu brauzer videoni yozib ololmaydi. Ko‘zoynakdagi Kamera yoki translyatsiyadan foydalaning.',
  'warn.wall': 'Devordan o‘tib bo‘lmaydi',
  'warn.furniture': 'Ehtiyot bo‘ling: oldingizda jihoz bor',
  'vr.title': 'Boshqaruv',
  'vr.grip': 'Qo‘lingizni cho‘zib bosib turing · qo‘yib yuborsangiz joyiga qaytadi',
  'vr.tilt': 'Quyish uchun qo‘lingizni egiting',
  'vr.trigger': 'Tomizgich: bir tomchi · Panel tugmalarini bosish',
  'vr.leftStick': 'Yurish',
  'vr.rightStick': 'Burilish ◀ ▶ · Stol balandligi ▲ ▼',
  'vr.recenter': 'Stol oldiga qaytish',
  'vr.toggleHelp': 'Bu kartani yashirish / ko‘rsatish',
  'toast.full': 'Idish to‘ldi. Bir qismini rakovinaga to‘king.',

  'unit.ml': 'ml',
  'unit.pieces': 'dona',
  'unit.drops': 'tomchi',
  'unit.spoons': 'ulush',

  'item.hcl': 'Xlorid kislota',
  'item.hclDilute': 'Xlorid kislota',
  'item.naoh': 'Natriy gidroksid',
  'item.water': 'Distillangan suv',
  'item.beaker': 'Kimyoviy stakan',
  'item.litmus': 'Lakmus',
  'item.phenol': 'Fenolftalein',
  'item.methyl': 'Metil zarg‘aldog‘i',
  'item.universal': 'Universal indikator',
  'item.probe': 'pH-metr',
  'item.zinc': 'Rux granulalari',
  'item.collector': 'Yig‘uvchi probirka',
  'item.h2o2': 'Vodorod peroksid',
  'item.mno2': 'Marganes(IV) oksid',
  'item.splint': 'Cho‘p',
  'item.burner': 'Spirt lampa',

  'topic.indicators': 'Kislota, ishqor va indikatorlar',
  'topic.hydrogen': 'Vodorod olish',
  'topic.oxygen': 'Kislorod olish',
  'topic.separation': 'Aralashmani ajratish',
  'topic.equipment': 'Laboratoriya jihozlari',

  'ind.info': 'Indikatorlar pH ga qarab rangini o‘zgartiradi. Kislotalarda pH 7 dan kichik, ishqorlarda 7 dan katta. HCl + NaOH → NaCl + H₂O',
  'ind.s1': 'Stakanga xlorid kislota quying',
  'ind.s2': 'Unga indikator qo‘shing',
  'ind.s3': 'Natriy gidroksid bilan ham shunday qiling',
  'ind.s4': 'pH-metr bilan pH ni o‘lchang',
  'ind.s5': 'Neytrallang: pushti fenolftaleinni kislota bilan rangsizlantiring',

  'h2.info': 'Zn + 2HCl → ZnCl₂ + H₂↑   Vodorod havodan yengil va «pax» ovozi bilan yonadi.',
  'h2.s1': 'Probirkaga rux granulalarini soling',
  'h2.s2': 'Ustiga xlorid kislota quying',
  'h2.s3': 'Yig‘uvchi probirkani og‘zini pastga qilib ustida ushlang',
  'h2.s4': 'To‘lgan probirkani alangaga yaqinlashtiring: «pax» ovozini eshiting',
  'h2.s5': 'To‘la probirkani og‘zini yuqoriga qiling yoki joyiga qo‘ying. Nima bo‘ladi?',
  'h2.pop': '«Pax»! Bu vodorodning yonishi.',
  'h2.popBig': 'Kuchli «pax»! Probirkada vodorod ko‘p edi.',
  'h2.empty': 'Ovoz chiqmadi: probirkada vodorod deyarli yo‘q edi.',
  'h2.leak': 'Og‘zi yuqoriga qaraganda yengil vodorod uchib chiqib ketadi!',

  'o2.info': '2H₂O₂ → 2H₂O + O₂↑   MnO₂ katalizator: reaksiyani tezlashtiradi, o‘zi sarflanmaydi.',
  'o2.s1': 'Probirkaga vodorod peroksid quying',
  'o2.s2': 'Marganes(IV) oksid qo‘shing',
  'o2.s3': 'Cho‘pni spirt lampada yoqing',
  'o2.s4': 'Alanga o‘chishini kuting. Uchi cho‘g‘lanib turadi',
  'o2.s5': 'Cho‘g‘langan cho‘pni probirkaga tushiring',
  'o2.relit': 'Cho‘p alangalanib ketdi: bu kislorod!',
  'o2.glowing': 'Alanga o‘chdi, lekin uchi hali cho‘g‘lanib turibdi.',
  'o2.noO2': 'Bu yerda hali kislorod yetarli emas.',
};

const dicts: Record<Lang, Record<Key, string>> = { en, uz };

function initialLang(): Lang {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'uz' || q === 'en') return q;
  try {
    const saved = localStorage.getItem('vlvr.lang');
    if (saved === 'uz' || saved === 'en') return saved;
  } catch { /* storage blocked */ }
  return 'en';
}

let lang: Lang = initialLang();
const listeners = new Set<() => void>();

export function t(key: Key, vars?: Record<string, string | number>): string {
  let s = dicts[lang][key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export const getLang = () => lang;

export function setLang(next: Lang) {
  lang = next;
  document.documentElement.lang = next;
  try { localStorage.setItem('vlvr.lang', next); } catch { /* storage blocked */ }
  listeners.forEach((fn) => fn());
}

export function onLangChange(fn: () => void) {
  listeners.add(fn);
}
