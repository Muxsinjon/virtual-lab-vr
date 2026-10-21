// All on-screen text, in English and Uzbek (Latin script). Uzbek uses ‘ for o‘/g‘ and ’ for the
// tutuq belgisi.

export type Lang = 'en' | 'uz';

const en = {
  'app.title': 'Virtual Lab VR',
  'app.tagline': 'A chemistry lab where the chemicals never run out.',
  'ui.enterVR': 'Enter VR',
  'ui.exitVR': 'Exit VR',
  'ui.noVR': 'No VR headset found. The lab works on this screen too.',
  'ui.topics': 'Topics',
  'ui.back': 'Back',
  'ui.reset': 'Reset bench',
  'ui.lang': 'O‘zbekcha',
  'ui.seated': 'Seated mode',
  'ui.standing': 'Standing mode',
  'ui.putBack': 'Put back',
  'ui.use.pour': 'Hold to pour',
  'ui.use.drip': 'Add a drop',
  'ui.soon': 'Coming soon',
  'ui.steps': 'Your tasks',
  'ui.used': 'Used this session',
  'ui.usedNone': 'Nothing used yet',
  'ui.supply': 'Supply left: unlimited',
  'ui.allDone': 'All tasks done! Keep experimenting — nothing runs out here.',
  'ui.holding': 'Holding: {name}',
  'hint.mouse': 'Click an item to pick it up · Hold the mouse button to pour · Right-click or Esc to put it back · Drag empty space to look around',
  'hint.touch': 'Tap an item to pick it up · Drag to move it · Hold the button below to pour',
  'hint.vr': 'Grip button: grab · Tilt to pour · Trigger: droppers and panel buttons',
  'toast.spill': 'Spilled! Hold it right above a container.',
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
  'ui.exitVR': 'VR rejimidan chiqish',
  'ui.noVR': 'VR ko‘zoynak topilmadi. Laboratoriya shu ekranda ham ishlaydi.',
  'ui.topics': 'Mavzular',
  'ui.back': 'Orqaga',
  'ui.reset': 'Stolni tozalash',
  'ui.lang': 'English',
  'ui.seated': 'O‘tirgan holda',
  'ui.standing': 'Tik turgan holda',
  'ui.putBack': 'Joyiga qo‘yish',
  'ui.use.pour': 'Quyish uchun bosib turing',
  'ui.use.drip': 'Bir tomchi tomizish',
  'ui.soon': 'Tez orada',
  'ui.steps': 'Vazifalar',
  'ui.used': 'Bu mashg‘ulotda ishlatildi',
  'ui.usedNone': 'Hali hech narsa ishlatilmadi',
  'ui.supply': 'Qolgan zaxira: cheksiz',
  'ui.allDone': 'Barcha vazifalar bajarildi! Tajriba qilishda davom eting — bu yerda hech narsa tugamaydi.',
  'ui.holding': 'Qo‘lingizda: {name}',
  'hint.mouse': 'Buyumni olish uchun ustiga bosing · Quyish uchun sichqoncha tugmasini bosib turing · Joyiga qo‘yish uchun o‘ng tugma yoki Esc · Atrofga qarash uchun bo‘sh joyni suring',
  'hint.touch': 'Buyumni olish uchun ustiga bosing · Siljitish uchun suring · Quyish uchun pastdagi tugmani bosib turing',
  'hint.vr': 'Yon tugma: ushlash · Quyish uchun egiting · Old tugma: tomizgich va panel tugmalari',
  'toast.spill': 'To‘kildi! Idishning naq ustida ushlang.',
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
