/* ===================== Muscles, equipment, exercises ===================== */
const GROUPS = [
  { id: 'chest', name: 'Chest', subs: [['upper-chest', 'Upper chest', 'Incline presses, low-to-high flyes'], ['mid-chest', 'Mid chest', 'Flat presses, flyes, push-ups'], ['lower-chest', 'Lower chest', 'Dips, decline work, high-to-low flyes']] },
  { id: 'shoulders', name: 'Shoulders', subs: [['front-delts', 'Front delts', 'Overhead and front presses'], ['side-delts', 'Side delts', 'Lateral raises for width'], ['rear-delts', 'Rear delts', 'Reverse flyes, face pulls'], ['rotator-cuff', 'Rotator cuff', 'Shoulder health and stability']] },
  { id: 'back', name: 'Back', subs: [['lats', 'Lats', 'Pull-ups, pulldowns — back width'], ['upper-back', 'Upper back', 'Rhomboids and mid traps — rows'], ['traps', 'Upper traps', 'Shrugs, carries'], ['lower-back', 'Lower back', 'Spinal erectors — hinges']] },
  { id: 'biceps', name: 'Biceps', subs: [['biceps-long', 'Long head', 'Outer biceps — arms-back curls'], ['biceps-short', 'Short head', 'Inner biceps — preacher, spider curls'], ['brachialis', 'Brachialis', 'Hammer and reverse curls']] },
  { id: 'triceps', name: 'Triceps', subs: [['triceps-long', 'Long head', 'Overhead extensions'], ['triceps-lateral', 'Lateral & medial', 'Pushdowns, close-grip pressing']] },
  { id: 'forearms', name: 'Forearms', subs: [['forearm-flexors', 'Flexors & grip', 'Wrist curls, carries, hangs'], ['forearm-extensors', 'Extensors', 'Reverse curls, reverse wrist curls']] },
  { id: 'core', name: 'Core', subs: [['upper-abs', 'Upper abs', 'Crunching movements'], ['lower-abs', 'Lower abs', 'Leg and knee raises'], ['obliques', 'Obliques', 'Rotation and side bending'], ['deep-core', 'Deep core', 'Bracing: planks, dead bugs'], ['serratus', 'Serratus', 'Ribcage — protraction work']] },
  { id: 'glutes', name: 'Glutes', subs: [['glute-max', 'Glute max', 'Hip thrusts, squats, hinges'], ['glute-med', 'Glute med', 'Side glutes — abduction']] },
  { id: 'legs', name: 'Thighs', subs: [['quads', 'Quads', 'Squats, presses, extensions'], ['hamstrings', 'Hamstrings', 'RDLs and leg curls'], ['adductors', 'Adductors', 'Inner thigh'], ['hip-flexors', 'Hip flexors', 'Knee drives, leg raises']] },
  { id: 'calves', name: 'Lower legs', subs: [['gastrocnemius', 'Calves', 'Straight-knee calf raises'], ['soleus', 'Soleus', 'Bent-knee calf raises'], ['tibialis', 'Shins', 'Tibialis raises']] },
];
const SUB = {}; GROUPS.forEach(g => g.subs.forEach(([id, name, hint]) => SUB[id] = { id, name, hint, group: g.id, gname: g.name }));
const subLabel = id => { const s = SUB[id]; if (!s) return id; return ['Long head', 'Short head', 'Lateral & medial'].includes(s.name) ? `${s.gname} · ${s.name.toLowerCase()}` : s.name; };

const EQUIP = [
  { cat: 'Free weights', items: [['barbell', 'Barbell'], ['ezbar', 'EZ curl bar'], ['dumbbells', 'Dumbbells'], ['kettlebell', 'Kettlebell'], ['trapbar', 'Trap / hex bar'], ['plates', 'Weight plates'], ['landmine', 'Landmine']] },
  { cat: 'Benches & racks', items: [['bench', 'Flat bench'], ['adjbench', 'Adjustable bench'], ['rack', 'Squat / power rack'], ['pullupbar', 'Pull-up bar'], ['dipbars', 'Dip / knee-raise station'], ['preacher', 'Preacher bench'], ['hyper', 'Back extension bench'], ['box', 'Plyo box / step']] },
  { cat: 'Cables', items: [['cable', 'Cable station'], ['crossover', 'Cable crossover'], ['latpull', 'Lat pulldown'], ['cablerow', 'Seated cable row']] },
  { cat: 'Machines', items: [['smith', 'Smith machine'], ['chestpress', 'Chest press'], ['pecdeck', 'Pec deck / rear fly'], ['shoulderpress', 'Shoulder press'], ['rowmachine', 'Row machine'], ['assist', 'Assisted pull-up / dip'], ['legpress', 'Leg press'], ['hacksquat', 'Hack squat'], ['legext', 'Leg extension'], ['legcurl', 'Leg curl'], ['hipabd', 'Hip abductor / adductor'], ['calfstand', 'Standing calf raise'], ['calfseat', 'Seated calf raise'], ['abmachine', 'Ab crunch machine']] },
  { cat: 'Bodyweight & accessories', items: [['abwheel', 'Ab roller'], ['bands', 'Resistance bands'], ['suspension', 'Suspension trainer'], ['ball', 'Stability ball'], ['medball', 'Medicine ball'], ['sliders', 'Sliders / towel']] },
];
const EQ_NAME = {}; EQUIP.forEach(c => c.items.forEach(([id, n]) => EQ_NAME[id] = n));
const ALL_EQ = Object.keys(EQ_NAME);
const GEAR_PRESETS = [
  ['Full gym', ALL_EQ],
  ['Home gym', ['barbell', 'plates', 'dumbbells', 'kettlebell', 'bench', 'adjbench', 'rack', 'pullupbar', 'bands', 'abwheel', 'box']],
  ['Dumbbells + bench', ['dumbbells', 'adjbench', 'bench']],
  ['Hotel gym', ['dumbbells', 'adjbench', 'bench', 'cable', 'ball', 'chestpress']],
  ['Bands only', ['bands']],
  ['Bodyweight', []],
];
const MUSCLE_PRESETS = [
  ['Push day', ['upper-chest', 'mid-chest', 'lower-chest', 'front-delts', 'side-delts', 'triceps-long', 'triceps-lateral']],
  ['Pull day', ['lats', 'upper-back', 'rear-delts', 'biceps-long', 'biceps-short', 'brachialis']],
  ['Leg day', ['quads', 'hamstrings', 'glute-max', 'gastrocnemius']],
  ['Upper body', ['mid-chest', 'upper-chest', 'lats', 'upper-back', 'side-delts', 'biceps-long', 'triceps-lateral']],
  ['Lower body', ['quads', 'hamstrings', 'glute-max', 'glute-med', 'adductors', 'gastrocnemius']],
  ['Full body', ['mid-chest', 'lats', 'upper-back', 'front-delts', 'quads', 'hamstrings', 'glute-max', 'deep-core']],
  ['Arms', ['biceps-long', 'biceps-short', 'brachialis', 'triceps-long', 'triceps-lateral', 'forearm-flexors']],
  ['Core', ['upper-abs', 'lower-abs', 'obliques', 'deep-core']],
  ['Chest & back', ['upper-chest', 'mid-chest', 'lats', 'upper-back']],
  ['Shoulders', ['front-delts', 'side-delts', 'rear-delts', 'rotator-cuff', 'traps']],
  ['Glutes', ['glute-max', 'glute-med', 'hamstrings']],
  ['Back & biceps', ['lats', 'upper-back', 'lower-back', 'biceps-long', 'biceps-short']],
];
function hasEquip(set, id) {
  if (set.has(id)) return true;
  if (id === 'cable' && set.has('crossover')) return true;
  if (id === 'bench' && set.has('adjbench')) return true;
  return false;
}
function exAvailable(ex, set) { return ex.eq.every(r => Array.isArray(r) ? r.some(x => hasEquip(set, x)) : hasEquip(set, r)); }
const eqText = ex => ex.eq.length ? ex.eq.map(r => Array.isArray(r) ? r.map(x => EQ_NAME[x]).join(' or ') : EQ_NAME[r]).join(' + ') : 'Bodyweight';

const EX = [];
function X(id, name, eq, pri, sec, meta, anim, how, cues, avoid) {
  EX.push({ id, name, eq, pri, sec, lvl: meta.l || 1, comp: !!meta.c, pat: meta.p || id, unit: meta.u || 'reps', uni: !!meta.uni, anim, how, cues, avoid });
}
/* ---- Chest ---- */
X('bb-bench', 'Barbell bench press', ['barbell', 'bench', 'rack'], ['mid-chest'], ['front-delts', 'triceps-lateral'], { l: 2, c: 1, p: 'hpress' }, () => M.bench(),
  ['Lie back with your eyes under the bar and feet flat on the floor.', 'Pinch your shoulder blades together and grip just wider than shoulder width.', 'Unrack and lower the bar to mid-chest, elbows about 45° from your sides.', 'Press up and slightly back until your arms are straight over your shoulders.'],
  ['Keep a small arch and your glutes on the bench', 'Wrists stacked over elbows', 'Drive your feet into the floor'], ['Bouncing the bar off your chest', 'Flaring elbows out to 90°']);
X('bb-incline', 'Incline barbell press', ['barbell', 'adjbench', 'rack'], ['upper-chest'], ['front-delts', 'triceps-lateral'], { l: 2, c: 1, p: 'ipress' }, () => M.bench({ incline: 32 }),
  ['Set the bench to 30–45° and lie back with the bar over your eyes.', 'Grip slightly wider than shoulders and unrack.', 'Lower the bar to your upper chest, just below the collarbones.', 'Press straight up over your shoulders.'],
  ['Keep shoulder blades pinned back', 'Elbows slightly tucked', 'Steady 2-second lowering'], ['Setting the bench too steep — it turns into a shoulder press', 'Lifting your hips off the seat']);
X('bb-decline', 'Decline barbell press', ['barbell', 'adjbench', 'rack'], ['lower-chest'], ['triceps-lateral', 'front-delts'], { l: 2, c: 1, p: 'dpress' }, () => M.bench({ incline: -15 }),
  ['Hook your legs in and lie back on a 15–30° decline.', 'Grip slightly wider than shoulders and unrack with a spotter if you can.', 'Lower the bar to your lower chest.', 'Press up until your arms are straight.'],
  ['Control the descent — the bar travels a short path', 'Keep your upper back tight'], ['Lowering to the neck', 'Using a decline that is too steep']);
X('db-bench', 'Dumbbell bench press', ['dumbbells', 'bench'], ['mid-chest'], ['front-delts', 'triceps-lateral'], { l: 1, c: 1, p: 'hpress' }, () => M.bench({ imp: 'db' }),
  ['Sit with the dumbbells on your thighs, then lie back and bring them to chest level.', 'Plant your feet and squeeze your shoulder blades together.', 'Press the dumbbells up and slightly together over your chest.', 'Lower slowly until they are level with your chest.'],
  ['Forearms vertical at the bottom', 'Go deeper than a barbell allows', 'Keep the weights balanced side to side'], ['Clanging the dumbbells together at the top', 'Dropping the elbows below the bench too fast']);
X('db-incline', 'Incline dumbbell press', ['dumbbells', 'adjbench'], ['upper-chest'], ['front-delts', 'triceps-lateral'], { l: 1, c: 1, p: 'ipress' }, () => M.bench({ incline: 32, imp: 'db' }),
  ['Set the bench to about 30° and kick the dumbbells up to your shoulders.', 'Keep your shoulder blades pinned down and back.', 'Press up until the dumbbells nearly touch above your upper chest.', 'Lower slowly to the sides of your upper chest.'],
  ['30° is the sweet spot for upper chest', 'Elbows at 45°, not flared', 'Pause briefly at the bottom'], ['Bench too upright', 'Shrugging shoulders toward ears']);
X('db-decline', 'Decline dumbbell press', ['dumbbells', 'adjbench'], ['lower-chest'], ['triceps-lateral'], { l: 2, c: 1, p: 'dpress' }, () => M.bench({ incline: -15, imp: 'db' }),
  ['Hook your legs in on a slight decline and bring the dumbbells to your chest.', 'Press up over your lower chest.', 'Lower under control until level with your chest.'],
  ['Short controlled range', 'Squeeze the chest at the top'], ['Letting the dumbbells drift over your face']);
X('smith-incline', 'Smith machine incline press', ['smith', 'adjbench'], ['upper-chest'], ['front-delts', 'triceps-lateral'], { l: 1, c: 1, p: 'ipress' }, () => M.bench({ incline: 32, imp: 'smith' }),
  ['Position an incline bench so the bar lines up with your upper chest.', 'Grip just wider than shoulders and unhook the bar.', 'Lower to your upper chest, then press back up.'],
  ['Set the safety stops just above your chest', 'Keep elbows under the bar'], ['Bench in the wrong spot so the bar hits your neck']);
X('machine-press', 'Machine chest press', ['chestpress'], ['mid-chest'], ['front-delts', 'triceps-lateral'], { l: 1, c: 1, p: 'hpress' }, () => M.machinePress(),
  ['Adjust the seat so the handles line up with mid-chest.', 'Sit tall with your back against the pad.', 'Press the handles forward until your arms are almost straight.', 'Return slowly until you feel a chest stretch.'],
  ['Shoulder blades stay against the pad', 'Breathe out as you press'], ['Seat too low so the handles are at your shoulders', 'Locking out hard and resting']);
X('db-fly', 'Dumbbell fly', ['dumbbells', 'bench'], ['mid-chest'], ['front-delts'], { l: 1, p: 'fly' }, () => M.fly(),
  ['Lie on a flat bench holding dumbbells above your chest, palms facing each other.', 'With a soft bend in your elbows, open your arms wide in an arc.', 'Stop when you feel a deep stretch across your chest.', 'Hug the weights back up along the same arc.'],
  ['Keep the elbow bend fixed', 'Think "hug a tree"', 'Use lighter weights than you press'], ['Turning it into a press by bending elbows more', 'Going so deep the shoulders hurt']);
X('incline-fly', 'Incline dumbbell fly', ['dumbbells', 'adjbench'], ['upper-chest'], ['front-delts'], { l: 1, p: 'fly-i' }, () => M.fly({ incline: 30 }),
  ['Set the bench to 30° and hold the dumbbells over your upper chest.', 'Lower them out to the sides with a slight elbow bend.', 'Bring them back together over your collarbones.'],
  ['Lead with the elbows', 'Squeeze at the top for a second'], ['Arms straight and locked', 'Dropping too fast at the bottom']);
X('cable-fly-high', 'High-to-low cable fly', ['crossover'], ['lower-chest'], ['mid-chest'], { l: 1, p: 'cfly-h' }, () => M.cableFly({ dir: 'high' }),
  ['Set both pulleys high and grab a handle in each hand.', 'Step forward into a staggered stance with a slight forward lean.', 'Sweep your hands down and together in front of your hips.', 'Let them return up and out under control.'],
  ['Slight bend in the elbows the whole time', 'Squeeze the hands together at the bottom'], ['Bending at the waist to move the weight', 'Letting the cables yank your arms back']);
X('cable-fly-low', 'Low-to-high cable fly', ['crossover'], ['upper-chest'], ['front-delts'], { l: 1, p: 'cfly-l' }, () => M.cableFly({ dir: 'low' }),
  ['Set both pulleys low and hold a handle in each hand.', 'Stand in a split stance with palms facing forward.', 'Scoop your hands up and together to chin height.', 'Lower slowly back to your sides.'],
  ['Palms face up slightly', 'Finish with hands at upper-chest height'], ['Shrugging your shoulders', 'Using momentum from the legs']);
X('cable-fly-mid', 'Cable crossover', ['crossover'], ['mid-chest'], ['front-delts'], { l: 1, p: 'cfly-m' }, () => M.cableFly({ dir: 'mid' }),
  ['Set both pulleys at shoulder height.', 'Step forward with a handle in each hand, arms out wide.', 'Bring your hands together in front of your chest.', 'Open back up slowly until you feel a stretch.'],
  ['Chest up, shoulders down', 'Pause with hands together'], ['Rolling the shoulders forward']);
X('pec-deck', 'Pec deck fly', ['pecdeck'], ['mid-chest'], ['front-delts'], { l: 1, p: 'fly-m' }, () => M.pecDeck(),
  ['Adjust the seat so the handles are at chest height.', 'Sit tall and grab the handles with a slight elbow bend.', 'Bring the handles together in front of you.', 'Open slowly until you feel a chest stretch.'],
  ['Keep your back on the pad', 'Squeeze for one second in front'], ['Letting the weight stack slam']);
X('pushup', 'Push-up', [], ['mid-chest'], ['triceps-lateral', 'front-delts', 'deep-core'], { l: 1, c: 1, p: 'hpress-bw' }, () => M.pushup(),
  ['Start in a high plank with hands just wider than your shoulders.', 'Brace your abs and squeeze your glutes so your body is one straight line.', 'Lower until your chest is a fist above the floor, elbows at about 45°.', 'Push the floor away to return to the top.'],
  ['Head in line with your spine', 'Elbows back, not out to the sides', 'Too hard? Do them with hands on a bench'], ['Sagging hips', 'Half reps that stop short']);
X('decline-pushup', 'Feet-elevated push-up', [['bench', 'box']], ['upper-chest'], ['front-delts', 'triceps-lateral'], { l: 2, c: 1, p: 'ipress-bw' }, () => M.pushup({ v: 'decline' }),
  ['Put your feet on a bench or box and your hands on the floor.', 'Hold a straight line from heels to head.', 'Lower your chest toward the floor between your hands.', 'Press back up.'],
  ['Higher feet = more upper chest and shoulders', 'Keep your core tight'], ['Piking the hips up', 'Letting the head drop first']);
X('incline-pushup', 'Incline push-up', [['bench', 'box']], ['lower-chest'], ['triceps-lateral', 'deep-core'], { l: 1, c: 1, p: 'dpress-bw' }, () => M.pushup({ v: 'incline' }),
  ['Place your hands on the edge of a bench, a little wider than shoulders.', 'Walk your feet back into a straight plank.', 'Lower your chest to the bench edge.', 'Push back up.'],
  ['Great starting point if floor push-ups are too hard', 'Lower slowly'], ['Hips sagging toward the floor']);
X('wide-pushup', 'Wide push-up', [], ['mid-chest'], ['front-delts'], { l: 1, c: 1, p: 'hpress-bw' }, () => M.pushup({ v: 'wide' }),
  ['Set your hands about 1.5× shoulder width.', 'Lower your chest between your hands.', 'Press back up, squeezing your chest.'],
  ['Hands turned slightly out', 'Keep your body straight'], ['Going so wide your shoulders ache']);
X('chest-dip', 'Chest dip', ['dipbars'], ['lower-chest'], ['triceps-lateral', 'front-delts'], { l: 2, c: 1, p: 'dip' }, () => M.dip({ chest: true }),
  ['Support yourself on the bars with straight arms.', 'Lean your torso forward about 25° and bend your knees.', 'Lower until your upper arms are about parallel to the floor.', 'Press back up, keeping the forward lean.'],
  ['Lean forward to shift work to the chest', 'Elbows flare slightly out'], ['Going too deep with stiff shoulders', 'Swinging the legs']);
X('db-pullover', 'Dumbbell pullover', ['dumbbells', 'bench'], ['mid-chest', 'lats'], ['triceps-long', 'serratus'], { l: 2, p: 'pullover' }, () => M.pullover(),
  ['Lie on a bench and hold one dumbbell over your chest with both hands.', 'Keep a slight bend in the elbows.', 'Lower the weight in an arc behind your head until you feel a stretch.', 'Pull it back over your chest.'],
  ['Ribs down — don’t arch to get deeper', 'Move only at the shoulders'], ['Bending and straightening the elbows', 'Using a weight you can’t control overhead']);
X('landmine-press', 'Landmine press', ['barbell', 'landmine'], ['upper-chest', 'front-delts'], ['triceps-lateral', 'serratus'], { l: 1, c: 1, p: 'lpress' }, () => M.landminePress(),
  ['Wedge one end of a barbell into a landmine and hold the other end at your chest.', 'Stand in a slight forward lean with feet hip width.', 'Press the bar up and forward until your arms are straight.', 'Lower back to your upper chest.'],
  ['Shoulder-friendly pressing angle', 'Reach at the top to work the serratus'], ['Leaning back to finish the rep']);
X('svend-press', 'Plate squeeze press', ['plates'], ['mid-chest'], ['front-delts'], { l: 1, p: 'svend' }, () => M.svend(),
  ['Hold one or two plates between your palms at chest height.', 'Squeeze the plates together as hard as you can.', 'Press them straight out in front, still squeezing.', 'Bring them back to your chest.'],
  ['The squeeze does the work, not the weight', 'Keep shoulders down'], ['Letting the squeeze relax mid-rep']);
X('db-floor-press', 'Dumbbell floor press', ['dumbbells'], ['mid-chest'], ['triceps-lateral', 'front-delts'], { l: 1, c: 1, p: 'hpress' }, () => M.floorPress(),
  ['Lie on the floor with knees bent and dumbbells at your chest.', 'Press the weights up over your chest.', 'Lower until your upper arms touch the floor.', 'Pause, then press again.'],
  ['The floor protects your shoulders', 'Pause dead on the floor'], ['Bouncing the elbows off the floor']);
X('band-press', 'Band chest press', ['bands'], ['mid-chest'], ['front-delts', 'triceps-lateral'], { l: 1, c: 1, p: 'hpress' }, () => M.bandPress(),
  ['Anchor a band behind you at chest height and hold an end in each hand.', 'Step forward until the band has tension, one foot in front.', 'Press your hands forward until your arms are straight.', 'Return slowly.'],
  ['Tension increases as you press — squeeze at the end', 'Keep elbows at chest height'], ['Letting the band pull your arms back too fast']);
X('susp-press', 'Suspension chest press', ['suspension'], ['mid-chest'], ['deep-core', 'triceps-lateral'], { l: 1, c: 1, p: 'hpress-bw' }, () => M.suspPress(),
  ['Face away from the anchor holding the handles at chest height.', 'Walk your feet back and lean forward into a plank.', 'Lower your chest between the handles.', 'Press back up to straight arms.'],
  ['More lean = harder', 'Squeeze glutes so hips don’t sag'], ['Letting the straps rub your arms', 'Hands drifting too wide']);
/* ---- Shoulders ---- */
X('ohp', 'Standing overhead press', ['barbell'], ['front-delts'], ['side-delts', 'triceps-lateral', 'upper-chest', 'deep-core'], { l: 2, c: 1, p: 'vpress' }, () => M.ohp(),
  ['Hold the bar at your collarbones with hands just outside shoulder width.', 'Squeeze your glutes and brace your abs.', 'Press straight up, moving your head back so the bar passes your face.', 'Finish with the bar over the middle of your feet, head through.'],
  ['Elbows slightly in front of the bar at the start', 'Squeeze glutes so you don’t lean back'], ['Arching the low back to finish', 'Pressing the bar out in front']);
X('db-shoulder-press', 'Seated dumbbell shoulder press', ['dumbbells', 'adjbench'], ['front-delts'], ['side-delts', 'triceps-lateral'], { l: 1, c: 1, p: 'vpress' }, () => M.ohp({ imp: 'db', sit: true }),
  ['Set the bench upright and sit with dumbbells at shoulder height.', 'Keep your back against the pad and feet planted.', 'Press the dumbbells up until your arms are straight.', 'Lower until they are level with your ears.'],
  ['Elbows slightly forward, not straight out', 'Don’t clank the weights at the top'], ['Arching off the back pad', 'Cutting the range short']);
X('arnold-press', 'Arnold press', ['dumbbells'], ['front-delts', 'side-delts'], ['triceps-lateral'], { l: 2, c: 1, p: 'vpress-a' }, () => M.ohp({ imp: 'arnold' }),
  ['Hold dumbbells at chin height with palms facing you.', 'As you press, rotate your palms to face forward and open your elbows.', 'Finish with arms straight overhead.', 'Reverse the rotation on the way down.'],
  ['Smooth rotation through the whole rep', 'Use lighter weights than a normal press'], ['Rushing the rotation', 'Leaning back']);
X('machine-shoulder', 'Machine shoulder press', ['shoulderpress'], ['front-delts'], ['side-delts', 'triceps-lateral'], { l: 1, c: 1, p: 'vpress' }, () => M.ohp({ imp: 'machine', sit: true }),
  ['Adjust the seat so the handles start at shoulder height.', 'Sit tall with your back on the pad.', 'Press up until your arms are nearly straight.', 'Lower slowly.'],
  ['Good choice for going close to failure safely'], ['Seat too high so you start mid-range']);
X('pike-pushup', 'Pike push-up', [], ['front-delts'], ['triceps-lateral', 'upper-chest'], { l: 2, c: 1, p: 'vpress-bw' }, () => M.pike(),
  ['Start in a push-up, then walk your feet in and lift your hips high.', 'Hands a little wider than shoulders, head between your arms.', 'Bend your elbows to lower the top of your head toward the floor.', 'Press back up.'],
  ['Hips stay high the whole time', 'Feet on a box makes it harder'], ['Turning it into a regular push-up']);
X('db-lateral', 'Dumbbell lateral raise', ['dumbbells'], ['side-delts'], ['traps'], { l: 1, p: 'lat' }, () => M.lateral(),
  ['Stand holding light dumbbells at your sides, slight lean forward.', 'With a soft bend in your elbows, raise your arms out to the sides.', 'Stop at shoulder height.', 'Lower slowly over 2–3 seconds.'],
  ['Lead with the elbows', 'Think "pour water" — pinkies slightly up', 'Light weight, strict reps'], ['Swinging the body', 'Shrugging the weight up with traps']);
X('cable-lateral', 'Cable lateral raise', ['cable'], ['side-delts'], [], { l: 1, p: 'lat', uni: 1 }, () => M.lateral({ imp: 'cable' }),
  ['Set the pulley at the lowest point and stand side-on to it.', 'Grab the handle with the far hand, cable crossing in front of you.', 'Raise your arm out to the side to shoulder height.', 'Lower slowly.'],
  ['Constant tension from the bottom', 'Hold the machine for balance'], ['Twisting your torso to lift']);
X('band-lateral', 'Band lateral raise', ['bands'], ['side-delts'], [], { l: 1, p: 'lat' }, () => M.lateral({ imp: 'band' }),
  ['Stand on a band and hold the ends, crossing them in front of you.', 'Raise your arms out to the sides to shoulder height.', 'Lower slowly.'],
  ['Pause at the top where tension is highest'], ['Letting the band snap you down']);
X('front-raise', 'Dumbbell front raise', ['dumbbells'], ['front-delts'], ['upper-chest'], { l: 1, p: 'front' }, () => M.frontRaise(),
  ['Stand holding dumbbells in front of your thighs, palms down.', 'Raise your arms in front of you to eye level.', 'Lower slowly.'],
  ['Arms almost straight', 'Stay tall — no leaning back'], ['Swinging the weights up']);
X('plate-front-raise', 'Plate front raise', ['plates'], ['front-delts'], ['upper-chest'], { l: 1, p: 'front' }, () => M.frontRaise({ imp: 'plate' }),
  ['Hold a plate at 3 and 9 o’clock in front of your thighs.', 'Raise it in front of you to eye level.', 'Lower slowly.'],
  ['Brace your core', 'Smooth tempo'], ['Using your back to swing it']);
X('rear-delt-fly', 'Bent-over rear delt fly', ['dumbbells'], ['rear-delts'], ['upper-back'], { l: 1, p: 'rfly' }, () => M.reverseFly(),
  ['Hinge forward until your torso is nearly parallel to the floor.', 'Let the dumbbells hang under your chest, palms facing in.', 'Sweep your arms out wide to shoulder height.', 'Lower slowly.'],
  ['Pinkies lead the way', 'Neck neutral — look at the floor ahead'], ['Squeezing shoulder blades so hard the traps take over', 'Standing up as you lift']);
X('reverse-pec-deck', 'Reverse pec deck', ['pecdeck'], ['rear-delts'], ['upper-back'], { l: 1, p: 'rfly' }, () => M.pecDeck({ reverse: true }),
  ['Sit facing the pad with the handles set at shoulder height.', 'Grab the handles with straight arms.', 'Sweep your arms back until they line up with your body.', 'Return slowly.'],
  ['Chest stays on the pad', 'Think about pushing the handles out, not back'], ['Shrugging']);
X('cable-rear-fly', 'Cable reverse fly', ['crossover'], ['rear-delts'], ['upper-back'], { l: 1, p: 'rfly' }, () => M.cableRevFly(),
  ['Set both pulleys at shoulder height and cross the cables — left hand holds the right cable.', 'Step back so your arms are straight in front of you.', 'Pull your arms apart and back in a wide arc.', 'Return slowly.'],
  ['Straight arms, soft elbows', 'Stop when your arms line up with your shoulders'], ['Leaning back to move the weight']);
X('face-pull', 'Face pull', ['cable'], ['rear-delts', 'rotator-cuff'], ['upper-back', 'traps'], { l: 1, p: 'facepull' }, () => M.facePull(),
  ['Set a rope at upper-chest to face height.', 'Grab the rope with thumbs pointing back toward you.', 'Pull the rope toward your face, elbows high and wide.', 'Finish with hands beside your ears, then return slowly.'],
  ['Pull the rope apart as you pull in', 'Elbows at or above shoulder height'], ['Going too heavy and leaning back']);
X('band-pull-apart', 'Band pull-apart', ['bands'], ['rear-delts'], ['upper-back', 'rotator-cuff'], { l: 1, p: 'rfly' }, () => M.pullApart(),
  ['Hold a light band in front of you at shoulder height, arms straight.', 'Pull the band apart until it touches your chest.', 'Return slowly.'],
  ['Great warm-up for any upper-body day', 'Keep ribs down'], ['Bending the elbows']);
X('upright-row', 'Upright row', [['ezbar', 'barbell']], ['side-delts', 'traps'], ['front-delts'], { l: 2, p: 'urow' }, () => M.uprightRow(),
  ['Hold the bar in front of your thighs with hands a bit wider than shoulders.', 'Pull it up along your body, leading with the elbows.', 'Stop when your elbows reach shoulder height.', 'Lower slowly.'],
  ['Wider grip is easier on the shoulders', 'Elbows above the hands'], ['Pulling the bar to your chin with a narrow grip']);
X('cable-upright-row', 'Cable upright row', ['cable'], ['side-delts', 'traps'], [], { l: 1, p: 'urow' }, () => M.uprightRow({ imp: 'cable' }),
  ['Attach a straight bar to a low pulley.', 'Stand close and hold the bar with a shoulder-width grip.', 'Pull it up to lower-chest height, elbows high.', 'Lower slowly.'],
  ['Constant tension through the whole rep'], ['Leaning back']);
X('cable-ext-rot', 'Cable external rotation', ['cable'], ['rotator-cuff'], ['rear-delts'], { l: 1, p: 'extrot', uni: 1 }, () => M.extRot(),
  ['Set the pulley at elbow height and stand side-on to it.', 'Hold the handle in the far hand, elbow bent 90° and tucked at your side.', 'Rotate your forearm outward, keeping the elbow pinned.', 'Return slowly.'],
  ['A rolled towel under the elbow helps', 'Light weight — this is a small muscle'], ['Letting the elbow drift away from the body']);
X('band-ext-rot', 'Band external rotation', ['bands'], ['rotator-cuff'], ['rear-delts'], { l: 1, p: 'extrot', uni: 1 }, () => M.extRot({ imp: 'band' }),
  ['Anchor a light band at elbow height and stand side-on.', 'Elbow bent 90° and tucked in, rotate your hand outward.', 'Return slowly.'],
  ['Slow and controlled'], ['Twisting your torso']);
/* ---- Back ---- */
X('pullup', 'Pull-up', ['pullupbar'], ['lats'], ['biceps-long', 'upper-back', 'forearm-flexors'], { l: 2, c: 1, p: 'vpull' }, () => M.pullup(),
  ['Hang from the bar with hands a bit wider than shoulders, palms forward.', 'Pull your shoulders down and back to start.', 'Pull until your chin clears the bar, driving elbows toward your hips.', 'Lower all the way to a dead hang.'],
  ['Chest to the bar, not chin to the sky', 'Can’t do one yet? Use a band or slow negatives'], ['Kipping and swinging', 'Half reps from a bent-arm start']);
X('chinup', 'Chin-up', ['pullupbar'], ['lats', 'biceps-short'], ['biceps-long', 'upper-back'], { l: 2, c: 1, p: 'vpull-c' }, () => M.pullup({ grip: 'chin' }),
  ['Hang with palms facing you, hands shoulder width.', 'Pull your chest toward the bar.', 'Lower slowly to straight arms.'],
  ['Easier than pull-ups for most people', 'Squeeze the biceps at the top'], ['Craning the neck to get the chin over']);
X('assisted-pullup', 'Assisted pull-up', ['assist'], ['lats'], ['biceps-long', 'upper-back'], { l: 1, c: 1, p: 'vpull' }, () => M.pullup({ assist: true }),
  ['Kneel on the pad and grab the handles wider than shoulders.', 'Pull your chest up toward the handles.', 'Lower slowly to full stretch.'],
  ['More counterweight = easier', 'Reduce assistance as you get stronger'], ['Bouncing out of the bottom']);
X('lat-pulldown', 'Wide-grip lat pulldown', ['latpull'], ['lats'], ['biceps-long', 'upper-back'], { l: 1, c: 1, p: 'vpull' }, () => M.pulldown(),
  ['Lock your thighs under the pad and grab the bar wider than shoulders.', 'Lean back slightly and lift your chest.', 'Pull the bar to your upper chest, elbows down and back.', 'Let it rise until your arms are straight.'],
  ['Pull with your elbows, not your hands', 'Pause with the bar at your chest'], ['Leaning way back to row the weight', 'Pulling behind the neck']);
X('close-pulldown', 'Close-grip pulldown', ['latpull'], ['lats'], ['biceps-long', 'brachialis', 'upper-back'], { l: 1, c: 1, p: 'vpull-c' }, () => M.pulldown({ grip: 'close' }),
  ['Attach a V-handle and sit with thighs locked in.', 'Pull the handle to your upper chest.', 'Return slowly to a full stretch.'],
  ['Neutral grip is easy on the elbows', 'Drive elbows to your ribs'], ['Rocking the torso']);
X('straight-arm-pulldown', 'Straight-arm pulldown', ['cable'], ['lats'], ['triceps-long'], { l: 1, p: 'sapd' }, () => M.straightArm(),
  ['Set a bar or rope on a high pulley.', 'Hinge forward slightly with arms straight up in front.', 'Sweep the bar down to your thighs, keeping arms straight.', 'Let it rise slowly.'],
  ['Feel it in your armpits/lats', 'Elbows soft but fixed'], ['Bending the elbows into a pushdown']);
X('bb-row', 'Barbell bent-over row', ['barbell'], ['upper-back', 'lats'], ['rear-delts', 'biceps-long', 'lower-back'], { l: 2, c: 1, p: 'hrow' }, () => M.bentRow(),
  ['Hold the bar at hip width and hinge until your torso is about 45°.', 'Brace your back flat and let the bar hang.', 'Row the bar to your lower ribs.', 'Lower under control.'],
  ['Keep the hinge angle fixed', 'Squeeze shoulder blades at the top'], ['Standing up as you row', 'Rounding the lower back']);
X('db-bent-row', 'Dumbbell bent-over row', ['dumbbells'], ['upper-back', 'lats'], ['rear-delts', 'biceps-long'], { l: 1, c: 1, p: 'hrow' }, () => M.bentRow({ imp: 'db' }),
  ['Hinge forward with a dumbbell in each hand, palms facing in.', 'Row both dumbbells to your hips.', 'Lower to a full stretch.'],
  ['Elbows close to your sides', 'Flat back'], ['Jerking the weight up']);
X('one-arm-row', 'One-arm dumbbell row', ['dumbbells', 'bench'], ['lats'], ['upper-back', 'biceps-long', 'rear-delts'], { l: 1, c: 1, p: 'hrow-u', uni: 1 }, () => M.oneArmRow(),
  ['Put one hand on a bench and hinge so your back is flat.', 'Hold a dumbbell in the other hand, arm straight.', 'Row the dumbbell toward your hip.', 'Lower to a full stretch.'],
  ['Pull toward the hip for lats, toward the ribs for upper back', 'Keep shoulders level'], ['Rotating the torso to heave it up']);
X('chest-sup-row', 'Chest-supported dumbbell row', ['dumbbells', 'adjbench'], ['upper-back'], ['rear-delts', 'lats'], { l: 1, c: 1, p: 'hrow' }, () => M.chestSupRow(),
  ['Set a bench to 30–45° and lie chest-down on it.', 'Let the dumbbells hang straight down.', 'Row them up, squeezing your shoulder blades.', 'Lower slowly.'],
  ['The pad takes your lower back out of it', 'Pause at the top'], ['Lifting your chest off the pad']);
X('cable-row', 'Seated cable row', ['cablerow'], ['upper-back', 'lats'], ['biceps-long', 'rear-delts'], { l: 1, c: 1, p: 'hrow' }, () => M.cableRow(),
  ['Sit with feet on the platform and knees slightly bent.', 'Grab the handle and sit tall.', 'Row the handle to your belly, driving elbows back.', 'Reach forward slowly to stretch your back.'],
  ['Chest up at the finish', 'Small lean, not a big rock'], ['Using your lower back to swing']);
X('band-row', 'Band seated row', ['bands'], ['upper-back'], ['lats', 'biceps-long'], { l: 1, c: 1, p: 'hrow' }, () => M.cableRow({ band: true }),
  ['Sit with legs straight and loop the band around your feet.', 'Row the ends to your belly.', 'Return slowly.'],
  ['Squeeze shoulder blades together'], ['Rounding your back']);
X('tbar-row', 'T-bar row', ['barbell', 'landmine'], ['upper-back', 'lats'], ['rear-delts', 'biceps-long'], { l: 2, c: 1, p: 'hrow' }, () => M.bentRow({ tbar: true }),
  ['Straddle the bar and hold it near the plates with both hands.', 'Hinge to about 45° with a flat back.', 'Row the bar to your chest.', 'Lower under control.'],
  ['Lets you move heavy weight', 'Keep your chest up'], ['Rounding the back']);
X('machine-row', 'Machine row', ['rowmachine'], ['upper-back'], ['lats', 'rear-delts'], { l: 1, c: 1, p: 'hrow' }, () => M.machineRow(),
  ['Set the chest pad so you reach the handles with straight arms.', 'Pull the handles toward your ribs.', 'Return slowly.'],
  ['Great for safe high-effort sets'], ['Pulling your chest off the pad']);
X('inverted-row', 'Inverted row', [['rack', 'smith']], ['upper-back'], ['lats', 'biceps-long', 'rear-delts'], { l: 1, c: 1, p: 'hrow-bw' }, () => M.invertedRow(),
  ['Set a bar at hip height and lie under it.', 'Grab it a bit wider than shoulders, body straight, heels down.', 'Pull your chest to the bar.', 'Lower to straight arms.'],
  ['Walk feet forward to make it easier', 'Squeeze glutes to stay straight'], ['Letting hips sag']);
X('trx-row', 'Suspension row', ['suspension'], ['upper-back'], ['lats', 'biceps-long'], { l: 1, c: 1, p: 'hrow-bw' }, () => M.invertedRow({ susp: true }),
  ['Hold the handles and lean back with straight arms.', 'Keep your body in a straight line.', 'Pull your chest up to the handles.', 'Lower slowly.'],
  ['More upright = easier'], ['Shrugging up']);
X('deadlift', 'Conventional deadlift', ['barbell'], ['lower-back', 'glute-max', 'hamstrings'], ['quads', 'traps', 'forearm-flexors', 'upper-back'], { l: 3, c: 1, p: 'hinge-dl' }, () => M.deadlift(),
  ['Stand with the bar over mid-foot, feet hip width.', 'Hinge down and grip just outside your legs.', 'Drop hips, lift chest and pull the slack out of the bar.', 'Push the floor away, keeping the bar against your legs, and stand tall.', 'Hinge back down the same way.'],
  ['Bar stays in contact with your legs', 'Lats tight — "protect your armpits"', 'Neutral neck'], ['Rounding the lower back', 'Jerking the bar off the floor', 'Leaning back at the top']);
X('back-ext', '45° back extension', ['hyper'], ['lower-back'], ['glute-max', 'hamstrings'], { l: 1, p: 'backext' }, () => M.backExt(),
  ['Set the pad just below your hip bones and lock your ankles in.', 'Cross your arms over your chest.', 'Hinge down at the hips until you feel a hamstring stretch.', 'Raise back up to a straight line.'],
  ['Stop at a straight line — don’t over-arch', 'Hold a plate to make it harder'], ['Swinging up fast']);
X('superman', 'Superman', [], ['lower-back'], ['glute-max', 'rear-delts'], { l: 1, p: 'backext-bw' }, () => M.superman(),
  ['Lie face down with arms stretched overhead.', 'Lift your arms, chest and legs off the floor together.', 'Hold for a second, then lower.'],
  ['Squeeze glutes', 'Look at the floor'], ['Cranking your neck up']);
X('good-morning', 'Good morning', ['barbell', 'rack'], ['hamstrings', 'lower-back'], ['glute-max'], { l: 2, c: 1, p: 'hinge' }, () => M.goodMorning(),
  ['Set the bar on your upper back like a squat.', 'With soft knees, push your hips back and lower your chest.', 'Stop when your torso is nearly parallel or you feel a strong stretch.', 'Drive your hips forward to stand.'],
  ['Start light', 'Back flat throughout'], ['Bending the knees into a squat', 'Rounding the back']);
X('bb-shrug', 'Barbell shrug', ['barbell'], ['traps'], ['forearm-flexors'], { l: 1, p: 'shrug' }, () => M.shrug(),
  ['Hold the bar in front of your thighs with straight arms.', 'Shrug your shoulders straight up toward your ears.', 'Hold for a second, then lower.'],
  ['Straight up and down — no rolling', 'Use straps if grip gives out'], ['Bending the elbows']);
X('db-shrug', 'Dumbbell shrug', ['dumbbells'], ['traps'], ['forearm-flexors'], { l: 1, p: 'shrug' }, () => M.shrug({ imp: 'db' }),
  ['Hold dumbbells at your sides.', 'Shrug straight up.', 'Pause and lower slowly.'],
  ['Full range: deep stretch at the bottom'], ['Rolling the shoulders']);
X('trap-shrug', 'Trap bar shrug', ['trapbar'], ['traps'], ['forearm-flexors'], { l: 1, p: 'shrug' }, () => M.shrug({ imp: 'trap' }),
  ['Stand inside the trap bar holding the handles.', 'Shrug straight up.', 'Lower slowly.'],
  ['Handles at your sides keep you upright'], ['Head jutting forward']);
X('renegade-row', 'Renegade row', ['dumbbells'], ['upper-back', 'deep-core'], ['lats', 'obliques', 'triceps-lateral'], { l: 3, c: 1, p: 'renegade' }, () => M.renegade(),
  ['Get into a push-up position with hands on dumbbells, feet wide.', 'Row one dumbbell to your hip while bracing.', 'Lower it and row the other side.'],
  ['Hips stay square to the floor', 'Wider feet = more stable'], ['Twisting the hips to lift']);
/* ---- Biceps ---- */
X('bb-curl', 'Barbell curl', ['barbell'], ['biceps-short', 'biceps-long'], ['brachialis'], { l: 1, p: 'curl' }, () => M.curl(),
  ['Hold the bar with palms up, hands shoulder width.', 'Pin your elbows at your sides.', 'Curl the bar up to your shoulders.', 'Lower all the way down.'],
  ['Elbows stay still', 'Squeeze at the top'], ['Swinging the hips', 'Elbows drifting forward']);
X('ez-curl', 'EZ-bar curl', ['ezbar'], ['biceps-short', 'biceps-long'], ['brachialis'], { l: 1, p: 'curl' }, () => M.curl({ imp: 'ez' }),
  ['Hold the EZ bar on the angled grips, palms up.', 'Curl up with elbows pinned.', 'Lower slowly.'],
  ['Easier on the wrists than a straight bar'], ['Leaning back']);
X('db-curl', 'Dumbbell curl', ['dumbbells'], ['biceps-long', 'biceps-short'], ['brachialis'], { l: 1, p: 'curl' }, () => M.curl({ imp: 'db' }),
  ['Hold dumbbells at your sides, palms facing forward.', 'Curl both up, keeping elbows still.', 'Lower all the way.'],
  ['Turn pinkies up at the top for a stronger squeeze', 'Can alternate arms'], ['Swinging']);
X('hammer-curl', 'Hammer curl', ['dumbbells'], ['brachialis'], ['biceps-long', 'forearm-extensors'], { l: 1, p: 'hammer' }, () => M.curl({ imp: 'db', grip: 'neu' }),
  ['Hold dumbbells at your sides with palms facing each other.', 'Curl up keeping that neutral grip.', 'Lower slowly.'],
  ['Builds arm thickness and forearms'], ['Elbows swinging forward']);
X('incline-curl', 'Incline dumbbell curl', ['dumbbells', 'adjbench'], ['biceps-long'], ['biceps-short'], { l: 2, p: 'curl-long' }, () => M.inclineCurl(),
  ['Set the bench to about 55° and sit back with dumbbells hanging.', 'Let your arms hang straight down behind your torso.', 'Curl up without moving your upper arms.', 'Lower to a full stretch.'],
  ['The stretch is the point — go light', 'Head back on the pad'], ['Bringing the elbows forward']);
X('preacher-curl', 'Preacher curl', ['preacher', ['ezbar', 'dumbbells', 'barbell']], ['biceps-short'], ['brachialis'], { l: 1, p: 'curl-short' }, () => M.preacher(),
  ['Sit at the preacher bench with your upper arms flat on the pad.', 'Hold an EZ bar with palms up.', 'Curl up until your forearms are almost vertical.', 'Lower until arms are nearly straight.'],
  ['Slow on the way down', 'Armpits snug against the pad'], ['Bouncing out of the bottom', 'Lifting elbows off the pad']);
X('conc-curl', 'Concentration curl', ['dumbbells', 'bench'], ['biceps-short'], ['biceps-long'], { l: 1, p: 'curl-short', uni: 1 }, () => M.concentration(),
  ['Sit on a bench, lean forward, and brace your elbow on your inner thigh.', 'Curl the dumbbell toward your shoulder.', 'Lower all the way.'],
  ['Squeeze hard at the top', 'Only the forearm moves'], ['Using the other hand to help']);
X('cable-curl', 'Cable curl', ['cable'], ['biceps-short', 'biceps-long'], ['brachialis'], { l: 1, p: 'curl' }, () => M.curl({ imp: 'cable' }),
  ['Attach a straight bar to a low pulley.', 'Stand close, palms up, elbows pinned.', 'Curl the bar to your shoulders.', 'Lower slowly.'],
  ['Constant tension at the bottom'], ['Leaning back']);
X('bayesian-curl', 'Bayesian cable curl', ['cable'], ['biceps-long'], ['biceps-short'], { l: 2, p: 'curl-long', uni: 1 }, () => M.bayesian(),
  ['Set a handle on a low or mid pulley and face away from it.', 'Step forward so your arm is pulled back behind you.', 'Curl the handle forward, keeping the upper arm back.', 'Lower to a full stretch.'],
  ['Big stretch on the long head'], ['Letting the elbow swing forward']);
X('spider-curl', 'Spider curl', ['dumbbells', 'adjbench'], ['biceps-short'], ['brachialis'], { l: 1, p: 'curl-short' }, () => M.spider(),
  ['Lie chest-down on a 45° incline bench with arms hanging straight down.', 'Curl the dumbbells up.', 'Squeeze, then lower slowly.'],
  ['Hardest at the top — hold it'], ['Swinging the arms back']);
X('reverse-curl', 'Reverse curl', [['ezbar', 'barbell']], ['brachialis', 'forearm-extensors'], ['biceps-long'], { l: 1, p: 'rcurl' }, () => M.curl({ imp: 'ez', grip: 'pro' }),
  ['Hold the bar with palms facing down.', 'Curl up with wrists straight.', 'Lower slowly.'],
  ['Use less weight than normal curls'], ['Letting wrists bend back']);
X('band-curl', 'Band curl', ['bands'], ['biceps-short', 'biceps-long'], [], { l: 1, p: 'curl' }, () => M.curl({ imp: 'band' }),
  ['Stand on the band and hold the ends, palms up.', 'Curl up with elbows pinned.', 'Lower slowly.'],
  ['Squeeze at the top where tension peaks'], ['Elbows drifting forward']);
/* ---- Triceps ---- */
X('close-bench', 'Close-grip bench press', ['barbell', 'bench', 'rack'], ['triceps-lateral', 'triceps-long'], ['mid-chest', 'front-delts'], { l: 2, c: 1, p: 'hpress-cg' }, () => M.bench({ close: true }),
  ['Lie on the bench and grip the bar at shoulder width.', 'Unrack and lower to your lower chest, elbows tucked.', 'Press up to lockout.'],
  ['Shoulder width is close enough', 'Elbows brush your sides'], ['Grip so narrow it hurts your wrists']);
X('pushdown', 'Cable pushdown', ['cable'], ['triceps-lateral'], ['triceps-long'], { l: 1, p: 'pushdown' }, () => M.pushdown(),
  ['Attach a straight bar to a high pulley.', 'Stand tall, elbows pinned at your sides.', 'Push the bar down until your arms are straight.', 'Let it rise to about 90°.'],
  ['Only the forearms move', 'Squeeze at the bottom'], ['Leaning over the bar and using bodyweight']);
X('rope-pushdown', 'Rope pushdown', ['cable'], ['triceps-lateral'], ['triceps-long'], { l: 1, p: 'pushdown' }, () => M.pushdown({ rope: true }),
  ['Attach a rope to a high pulley.', 'Push down and spread the rope ends apart at the bottom.', 'Return to 90° slowly.'],
  ['Split the rope past your thighs'], ['Elbows flaring out']);
X('oh-cable-ext', 'Overhead cable extension', ['cable'], ['triceps-long'], ['triceps-lateral'], { l: 2, p: 'ohext' }, () => M.ohExt({ imp: 'cable' }),
  ['Face away from the pulley holding a rope behind your head.', 'Stagger your stance and lean forward slightly.', 'Extend your arms forward and up until straight.', 'Bend back slowly behind your head.'],
  ['Elbows point forward and stay still', 'Big stretch at the bottom'], ['Elbows flaring wide']);
X('oh-db-ext', 'Overhead dumbbell extension', ['dumbbells'], ['triceps-long'], ['triceps-lateral'], { l: 1, p: 'ohext' }, () => M.ohExt(),
  ['Hold one dumbbell overhead with both hands under the top plate.', 'Lower it behind your head by bending the elbows.', 'Extend back to straight arms.'],
  ['Keep elbows close to your head', 'Brace so your back doesn’t arch'], ['Going too heavy for control behind the head']);
X('skull-crusher', 'Skull crusher', [['ezbar', 'barbell'], 'bench'], ['triceps-long', 'triceps-lateral'], [], { l: 2, p: 'skull' }, () => M.skull(),
  ['Lie on a bench holding an EZ bar over your shoulders.', 'Angle your upper arms slightly back toward your head.', 'Bend your elbows to lower the bar toward your forehead.', 'Extend back up.'],
  ['Upper arms stay fixed', 'Slight backward angle keeps tension'], ['Flaring the elbows', 'Dropping it fast — it’s near your face']);
X('db-kickback', 'Dumbbell kickback', ['dumbbells'], ['triceps-lateral'], ['triceps-long'], { l: 1, p: 'kickback' }, () => M.kickback(),
  ['Hinge forward and pin your upper arms alongside your torso.', 'Start with elbows bent 90°.', 'Straighten your arms back until locked.', 'Return to 90°.'],
  ['Pause at lockout', 'Upper arm parallel to the floor'], ['Swinging the upper arm']);
X('bench-dip', 'Bench dip', [['bench', 'box']], ['triceps-lateral'], ['front-delts', 'lower-chest'], { l: 1, c: 1, p: 'dip-b' }, () => M.benchDip(),
  ['Sit on the edge of a bench, hands beside your hips.', 'Slide your hips off and walk your feet forward.', 'Lower until your elbows are at 90°.', 'Press back up.'],
  ['Hips close to the bench', 'Bend knees to make it easier'], ['Going too deep and straining the shoulders']);
X('tri-dip', 'Triceps dip', ['dipbars'], ['triceps-lateral', 'triceps-long'], ['lower-chest', 'front-delts'], { l: 2, c: 1, p: 'dip' }, () => M.dip(),
  ['Support yourself on the bars, arms straight.', 'Stay upright with elbows pointing back.', 'Lower until your upper arms are about level.', 'Press back to lockout.'],
  ['Upright torso = more triceps'], ['Shrugging at the bottom']);
X('diamond-pushup', 'Diamond push-up', [], ['triceps-lateral'], ['mid-chest', 'front-delts'], { l: 2, c: 1, p: 'hpress-cg' }, () => M.pushup({ v: 'diamond' }),
  ['Get into a push-up with hands together under your chest.', 'Lower your chest to your hands, elbows back.', 'Press back up.'],
  ['Do them on your knees to start'], ['Elbows flaring out']);
X('band-pushdown', 'Band pushdown', ['bands'], ['triceps-lateral'], [], { l: 1, p: 'pushdown' }, () => M.pushdown({ band: true }),
  ['Anchor a band high, like over a door.', 'Pin your elbows and push down to straight arms.', 'Return slowly.'],
  ['Squeeze at the bottom'], ['Letting elbows move']);
/* ---- Forearms ---- */
X('wrist-curl', 'Wrist curl', ['dumbbells', ['bench', 'box']], ['forearm-flexors'], [], { l: 1, p: 'wrist' }, () => M.wristCurl(),
  ['Sit and rest your forearms on your thighs, palms up, wrists past your knees.', 'Let the dumbbells roll toward your fingers.', 'Curl your wrists up as high as you can.', 'Lower slowly.'],
  ['High reps work well', 'Forearms stay on your thighs'], ['Lifting the forearms']);
X('rev-wrist-curl', 'Reverse wrist curl', ['dumbbells', ['bench', 'box']], ['forearm-extensors'], [], { l: 1, p: 'wrist' }, () => M.wristCurl({ rev: true }),
  ['Rest your forearms on your thighs, palms down.', 'Lift the back of your hands toward the ceiling.', 'Lower slowly.'],
  ['Light weight, slow reps'], ['Bouncing']);
X('farmer-carry', 'Farmer’s carry', [['dumbbells', 'kettlebell', 'trapbar']], ['forearm-flexors', 'traps'], ['deep-core', 'glute-med'], { l: 1, c: 1, p: 'carry', u: 'steps' }, () => M.farmer(),
  ['Pick up heavy weights in each hand.', 'Stand tall, shoulders back and down.', 'Walk with short, controlled steps.', 'Set them down with a flat back.'],
  ['Grip hard', 'Don’t let the weights swing'], ['Leaning to one side', 'Shrugging the shoulders']);
X('dead-hang', 'Dead hang', ['pullupbar'], ['forearm-flexors'], ['lats', 'rotator-cuff'], { l: 1, p: 'hang', u: 'sec' }, () => M.deadHang(),
  ['Grab the bar shoulder width and hang with straight arms.', 'Keep shoulders slightly engaged, not fully relaxed.', 'Hold as long as you can with good grip.'],
  ['Great for grip and shoulder health'], ['Swinging around']);
/* ---- Core ---- */
X('crunch', 'Crunch', [], ['upper-abs'], [], { l: 1, p: 'crunch' }, () => M.crunch(),
  ['Lie on your back with knees bent and feet flat.', 'Place fingertips beside your head.', 'Curl your shoulders off the floor by bringing ribs toward hips.', 'Lower slowly.'],
  ['Exhale as you crunch', 'Small range, big squeeze'], ['Pulling on your neck']);
X('cable-crunch', 'Kneeling cable crunch', ['cable'], ['upper-abs'], ['obliques'], { l: 1, p: 'crunch-w' }, () => M.cableCrunch(),
  ['Kneel facing a high pulley holding the rope beside your head.', 'Keep your hips still.', 'Crunch your elbows toward your thighs by rounding your spine.', 'Rise slowly.'],
  ['Round the spine — don’t just hinge at the hips', 'Load it heavy like other muscles'], ['Sitting back onto the heels']);
X('ab-machine', 'Ab crunch machine', ['abmachine'], ['upper-abs'], ['obliques'], { l: 1, p: 'crunch-w' }, () => M.cableCrunch({ machine: true }),
  ['Set the seat and hold the handles or pads.', 'Crunch your chest toward your knees.', 'Return slowly.'],
  ['Exhale hard at the bottom'], ['Using the arms to pull']);
X('decline-situp', 'Decline sit-up', ['adjbench'], ['upper-abs'], ['hip-flexors'], { l: 2, p: 'situp' }, () => M.declineSitup(),
  ['Hook your feet into a decline bench and lie back.', 'Cross your arms over your chest.', 'Curl up until your torso is upright.', 'Lower slowly.'],
  ['Curl, don’t yank', 'Hold a plate to add load'], ['Swinging up with momentum']);
X('hanging-leg-raise', 'Hanging leg raise', ['pullupbar'], ['lower-abs', 'hip-flexors'], ['forearm-flexors'], { l: 3, p: 'legraise' }, () => M.legRaise(),
  ['Hang from a bar with straight arms.', 'Keep legs straight and raise them to hip height or higher.', 'Curl your pelvis up at the top.', 'Lower without swinging.'],
  ['Slow down to kill the swing'], ['Using momentum']);
X('hanging-knee-raise', 'Hanging knee raise', ['pullupbar'], ['lower-abs'], ['hip-flexors'], { l: 2, p: 'legraise' }, () => M.legRaise({ knees: true }),
  ['Hang from a bar.', 'Bring your knees up toward your chest.', 'Tilt your pelvis up at the top.', 'Lower slowly.'],
  ['Easier version of the leg raise'], ['Swinging']);
X('captains-chair', 'Captain’s chair knee raise', ['dipbars'], ['lower-abs'], ['hip-flexors'], { l: 1, p: 'legraise' }, () => M.legRaise({ chair: true }),
  ['Support yourself on the forearm pads, back against the pad.', 'Raise your knees toward your chest.', 'Lower slowly.'],
  ['Back stays on the pad', 'Curl the pelvis at the top'], ['Kicking the legs up']);
X('lying-leg-raise', 'Lying leg raise', [], ['lower-abs'], ['hip-flexors'], { l: 1, p: 'legraise-bw' }, () => M.legRaise({ lying: true }),
  ['Lie on your back with hands under your hips.', 'Raise straight legs to vertical.', 'Lower slowly without letting your back arch.'],
  ['Low back stays pressed down', 'Bend knees slightly to make it easier'], ['Dropping the legs fast']);
X('reverse-crunch', 'Reverse crunch', [], ['lower-abs'], [], { l: 1, p: 'rcrunch' }, () => M.crunch({ reverse: true }),
  ['Lie on your back with hips and knees bent 90°.', 'Curl your hips off the floor toward your chest.', 'Lower slowly.'],
  ['Small movement, focus on the pelvis'], ['Swinging the legs']);
X('dead-bug', 'Dead bug', [], ['deep-core'], ['lower-abs'], { l: 1, p: 'antiext' }, () => M.deadBug(),
  ['Lie on your back, arms up, knees bent 90° over your hips.', 'Press your lower back into the floor.', 'Extend one arm overhead and the opposite leg out.', 'Return and switch sides.'],
  ['Move slowly', 'Breathe out as you extend'], ['Low back lifting off the floor']);
X('plank', 'Forearm plank', [], ['deep-core'], ['upper-abs', 'front-delts', 'glute-max'], { l: 1, p: 'plank', u: 'sec' }, () => M.plank(),
  ['Rest on your forearms with elbows under your shoulders.', 'Lift your hips into a straight line from head to heels.', 'Squeeze glutes and brace your abs.', 'Hold.'],
  ['Pull elbows toward toes to make it harder', 'Breathe steadily'], ['Hips sagging or piking']);
X('side-plank', 'Side plank', [], ['obliques'], ['glute-med', 'deep-core'], { l: 1, p: 'sideplank', u: 'sec', uni: 1 }, () => M.plank({ side: true }),
  ['Lie on your side with your elbow under your shoulder.', 'Stack your feet and lift your hips.', 'Hold a straight line from head to feet.'],
  ['Drop the bottom knee to make it easier'], ['Hips sagging toward the floor']);
X('russian-twist', 'Russian twist', [], ['obliques'], ['upper-abs'], { l: 1, p: 'rotation' }, () => M.russian(),
  ['Sit with knees bent and lean back to about 45°.', 'Hold a med ball or plate at your chest (optional).', 'Rotate your torso side to side.'],
  ['Turn your shoulders, not just your arms', 'Lift feet to make it harder'], ['Rounding the back']);
X('bicycle', 'Bicycle crunch', [], ['obliques', 'upper-abs'], ['hip-flexors'], { l: 1, p: 'rotation-c' }, () => M.crunch({ bicycle: true }),
  ['Lie on your back, hands by your head, legs raised.', 'Bring one elbow toward the opposite knee while extending the other leg.', 'Switch sides in a pedaling motion.'],
  ['Slow and controlled beats fast'], ['Pulling your head forward']);
X('woodchop', 'Cable woodchop', ['cable'], ['obliques'], ['deep-core'], { l: 1, p: 'rotation' }, () => M.woodchop(),
  ['Set a handle on a high pulley and stand side-on with feet wide.', 'Grab it with both hands above your shoulder.', 'Pull it down and across your body to the opposite hip.', 'Return under control.'],
  ['Pivot the back foot', 'Arms stay fairly straight'], ['Bending the arms to pull']);
X('pallof', 'Pallof press', [['cable', 'bands']], ['deep-core', 'obliques'], [], { l: 1, p: 'antirot' }, () => M.pallof(),
  ['Stand side-on to a cable or band at chest height.', 'Hold the handle at your sternum.', 'Press straight out and hold — don’t let it pull you round.', 'Bring it back to your chest.'],
  ['The goal is to not move', 'Step further away to make it harder'], ['Rotating toward the anchor']);
X('ab-rollout', 'Ab wheel rollout', ['abwheel'], ['deep-core', 'upper-abs'], ['lats'], { l: 2, p: 'antiext-w' }, () => M.rollout(),
  ['Kneel with the wheel under your shoulders.', 'Brace hard and roll forward slowly.', 'Go as far as you can without your back sagging.', 'Pull back with your abs.'],
  ['Tuck your pelvis', 'Start with short rollouts'], ['Letting the low back arch']);
X('mountain-climber', 'Mountain climber', [], ['lower-abs', 'hip-flexors'], ['deep-core', 'front-delts'], { l: 1, p: 'climber' }, () => M.mountain(),
  ['Start in a high plank.', 'Drive one knee toward your chest.', 'Switch legs quickly, like running.'],
  ['Hips level with shoulders'], ['Bouncing the hips up']);
X('hollow-hold', 'Hollow body hold', [], ['deep-core'], ['lower-abs'], { l: 2, p: 'antiext', u: 'sec' }, () => M.hollow(),
  ['Lie on your back and press your lower back into the floor.', 'Lift your shoulders, arms and legs off the floor.', 'Hold a banana shape.'],
  ['Bend the knees to make it easier'], ['Low back lifting']);
X('db-side-bend', 'Dumbbell side bend', ['dumbbells'], ['obliques'], [], { l: 1, p: 'sidebend', uni: 1 }, () => M.sideBend(),
  ['Stand with one dumbbell at your side.', 'Lean toward the weight, sliding it down your leg.', 'Pull back up using the opposite side of your waist.'],
  ['Move only side to side'], ['Twisting or leaning forward']);
X('landmine-rotation', 'Landmine rotation', ['barbell', 'landmine'], ['obliques'], ['deep-core', 'front-delts'], { l: 2, p: 'rotation' }, () => M.landmineRot(),
  ['Hold the end of a landmine bar at arm’s length with both hands.', 'Rotate it in an arc from one hip to the other.', 'Keep arms straight and core braced.'],
  ['Pivot your feet with the bar'], ['Bending the arms']);
X('ball-slam', 'Medicine ball slam', ['medball'], ['upper-abs', 'lats'], ['deep-core'], { l: 1, c: 1, p: 'slam' }, () => M.slam(),
  ['Hold a slam ball overhead.', 'Slam it into the floor as hard as you can, hinging at the hips.', 'Pick it up and repeat.'],
  ['Use a non-bouncing slam ball', 'Full-body power'], ['Rounding your back to pick it up']);
X('pushup-plus', 'Push-up plus', [], ['serratus'], ['deep-core'], { l: 1, p: 'serratus' }, () => M.pushupPlus(),
  ['Get into a high plank.', 'Without bending your elbows, let your chest sink between your shoulder blades.', 'Push the floor away to spread your shoulder blades apart.'],
  ['Small movement — arms stay straight'], ['Bending the elbows']);
X('serratus-punch', 'Lying dumbbell punch', ['dumbbells', 'bench'], ['serratus'], [], { l: 1, p: 'serratus' }, () => M.serratusPunch(),
  ['Lie on a bench holding dumbbells straight above your chest.', 'Punch them toward the ceiling, lifting your shoulder blades off the bench.', 'Let them settle back.'],
  ['Arms stay straight'], ['Bending the elbows']);
X('susp-knee-tuck', 'Suspension knee tuck', ['suspension'], ['lower-abs', 'deep-core'], ['hip-flexors'], { l: 2, p: 'climber' }, () => M.suspTuck(),
  ['Put your feet in the straps and get into a high plank.', 'Pull your knees in toward your chest.', 'Extend back to a plank.'],
  ['Keep hips level'], ['Letting the hips sag']);
X('bird-dog', 'Bird dog', [], ['deep-core', 'lower-back'], ['glute-max'], { l: 1, p: 'antirot-bw' }, () => M.birdDog(),
  ['Kneel on all fours, hands under shoulders, knees under hips.', 'Reach one arm forward and the opposite leg back.', 'Hold for a second, then switch.'],
  ['Imagine a glass of water on your low back'], ['Twisting the hips open']);
/* ---- Glutes ---- */
X('hip-thrust', 'Barbell hip thrust', ['barbell', 'bench'], ['glute-max'], ['hamstrings'], { l: 2, c: 1, p: 'thrust' }, () => M.hipThrust(),
  ['Sit with your upper back on a bench and a padded bar over your hips.', 'Feet flat, shins vertical at the top.', 'Drive your hips up until your body is level from shoulders to knees.', 'Squeeze, then lower.'],
  ['Chin tucked, ribs down', 'Push through your heels'], ['Arching the low back at the top', 'Feet too far out']);
X('glute-bridge', 'Glute bridge', [], ['glute-max'], ['hamstrings'], { l: 1, p: 'thrust' }, () => M.hipThrust({ floor: true, imp: 'bw' }),
  ['Lie on your back, knees bent, feet flat.', 'Drive through your heels to lift your hips.', 'Squeeze at the top, then lower.'],
  ['Add a dumbbell on your hips to progress'], ['Pushing through your toes']);
X('sl-bridge', 'Single-leg glute bridge', [], ['glute-max'], ['glute-med', 'hamstrings'], { l: 1, p: 'thrust-u', uni: 1 }, () => M.hipThrust({ floor: true, single: true, imp: 'bw' }),
  ['Lie on your back with one foot flat and the other leg raised.', 'Drive through the planted heel to lift your hips.', 'Keep hips level, then lower.'],
  ['Hips stay level'], ['Hips tilting to one side']);
X('db-hip-thrust', 'Dumbbell hip thrust', ['dumbbells', 'bench'], ['glute-max'], ['hamstrings'], { l: 1, c: 1, p: 'thrust' }, () => M.hipThrust({ imp: 'db' }),
  ['Upper back on a bench, a dumbbell held on your hips.', 'Drive hips up to level.', 'Lower slowly.'],
  ['Pause and squeeze at the top'], ['Overarching']);
X('cable-kickback', 'Cable glute kickback', ['cable'], ['glute-max'], ['hamstrings'], { l: 1, p: 'kickback-g', uni: 1 }, () => M.gluteKick(),
  ['Strap a cuff to your ankle and face the low pulley.', 'Hold the frame and hinge slightly.', 'Kick your leg back, squeezing your glute.', 'Return slowly.'],
  ['Stop before your back arches'], ['Swinging the leg']);
X('donkey-kick', 'Donkey kick', [], ['glute-max'], [], { l: 1, p: 'kickback-g', uni: 1 }, () => M.gluteKick({ quad: true }),
  ['Get on all fours.', 'Keeping the knee bent, press one heel toward the ceiling.', 'Lower and repeat.'],
  ['Squeeze the glute at the top'], ['Arching the low back']);
X('clamshell', 'Clamshell', [], ['glute-med'], [], { l: 1, p: 'abd-bw', uni: 1 }, () => M.clamshell(),
  ['Lie on your side with knees bent and feet together.', 'Keep your feet touching and lift your top knee.', 'Lower slowly.'],
  ['Add a band above the knees', 'Don’t roll your hips back'], ['Rolling the pelvis open']);
X('side-leg-raise', 'Side-lying leg raise', [], ['glute-med'], [], { l: 1, p: 'abd-bw', uni: 1 }, () => M.sideLegRaise(),
  ['Lie on your side with legs straight.', 'Lift your top leg up, toes pointing forward.', 'Lower slowly.'],
  ['Lead with the heel'], ['Rolling backward']);
X('fire-hydrant', 'Fire hydrant', [], ['glute-med'], ['glute-max'], { l: 1, p: 'abd-bw', uni: 1 }, () => M.fireHydrant(),
  ['Get on all fours.', 'Keeping the knee bent, lift your leg out to the side.', 'Lower slowly.'],
  ['Keep hips square'], ['Leaning away']);
X('lateral-walk', 'Banded lateral walk', ['bands'], ['glute-med'], ['glute-max'], { l: 1, p: 'abd-walk', u: 'steps' }, () => M.lateralWalk(),
  ['Loop a band around your ankles or knees.', 'Sit into a quarter squat.', 'Step sideways, keeping tension in the band.', 'Walk back the other way.'],
  ['Toes point forward', 'Stay low'], ['Letting the feet come together']);
X('hip-abduction', 'Hip abduction machine', ['hipabd'], ['glute-med'], [], { l: 1, p: 'abd' }, () => M.hipMachine(),
  ['Sit with the pads on the outside of your knees.', 'Push your knees apart.', 'Return slowly.'],
  ['Lean forward slightly for more glute'], ['Letting the plates slam']);
X('cable-abduction', 'Cable hip abduction', ['cable'], ['glute-med'], [], { l: 1, p: 'abd', uni: 1 }, () => M.cableHip(),
  ['Attach the cuff to your far ankle and stand side-on to a low pulley.', 'Sweep your leg out to the side.', 'Return slowly.'],
  ['Stay tall'], ['Leaning away to lift higher']);
X('kb-swing', 'Kettlebell swing', ['kettlebell'], ['glute-max', 'hamstrings'], ['lower-back', 'deep-core'], { l: 2, c: 1, p: 'swing' }, () => M.kbSwing(),
  ['Stand with feet wider than hips, bell in front.', 'Hike the bell back between your legs.', 'Snap your hips forward to float it to chest height.', 'Let it fall and hinge again.'],
  ['It’s a hinge, not a squat', 'Arms are just ropes'], ['Lifting with your arms', 'Squatting the bell']);
X('pull-through', 'Cable pull-through', ['cable'], ['glute-max', 'hamstrings'], [], { l: 1, c: 1, p: 'swing' }, () => M.kbSwing({ cable: true }),
  ['Face away from a low pulley holding a rope between your legs.', 'Hinge back, letting the rope pull through.', 'Drive your hips forward to stand tall.'],
  ['Squeeze glutes hard at the top'], ['Pulling with the arms']);
X('bulgarian', 'Bulgarian split squat', ['dumbbells', ['bench', 'box']], ['quads', 'glute-max'], ['adductors'], { l: 2, c: 1, p: 'lunge-s', uni: 1 }, () => M.lunge({ type: 'bulgarian' }),
  ['Stand in front of a bench and rest the top of your back foot on it.', 'Hold dumbbells at your sides.', 'Lower your back knee toward the floor.', 'Drive through your front heel to stand.'],
  ['Lean forward slightly for more glutes', 'Front knee tracks over toes'], ['Front foot too close to the bench']);
X('sumo-deadlift', 'Sumo deadlift', ['barbell'], ['glute-max', 'adductors', 'quads'], ['hamstrings', 'lower-back'], { l: 3, c: 1, p: 'hinge-dl' }, () => M.deadlift({ sumo: true }),
  ['Take a wide stance with toes turned out.', 'Grip the bar inside your knees.', 'Push your knees out and lift your chest.', 'Push the floor apart and stand.'],
  ['Knees track over toes', 'More upright torso than conventional'], ['Hips shooting up first']);
X('step-up', 'Dumbbell step-up', ['dumbbells', ['box', 'bench']], ['glute-max', 'quads'], [], { l: 1, c: 1, p: 'stepup', uni: 1 }, () => M.stepUp(),
  ['Stand facing a box with dumbbells at your sides.', 'Place one foot fully on the box.', 'Drive through that foot to stand on top.', 'Step down slowly.'],
  ['Don’t push off the back foot'], ['Box too high']);
/* ---- Thighs ---- */
X('back-squat', 'Barbell back squat', ['barbell', 'rack'], ['quads', 'glute-max'], ['adductors', 'lower-back'], { l: 2, c: 1, p: 'squat' }, () => M.squat(),
  ['Set the bar on your upper back and unrack.', 'Feet shoulder width, toes slightly out.', 'Brace, then sit down and back until thighs are at least parallel.', 'Drive up through your whole foot.'],
  ['Knees track over toes', 'Chest up, big breath before each rep'], ['Knees caving in', 'Heels lifting']);
X('front-squat', 'Front squat', ['barbell', 'rack'], ['quads'], ['glute-max', 'upper-back', 'deep-core'], { l: 3, c: 1, p: 'squat' }, () => M.squat({ front: true }),
  ['Rest the bar on your front delts with elbows high.', 'Squat straight down with an upright torso.', 'Drive up, keeping elbows up.'],
  ['Elbows high the whole time'], ['Elbows dropping so the bar rolls forward']);
X('goblet-squat', 'Goblet squat', [['dumbbells', 'kettlebell']], ['quads'], ['glute-max', 'deep-core'], { l: 1, c: 1, p: 'squat' }, () => M.squat({ goblet: true }),
  ['Hold a dumbbell vertically at your chest.', 'Squat down between your knees.', 'Drive back up.'],
  ['Elbows inside your knees at the bottom', 'Great for learning the squat'], ['Rounding forward']);
X('smith-squat', 'Smith machine squat', ['smith'], ['quads'], ['glute-max'], { l: 1, c: 1, p: 'squat' }, () => M.squat({ smith: true }),
  ['Set the bar on your upper back with feet slightly forward.', 'Unhook and squat down.', 'Drive up.'],
  ['Feet forward lets you sit back'], ['Feet directly under the bar']);
X('air-squat', 'Bodyweight squat', [], ['quads'], ['glute-max'], { l: 1, c: 1, p: 'squat-bw' }, () => M.squat({ bw: true }),
  ['Stand with feet shoulder width.', 'Reach your arms forward as you sit down and back.', 'Stand back up.'],
  ['Slow 3-second descent makes it harder'], ['Heels coming up']);
X('jump-squat', 'Jump squat', [], ['quads', 'glute-max'], ['gastrocnemius'], { l: 2, c: 1, p: 'jump' }, () => M.squat({ jump: true }),
  ['Squat down to a quarter or half depth.', 'Explode up and jump.', 'Land softly and go straight into the next rep.'],
  ['Land quietly'], ['Stiff-legged landings']);
X('leg-press', 'Leg press', ['legpress'], ['quads'], ['glute-max', 'adductors'], { l: 1, c: 1, p: 'squat-m' }, () => M.legPress(),
  ['Sit with your back flat on the pad and feet shoulder width on the platform.', 'Release the safeties.', 'Lower until your knees reach about 90°.', 'Press back up without locking your knees.'],
  ['Feet higher = more glutes, lower = more quads'], ['Lower back peeling off the pad']);
X('hack-squat', 'Hack squat', ['hacksquat'], ['quads'], ['glute-max'], { l: 1, c: 1, p: 'squat-m' }, () => M.hackSquat(),
  ['Stand on the platform with your back on the pad, shoulders under the pads.', 'Release the safeties and squat deep.', 'Drive back up.'],
  ['Great quad builder'], ['Heels rising']);
X('leg-ext', 'Leg extension', ['legext'], ['quads'], [], { l: 1, p: 'legext' }, () => M.legExt(),
  ['Sit with the pad on your lower shins and knees lined up with the pivot.', 'Straighten your legs.', 'Squeeze, then lower slowly.'],
  ['Pause at the top'], ['Kicking the weight up']);
X('walking-lunge', 'Dumbbell walking lunge', ['dumbbells'], ['quads', 'glute-max'], ['adductors'], { l: 2, c: 1, p: 'lunge', uni: 1 }, () => M.lunge(),
  ['Hold dumbbells at your sides.', 'Step forward and lower your back knee toward the floor.', 'Drive through the front foot and step into the next lunge.'],
  ['Long steps for glutes, shorter for quads'], ['Front knee caving in']);
X('reverse-lunge', 'Reverse lunge', [], ['quads', 'glute-max'], [], { l: 1, c: 1, p: 'lunge', uni: 1 }, () => M.lunge({ type: 'rev', imp: 'bw' }),
  ['Stand tall.', 'Step one foot back and lower your back knee.', 'Drive through the front foot to return.'],
  ['Easier on the knees than forward lunges'], ['Short steps']);
X('split-squat', 'Split squat', [], ['quads'], ['glute-max'], { l: 1, c: 1, p: 'lunge-s', uni: 1 }, () => M.lunge({ type: 'split', imp: 'bw' }),
  ['Stand in a long split stance.', 'Lower your back knee straight down.', 'Push back up.'],
  ['Hold dumbbells to progress'], ['Wobbling — widen your stance']);
X('wall-sit', 'Wall sit', [], ['quads'], [], { l: 1, p: 'iso-q', u: 'sec' }, () => M.wallSit(),
  ['Lean your back against a wall.', 'Slide down until your thighs are level.', 'Hold.'],
  ['Knees over ankles'], ['Hands pushing on the thighs']);
X('trap-deadlift', 'Trap bar deadlift', ['trapbar'], ['quads', 'glute-max'], ['hamstrings', 'traps'], { l: 2, c: 1, p: 'hinge-dl' }, () => M.deadlift({ imp: 'trap' }),
  ['Stand inside the trap bar.', 'Sit down and grip the handles.', 'Lift your chest, then stand up tall.'],
  ['More knee bend than a regular deadlift'], ['Rounding the back']);
X('cossack', 'Cossack squat', [], ['adductors'], ['quads', 'glute-max'], { l: 2, c: 1, p: 'lat-squat' }, () => M.cossack(),
  ['Take a very wide stance.', 'Shift your weight to one side and squat down on that leg.', 'Keep the other leg straight, toes up.', 'Push back to centre and switch.'],
  ['Hold a weight in front to balance'], ['Heel lifting on the bent leg']);
X('sumo-goblet', 'Sumo goblet squat', [['dumbbells', 'kettlebell']], ['adductors', 'glute-max'], ['quads'], { l: 1, c: 1, p: 'squat-s' }, () => M.squat({ sumo: true }),
  ['Take a wide stance with toes out.', 'Hold a dumbbell hanging between your legs.', 'Squat down, pushing knees out.', 'Stand back up.'],
  ['Knees follow toes'], ['Knees caving in']);
X('hip-adduction', 'Hip adduction machine', ['hipabd'], ['adductors'], [], { l: 1, p: 'add' }, () => M.hipMachine({ abd: false }),
  ['Sit with the pads on the inside of your knees.', 'Squeeze your knees together.', 'Open slowly.'],
  ['Control the opening'], ['Bouncing']);
X('cable-adduction', 'Cable hip adduction', ['cable'], ['adductors'], [], { l: 1, p: 'add', uni: 1 }, () => M.cableHip({ abd: false }),
  ['Attach the cuff to your near ankle and stand side-on to a low pulley.', 'Sweep the leg across your body.', 'Return slowly.'],
  ['Stand tall'], ['Twisting']);
X('rdl', 'Romanian deadlift', ['barbell'], ['hamstrings'], ['glute-max', 'lower-back'], { l: 2, c: 1, p: 'hinge' }, () => M.deadlift({ rdl: true }),
  ['Hold the bar at your thighs with soft knees.', 'Push your hips back and slide the bar down your legs.', 'Stop when you feel a strong hamstring stretch.', 'Drive your hips forward to stand.'],
  ['Bar stays close to your legs', 'Knees barely bend'], ['Rounding the back', 'Turning it into a squat']);
X('db-rdl', 'Dumbbell Romanian deadlift', ['dumbbells'], ['hamstrings'], ['glute-max', 'lower-back'], { l: 1, c: 1, p: 'hinge' }, () => M.deadlift({ rdl: true, imp: 'db' }),
  ['Hold dumbbells in front of your thighs.', 'Hinge back, sliding them down your legs.', 'Stand back up by driving the hips forward.'],
  ['Feel the stretch, then reverse'], ['Reaching with the arms']);
X('sl-rdl', 'Single-leg Romanian deadlift', [['dumbbells', 'kettlebell']], ['hamstrings', 'glute-max'], ['glute-med'], { l: 2, c: 1, p: 'hinge-u', uni: 1 }, () => M.deadlift({ single: true }),
  ['Stand on one leg holding a weight in the opposite hand.', 'Hinge forward as your free leg rises behind you.', 'Return to standing.'],
  ['Hips stay square to the floor', 'Hold a wall for balance'], ['Opening the hip up']);
X('lying-leg-curl', 'Lying leg curl', ['legcurl'], ['hamstrings'], ['gastrocnemius'], { l: 1, p: 'legcurl' }, () => M.legCurl(),
  ['Lie face down with the pad just above your heels.', 'Curl your heels toward your glutes.', 'Lower slowly.'],
  ['Hips stay pressed into the pad'], ['Lifting the hips']);
X('seated-leg-curl', 'Seated leg curl', ['legcurl'], ['hamstrings'], [], { l: 1, p: 'legcurl' }, () => M.legCurl({ seat: true }),
  ['Sit with the pad behind your lower calves and the thigh pad locked down.', 'Curl your heels under you.', 'Return slowly.'],
  ['Lean forward slightly for a bigger stretch'], ['Rushing the return']);
X('nordic', 'Nordic hamstring curl', [], ['hamstrings'], [], { l: 3, p: 'nordic' }, () => M.nordic(),
  ['Kneel with your ankles anchored under something sturdy.', 'Keep a straight line from knees to head.', 'Lower yourself forward as slowly as possible.', 'Catch yourself with your hands and push back up.'],
  ['Even partial reps are hard work'], ['Bending at the hips']);
X('ball-leg-curl', 'Stability ball leg curl', ['ball'], ['hamstrings'], ['glute-max'], { l: 2, p: 'legcurl-bw' }, () => M.legCurl({ ball: true }),
  ['Lie on your back with heels on the ball.', 'Lift your hips up.', 'Curl the ball toward you, keeping hips high.', 'Roll it back out.'],
  ['Hips stay up the whole set'], ['Hips dropping as you curl']);
X('slider-leg-curl', 'Slider leg curl', ['sliders'], ['hamstrings'], ['glute-max'], { l: 2, p: 'legcurl-bw' }, () => M.legCurl({ sliders: true }),
  ['Lie on your back with heels on sliders or a towel.', 'Lift your hips.', 'Slide your heels in toward your glutes.', 'Slide back out slowly.'],
  ['The slow slide out is the hard part'], ['Letting hips touch down']);
X('knee-drive', 'Cable knee drive', ['cable'], ['hip-flexors'], ['lower-abs'], { l: 1, p: 'hipflex', uni: 1 }, () => M.kneeDrive(),
  ['Attach the cuff to your ankle and face away from the low pulley.', 'Hold something for balance.', 'Drive your knee up to hip height.', 'Lower slowly.'],
  ['Stay tall'], ['Leaning back']);
/* ---- Lower legs ---- */
X('standing-calf', 'Standing calf raise', ['calfstand'], ['gastrocnemius'], ['soleus'], { l: 1, p: 'calf' }, () => M.calfRaise({ machine: true }),
  ['Stand with shoulders under the pads and the balls of your feet on the edge.', 'Lower your heels for a deep stretch.', 'Rise as high as you can.', 'Pause and lower slowly.'],
  ['Pause at the bottom too', 'Knees straight'], ['Bouncing']);
X('seated-calf', 'Seated calf raise', ['calfseat'], ['soleus'], ['gastrocnemius'], { l: 1, p: 'calf-s' }, () => M.calfRaise({ seat: true }),
  ['Sit with the pad on your lower thighs and balls of feet on the platform.', 'Lower your heels.', 'Raise as high as possible.'],
  ['Bent knees target the soleus'], ['Short reps']);
X('sl-calf', 'Single-leg calf raise', ['dumbbells'], ['gastrocnemius'], ['soleus'], { l: 1, p: 'calf', uni: 1 }, () => M.calfRaise({ step: true, single: true }),
  ['Stand on one foot on a step, holding a dumbbell on the same side.', 'Lower your heel below the step.', 'Rise up on your toes.'],
  ['Hold a wall for balance'], ['Bending the knee to help']);
X('bw-calf', 'Bodyweight calf raise', [], ['gastrocnemius'], ['soleus'], { l: 1, p: 'calf' }, () => M.calfRaise(),
  ['Stand with feet hip width.', 'Rise onto the balls of your feet.', 'Lower slowly.'],
  ['Do them on a step for more range'], ['Rushing']);
X('smith-calf', 'Smith machine calf raise', ['smith'], ['gastrocnemius'], ['soleus'], { l: 1, p: 'calf' }, () => M.calfRaise({ smith: true, step: true }),
  ['Set the bar on your back and stand on a plate or step.', 'Lower heels, then rise high.'],
  ['Slow and full range'], ['Bouncing']);
X('leg-press-calf', 'Leg press calf press', ['legpress'], ['gastrocnemius'], ['soleus'], { l: 1, p: 'calf' }, () => M.calfRaise({ press: true }),
  ['Sit in the leg press with the balls of your feet on the bottom edge.', 'Keep knees nearly straight.', 'Push through your toes, then let your heels come back.'],
  ['Keep the safeties close'], ['Bending the knees']);
X('tib-raise', 'Tibialis raise', [], ['tibialis'], [], { l: 1, p: 'tib' }, () => M.tibRaise(),
  ['Lean your back against a wall with heels about a foot out.', 'Pull your toes up as high as you can.', 'Lower slowly.'],
  ['Feet further out = harder'], ['Letting toes slap down']);

/* ---- Added exercises ---- */
X('smith-bench', 'Smith machine bench press', ['smith', 'bench'], ['mid-chest'], ['front-delts', 'triceps-lateral'], { l: 1, c: 1, p: 'hpress' }, () => M.bench({ imp: 'smith' }),
  ['Set a flat bench under the bar so it lines up with your mid-chest.', 'Grip just wider than shoulders and unhook the bar.', 'Lower under control to your chest.', 'Press up to straight arms.'],
  ['Shoulder blades pinned back', 'Feet planted'], ['Bench in the wrong spot so the bar hits your neck', 'Bouncing off the chest']);
X('db-squeeze-press', 'Dumbbell squeeze press', ['dumbbells', 'bench'], ['mid-chest'], ['triceps-lateral', 'upper-chest'], { l: 1, p: 'hpress' }, () => M.bench({ imp: 'db', squeeze: true }),
  ['Lie on a flat bench holding two dumbbells pressed together over your chest, palms facing.', 'Squeeze them hard into each other the whole set.', 'Lower to your chest keeping them touching.', 'Press back up.'],
  ['Keep squeezing — that is the point', 'Elbows close to your sides'], ['Letting the dumbbells drift apart']);
X('knee-pushup', 'Kneeling push-up', [], ['mid-chest'], ['triceps-lateral', 'front-delts'], { l: 1, c: 1, p: 'hpress-bw' }, () => M.kneePushup(),
  ['Start on your knees with hands just wider than shoulders.', 'Keep a straight line from knees to head.', 'Lower your chest to the floor.', 'Push back up.'],
  ['Great way to build up to full push-ups', 'Squeeze glutes so hips stay in line'], ['Hips piking up', 'Head dropping first']);
X('cable-press', 'Standing cable chest press', ['crossover'], ['mid-chest'], ['front-delts', 'triceps-lateral', 'deep-core'], { l: 1, p: 'hpress' }, () => M.bandPress({ cable: true }),
  ['Set both pulleys at chest height and stand in the middle in a split stance.', 'Hold the handles beside your chest.', 'Press forward until your hands meet.', 'Return slowly.'],
  ['Brace your core so you do not get pulled back'], ['Arching your low back', 'Letting the stack slam']);
X('seated-bb-press', 'Seated barbell press', ['barbell', 'adjbench', 'rack'], ['front-delts'], ['side-delts', 'triceps-lateral'], { l: 2, c: 1, p: 'vpress' }, () => M.ohp({ imp: 'bb', sit: true }),
  ['Sit on an upright bench in a rack with the bar at shoulder height.', 'Grip just outside your shoulders and unrack.', 'Press the bar straight overhead.', 'Lower to your upper chest.'],
  ['Move your head back as the bar passes', 'Ribs down'], ['Leaning back too far', 'Half reps']);
X('seated-lateral', 'Seated lateral raise', ['dumbbells', 'bench'], ['side-delts'], ['traps'], { l: 1, p: 'lat' }, () => M.lateral({ sit: true }),
  ['Sit on the end of a bench with dumbbells at your sides.', 'Raise them out to the side to shoulder height.', 'Lower slowly.'],
  ['Sitting stops you using momentum', 'Lead with the elbows'], ['Shrugging', 'Swinging the torso']);
X('cable-front-raise', 'Cable front raise', ['cable'], ['front-delts'], ['upper-chest'], { l: 1, p: 'front' }, () => M.frontRaise({ imp: 'cable' }),
  ['Face away from a low pulley with a straight bar between your legs.', 'Raise the bar in front of you to eye level.', 'Lower slowly.'],
  ['Constant tension all the way down'], ['Leaning back to lift it']);
X('y-raise', 'Incline Y-raise', ['dumbbells', 'adjbench'], ['traps', 'rear-delts'], ['rotator-cuff', 'upper-back'], { l: 1, p: 'rfly' }, () => M.yRaise(),
  ['Lie chest-down on an incline bench with light dumbbells hanging.', 'Thumbs up, raise your arms up and out into a Y.', 'Pause, then lower slowly.'],
  ['Use very light weights', 'Shoulder blades down and back'], ['Shrugging up to the ears', 'Arching off the pad']);
X('band-face-pull', 'Band face pull', ['bands'], ['rear-delts'], ['rotator-cuff', 'upper-back'], { l: 1, p: 'facepull' }, () => M.facePull({ band: true }),
  ['Anchor a band at head height and hold both ends.', 'Pull toward your face, elbows high and wide.', 'Finish with hands beside your ears.', 'Return slowly.'],
  ['Great daily shoulder-health move'], ['Pulling to the chest', 'Elbows dropping']);
X('neutral-pullup', 'Neutral-grip pull-up', ['pullupbar'], ['lats'], ['brachialis', 'biceps-long', 'upper-back'], { l: 2, c: 1, p: 'vpull' }, () => M.pullup({ grip: 'neutral' }),
  ['Grip the parallel handles with palms facing each other.', 'Hang with straight arms and shoulders active.', 'Pull your chest up between the handles.', 'Lower to a full hang.'],
  ['Easiest pull-up grip on the elbows and shoulders'], ['Kipping', 'Half reps']);
X('pendlay-row', 'Pendlay row', ['barbell'], ['upper-back'], ['lats', 'rear-delts', 'lower-back'], { l: 3, c: 1, p: 'hrow' }, () => M.bentRow({ pendlay: true }),
  ['Set up like a deadlift with your back flat and nearly parallel to the floor.', 'Pull the bar hard from the floor to your lower chest.', 'Return it to the floor and reset each rep.'],
  ['Back stays flat and still', 'Explosive pull, controlled return'], ['Standing up as you row', 'Rounding the back']);
X('rack-pull', 'Rack pull', ['barbell', 'rack'], ['glute-max', 'traps'], ['hamstrings', 'lower-back', 'forearm-flexors'], { l: 2, c: 1, p: 'hinge-dl' }, () => M.deadlift({ rack: true }),
  ['Set the pins so the bar sits just below your knees.', 'Grip just outside your legs, back flat.', 'Drive your hips through to stand tall.', 'Lower back to the pins.'],
  ['Great for building lockout strength and grip'], ['Leaning back at the top', 'Rounding the back']);
X('kb-rdl', 'Kettlebell Romanian deadlift', ['kettlebell'], ['hamstrings'], ['glute-max', 'lower-back'], { l: 1, p: 'hinge' }, () => M.deadlift({ rdl: true, imp: 'kb' }),
  ['Hold a kettlebell with both hands in front of your thighs.', 'Push your hips back with soft knees, bell sliding down your legs.', 'Stop when you feel a strong hamstring stretch.', 'Squeeze your glutes to stand.'],
  ['Back stays flat', 'Weight in your heels'], ['Squatting it down', 'Rounding the back']);
X('zottman-curl', 'Zottman curl', ['dumbbells'], ['biceps-short'], ['brachialis', 'forearm-extensors'], { l: 2, p: 'curl' }, () => M.curl({ imp: 'db', zott: true }),
  ['Curl the dumbbells up with palms facing up.', 'At the top, turn your palms to face down.', 'Lower slowly with palms down.', 'Turn palms up at the bottom and repeat.'],
  ['Works biceps on the way up and forearms on the way down'], ['Rushing the lowering part']);
X('rope-hammer-curl', 'Cable rope hammer curl', ['cable'], ['brachialis'], ['biceps-long', 'forearm-extensors'], { l: 1, p: 'hammer' }, () => M.curl({ imp: 'cable', grip: 'neu' }),
  ['Attach a rope to a low pulley and hold the ends with palms facing.', 'Curl up keeping elbows by your sides.', 'Lower slowly.'],
  ['Constant tension through the whole range'], ['Elbows drifting forward']);
X('db-skull-crusher', 'Dumbbell skull crusher', ['dumbbells', 'bench'], ['triceps-long'], ['triceps-lateral'], { l: 1, p: 'skull' }, () => M.skull({ imp: 'db' }),
  ['Lie on a bench holding dumbbells over your chest, palms facing.', 'Bend only at the elbows to lower them beside your head.', 'Extend back up.'],
  ['Upper arms stay still', 'Easier on the wrists than a bar'], ['Elbows flaring wide', 'Turning it into a press']);
X('box-squat', 'Box squat', ['barbell', 'rack', 'box'], ['quads', 'glute-max'], ['hamstrings', 'adductors'], { l: 2, c: 1, p: 'squat' }, () => M.squat({ box: true }),
  ['Set a box behind you at about knee height.', 'Squat back until you sit lightly on the box.', 'Pause without relaxing.', 'Drive up through your midfoot.'],
  ['Teaches you to sit back and stay tight', 'Shins stay fairly vertical'], ['Crashing onto the box', 'Rocking to get up']);
X('pause-squat', 'Pause squat', ['barbell', 'rack'], ['quads'], ['glute-max', 'adductors'], { l: 2, c: 1, p: 'squat' }, () => M.squat({ pause: true }),
  ['Squat down as normal.', 'Hold the bottom for 2 seconds, staying braced.', 'Drive up hard.'],
  ['Use less weight than a normal squat', 'Stay tight in the hole'], ['Relaxing at the bottom', 'Bouncing out']);
X('db-squat', 'Dumbbell squat', ['dumbbells'], ['quads'], ['glute-max', 'adductors'], { l: 1, c: 1, p: 'squat' }, () => M.squat({ side: true, imp: 'db' }),
  ['Hold dumbbells at your sides, feet shoulder width.', 'Sit down between your heels with your chest up.', 'Stand back up.'],
  ['Arms just hang', 'Knees follow toes'], ['Leaning far forward', 'Heels lifting']);
X('kb-goblet-squat', 'Kettlebell goblet squat', ['kettlebell'], ['quads'], ['glute-max', 'deep-core'], { l: 1, c: 1, p: 'squat' }, () => M.squat({ goblet: true, imp: 'kb' }),
  ['Hold a kettlebell by the horns at your chest.', 'Squat down between your knees, elbows inside them.', 'Stand back up.'],
  ['Chest stays tall', 'Great squat to learn on'], ['Rounding forward', 'Knees caving in']);
X('db-reverse-lunge', 'Dumbbell reverse lunge', ['dumbbells'], ['quads', 'glute-max'], ['hamstrings', 'adductors'], { l: 1, c: 1, p: 'lunge', uni: 1 }, () => M.lunge({ type: 'rev', imp: 'db' }),
  ['Stand holding dumbbells at your sides.', 'Step one foot back and lower your back knee toward the floor.', 'Drive through your front heel to stand.', 'Alternate legs.'],
  ['Easier on the knees than forward lunges'], ['Front knee caving in', 'Short steps']);
X('bb-reverse-lunge', 'Barbell reverse lunge', ['barbell', 'rack'], ['quads', 'glute-max'], ['hamstrings', 'deep-core'], { l: 2, c: 1, p: 'lunge', uni: 1 }, () => M.lunge({ type: 'rev', imp: 'bb' }),
  ['Take the bar on your upper back.', 'Step back into a lunge.', 'Drive back up and alternate.'],
  ['Stay tall', 'Control the step'], ['Losing balance from a narrow stance']);
X('banded-bridge', 'Banded glute bridge', ['bands'], ['glute-max'], ['glute-med', 'hamstrings'], { l: 1, p: 'thrust' }, () => M.hipThrust({ floor: true, imp: 'band' }),
  ['Lie on your back with a band above your knees and feet flat.', 'Push your knees out against the band.', 'Drive your hips up and squeeze.', 'Lower slowly.'],
  ['Knees stay wide the whole time'], ['Knees caving in', 'Arching the low back']);
X('kb-farmer-carry', 'Kettlebell farmer’s carry', ['kettlebell'], ['forearm-flexors', 'traps'], ['deep-core', 'glute-med'], { l: 1, c: 1, p: 'carry', u: 'steps' }, () => M.farmer({ imp: 'kb' }),
  ['Pick up a heavy kettlebell in each hand.', 'Stand tall and walk with short, steady steps.'],
  ['Shoulders down and back'], ['Leaning or shrugging']);
X('suitcase-carry', 'Suitcase carry', ['dumbbells'], ['obliques', 'forearm-flexors'], ['deep-core', 'glute-med', 'traps'], { l: 1, p: 'carry', u: 'steps' }, () => M.farmer({ only: 'L' }),
  ['Hold one heavy dumbbell at your side.', 'Walk tall without leaning toward the weight.', 'Switch hands and repeat.'],
  ['Your core fights the lean — stay perfectly upright'], ['Leaning away or toward the weight']);
X('cable-chop-low', 'Low-to-high cable chop', ['cable'], ['obliques'], ['deep-core', 'front-delts'], { l: 1, p: 'rotation-c', uni: 1 }, () => M.woodchop({ low: true }),
  ['Set a pulley low and hold the handle with both hands by your outside hip.', 'Rotate and lift diagonally across your body to above the opposite shoulder.', 'Return under control.'],
  ['Turn through your hips and torso together'], ['Pulling only with the arms']);
X('band-pallof', 'Band Pallof press', ['bands'], ['deep-core'], ['obliques'], { l: 1, p: 'antirot' }, () => M.pallof({ band: true }),
  ['Anchor a band at chest height and stand side-on to it.', 'Hold it at your chest, then press straight out.', 'Resist the pull, then bring it back.'],
  ['Hips and shoulders stay square'], ['Twisting toward the anchor']);
X('situp', 'Sit-up', [], ['upper-abs'], ['hip-flexors', 'lower-abs'], { l: 1, p: 'situp' }, () => M.crunch({ full: true }),
  ['Lie on your back with knees bent and feet flat.', 'Hands lightly behind your head.', 'Curl up all the way to sitting.', 'Lower slowly.'],
  ['Curl up — don’t jerk up'], ['Pulling on your neck', 'Feet lifting off']);
X('v-up', 'V-up', [], ['lower-abs', 'upper-abs'], ['hip-flexors'], { l: 2, p: 'legraise-bw' }, () => M.vUp(),
  ['Lie flat with arms overhead and legs straight.', 'Lift arms and legs together to meet over your hips.', 'Lower slowly to the start without resting.'],
  ['Bend the knees a little if your back lifts'], ['Swinging with momentum', 'Crashing back down']);
X('flutter-kicks', 'Flutter kicks', [], ['lower-abs'], ['hip-flexors', 'deep-core'], { l: 1, p: 'legraise-bw', u: 'sec' }, () => M.flutter(),
  ['Lie on your back with hands flat beside you.', 'Lift your legs a few inches off the floor.', 'Kick them up and down in small, fast flutters.'],
  ['Low back stays pressed down'], ['Back arching off the floor']);
X('plank-tap', 'Plank shoulder tap', [], ['deep-core'], ['obliques', 'front-delts'], { l: 1, p: 'plank' }, () => M.plankTap(),
  ['Start in a high plank, feet a little wider than usual.', 'Lift one hand and tap the opposite shoulder.', 'Put it down and switch, keeping hips still.'],
  ['Hips should barely move'], ['Rocking side to side', 'Hips sagging']);
X('side-plank-dip', 'Side plank hip dip', [], ['obliques'], ['glute-med', 'deep-core'], { l: 1, p: 'sideplank' }, () => M.sidePlankDip(),
  ['Get into a side plank on your forearm.', 'Lower your hip toward the floor.', 'Lift it back up high.'],
  ['Elbow under your shoulder'], ['Rolling forward', 'Rushing']);
