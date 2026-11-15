/* ===================== Coaching notes =====================
   Researched, lift-specific technique for the most common exercises: the one thing that matters most, set-up,
   the movement, cues, mistakes, and the callouts drawn on the figure. Overrides the generic text in data.js.
   Sources: StrongLifts technique guides (bench, deadlift, overhead press), Trainer Academy CPT textbook
   "Resistance Training Technique", NSCA PTQ 10.2 "Teaching fundamental resistance training movement patterns". */
const COACH = (function () {
  const pin = (p, label) => ({ t: 'pin', p, label }), path = (p, label) => ({ t: 'path', p, label }), plumb = (p, label) => ({ t: 'plumb', p, label });
  const angle = (at, a, b, label) => ({ t: 'angle', at, a, b, label }), spine = label => ({ t: 'spine', label }), line = (a, b, label, ext = .12) => ({ t: 'line', a, b, label, ext });
  const level = (p, label) => ({ t: 'level', p, label }), arrow = (p, dir, label) => ({ t: 'arrow', p, dir, frame: 'w', label });
  const tuck = label => angle('shL', 'hipL', 'elbowL', label), elbow = label => angle('elbowL', 'shL', 'wristL', label), knee = label => angle('kneeL', 'hipL', 'ankleL', label);
  const press = {
    key: 'Shoulder blades pinned back and down the whole time — that protects your shoulders and gives you a stable base.',
    setup: ['Lie with your eyes under the bar and feet flat on the floor, under your knees.', 'Squeeze your shoulder blades together and down, and lift your chest. Keep a small natural arch in your lower back with your backside on the bench.', 'Grip just wider than shoulders so your forearms are vertical at the bottom. Wrap your thumbs and keep wrists straight.'],
    how: ['Unrack and bring the bar over your shoulders with locked elbows.', 'Take a breath, brace, and lower under control to the middle of your chest.', 'Keep elbows tucked partway — roughly 45–75° from your ribs, never straight out to the sides.', 'Touch lightly, then press up and slightly back so the bar finishes over your shoulders.'],
    cues: ['Bar travels on a slight diagonal: shoulders at the top, mid-chest at the bottom', 'Wrist stacked over elbow', 'Push yourself into the bench', 'Feet planted, backside down'],
    avoid: ['Elbows flared to 90° — hard on the shoulders', 'Bouncing the bar off your chest', 'Wrists bent back', 'Hips lifting off the bench', 'Letting your shoulders roll forward at the top'],
    guides: [path('grips', 'Shoulders → mid-chest'), pin('elbowL', 'Elbows 45–75° from ribs'), pin('upback', 'Shoulder blades pinned')],
  };
  const dbPress = { ...press,
    setup: ['Sit with the dumbbells on your thighs, then lie back and bring them to your chest one knee at a time.', 'Squeeze your shoulder blades back and down and plant your feet.', 'Start with the dumbbells beside your chest, forearms vertical.'],
    how: ['Press straight up until your arms are straight, dumbbells over your shoulders.', 'Do not clang them together at the top — stop just short.', 'Lower slowly until the handles are level with your chest, elbows about 45° from your ribs.'],
    cues: ['Forearms stay vertical all the way', 'Lower for 2–3 seconds', 'Head, shoulders and backside stay on the bench'],
    avoid: ['Dumbbells drifting toward your face or stomach', 'Elbows flaring straight out', 'Cutting the range short at the bottom', 'Arching your hips off the bench'],
    guides: [path('grips', 'Straight up and down'), pin('elbowL', 'Elbows ~45°'), pin('wristL', 'Wrist over elbow')] };
  const squat = {
    key: 'Keep the bar balanced over the middle of your foot from top to bottom — if it drifts forward, your back takes the load.',
    setup: ['Set the bar on your upper traps (not on your neck), hands just outside your shoulders.', 'Stand up, take two steps back, feet about shoulder width with toes turned out slightly.', 'Big breath into your belly and brace as if about to be punched.'],
    how: ['Break at hips and knees together and sit down between your heels.', 'Knees travel forward and out, in line with your toes.', 'Go down until your hip crease is level with or just below your knees, keeping your whole foot flat.', 'Drive up through the middle of your foot; hips and chest rise at the same speed.'],
    cues: ['Bar stays over mid-foot', 'Knees follow toes', 'Chest proud, back flat', 'Brace before every rep'],
    avoid: ['Knees caving inward', 'Heels lifting', 'Hips shooting up first so you fold forward', 'Lower back rounding at the bottom', 'Bar resting on your neck'],
    guides: [plumb('grips', 'Bar over mid-foot'), spine('Back flat, chest up'), pin('kneeL', 'Knees track over toes')],
  };
  const hinge = {
    key: 'The movement is your hips going back, not your chest going down. Your back stays flat and the bar stays against your legs.',
    setup: ['Stand tall holding the bar against your thighs, feet hip width.', 'Unlock your knees slightly — that small bend stays the same throughout.', 'Pull your shoulders back and brace.'],
    how: ['Push your hips straight back as if closing a car door with your backside.', 'Let the bar slide down your thighs, staying in contact with your legs.', 'Stop when your hamstrings are fully stretched — usually just below the knees. Do not chase the floor.', 'Drive your hips forward to stand tall and squeeze your glutes.'],
    cues: ['Hips back, not chest down', 'Bar drags along your legs', 'Knee angle stays fixed', 'Neck in line with your spine'],
    avoid: ['Rounding your back to get lower', 'Bending the knees more as you go down (turns it into a squat)', 'Bar drifting away from your legs', 'Leaning back at the top'],
    guides: [spine('Flat back'), arrow('hips', [0, 0, -1], 'Hips push back'), path('grips', 'Bar slides down legs')],
  };
  const pull = {
    key: 'Start every rep by pulling your shoulder blades down — then drive your elbows to your ribs. Do not just bend your arms.',
    setup: ['Grip the bar slightly wider than your shoulders, palms facing away.', 'Hang with straight arms and legs still.', 'Set your shoulders: pull them down away from your ears.'],
    how: ['Pull your elbows down and back toward your ribs.', 'Bring your chest up toward the bar until your chin clears it.', 'Lower under control all the way to straight arms.'],
    cues: ['Shoulders down before you pull', 'Elbows to ribs', 'Chest leads, chin follows', 'Full hang at the bottom'],
    avoid: ['Kicking or swinging to get up', 'Shrugging your shoulders to your ears', 'Half reps that stop short of straight arms', 'Dropping fast on the way down'],
    guides: [arrow('elbowL', [0, -1, 0], 'Elbows drive to ribs'), pin('shL', 'Shoulders down first'), pin('chest', 'Chest to the bar')],
  };
  const curl = {
    key: 'Your upper arms stay glued to your sides. If your elbows drift forward or your body swings, the weight is too heavy.',
    setup: ['Stand tall, shoulders back and down, weights just in front of your hips.', 'Palms facing forward, elbows touching your ribs.'],
    how: ['Curl up by bending only at the elbow until your forearms are nearly vertical.', 'Squeeze briefly at the top.', 'Lower slowly — about 2–3 seconds — to fully straight arms.'],
    cues: ['Elbows pinned to ribs', 'No swing from the hips', 'Slow on the way down', 'Full stretch at the bottom'],
    avoid: ['Swinging your body to start the rep', 'Elbows drifting forward', 'Shoulders rolling forward', 'Stopping short at the bottom'],
    guides: [pin('elbowL', 'Elbow pinned to ribs'), elbow('Full range'), spine('No lean-back')],
  };
  const lunge = {
    key: 'Front knee stays in line with your toes and does not cave inward; most of your weight is on the front leg.',
    setup: ['Stand tall with feet hip width — think train tracks, not a tightrope.', 'Brace your core and keep your chest up.'],
    how: ['Step and lower straight down until your back knee is just above the floor.', 'Front shin stays close to vertical with the whole front foot flat.', 'Push through the front heel and mid-foot to come back up.'],
    cues: ['Drop straight down, not forward', 'Front knee over the second toe', 'Torso tall', 'Front leg does the work'],
    avoid: ['Front knee collapsing inward', 'Pushing off the back leg', 'Feet in one line so you wobble', 'Leaning far forward'],
    guides: [pin('kneeL', 'Knee in line with toes'), spine('Torso tall'), knee('About 90° at the bottom')],
  };
  const C = {
    'bb-bench': press, 'bb-incline': { ...press, key: 'Use a low incline (15–30°). The bar comes down to your upper chest and goes straight up over your shoulders.', guides: [path('grips', 'Upper chest → over shoulders'), pin('elbowL', 'Elbows 45–75° from ribs'), pin('upback', 'Shoulder blades pinned')] },
    'close-bench': { ...press, key: 'Hands about shoulder width — no narrower — with elbows staying close to your ribs so your triceps do the work.', guides: [path('grips', 'Lower chest → over shoulders'), pin('elbowL', 'Elbows close to ribs'), pin('wristL', 'Wrists straight')] },
    'db-bench': dbPress, 'db-incline': { ...dbPress, key: 'Set the bench to 15–30°. Steeper turns it into a shoulder press. Press straight up, dumbbells finishing over your shoulders.' },
    'pushup': {
      key: 'Your body moves as one straight plank from head to heels — if your hips sag or pike, the rep does not count.',
      setup: ['Hands just outside your shoulders, fingers forward.', 'Legs straight, feet together, on your toes.', 'Squeeze your glutes and brace your stomach so ears, shoulders, hips and ankles line up.'],
      how: ['Lower your whole body until your chest is just above the floor.', 'Elbows point back at about 45°, forearms vertical over your wrists.', 'Push the floor away until your arms are straight.'],
      cues: ['One straight line', 'Elbows 45°, like an arrow not a T', 'Chest reaches the floor before your hips', 'Push the floor away at the top'],
      avoid: ['Hips sagging toward the floor', 'Hips piking up', 'Elbows flared out wide', 'Head dropping or neck craning', 'Half range'],
      guides: [line('ankles', 'head', 'One straight line'), pin('elbowL', 'Elbows ~45°'), pin('wristL', 'Forearm over wrist')] },
    'back-squat': squat,
    'front-squat': { ...squat, key: 'Elbows stay high so the bar sits on your shoulders, not in your hands — and your torso stays nearly upright.',
      setup: ['Bar rests on the front of your shoulders, close to your throat, fingertips under it.', 'Lift your elbows until your upper arms are near level with the floor.', 'Feet shoulder width, toes slightly out. Breathe and brace.'],
      cues: ['Elbows up the whole time', 'Torso tall', 'Knees forward and out', 'Bar over mid-foot'], avoid: ['Elbows dropping so the bar rolls forward', 'Leaning forward', 'Heels lifting', 'Knees caving in'],
      guides: [plumb('grips', 'Bar over mid-foot'), pin('elbowL', 'Elbows high'), spine('Torso upright')] },
    'goblet-squat': { ...squat, key: 'Hold the weight tight to your chest and stay tall; at the bottom your elbows come inside your knees.',
      setup: ['Hold one dumbbell upright against your chest with both hands, elbows tucked under it.', 'Feet a little wider than shoulders, toes slightly out.'],
      how: ['Sit straight down between your knees, keeping your chest up.', 'Go as low as you can while your heels stay down, elbows brushing the inside of your knees.', 'Stand up by pushing the floor away.'],
      cues: ['Weight stays glued to your chest', 'Elbows inside knees', 'Tall chest', 'Heels down'], avoid: ['Tipping forward', 'Weight drifting away from your body', 'Knees caving in'],
      guides: [pin('elbowL', 'Elbows inside knees'), spine('Tall chest'), pin('kneeL', 'Knees out over toes')] },
    'deadlift': {
      key: 'The bar starts over the middle of your foot and stays against your legs all the way up. Your back does not change shape.',
      setup: ['Stand with the bar over the middle of your feet (about over your shoelaces), heels hip width.', 'Bend down and grip just outside your legs without moving the bar.', 'Bend your knees until your shins touch the bar, then lift your chest so your back is flat. Hips end up above your knees and below your shoulders, with shoulders just in front of the bar.'],
      how: ['Take a breath, brace, and squeeze the bar to take the slack out.', 'Push the floor away with your legs; hips and chest rise together.', 'Drag the bar up your shins and thighs in a straight line.', 'Stand tall with hips and knees locked — do not lean back.', 'Lower by pushing your hips back first, then bend your knees once the bar passes them.'],
      cues: ['Bar over mid-foot, touching your legs', 'Push the floor away', 'Arms are just hooks — elbows locked', 'Head in line with your spine'],
      avoid: ['Lower back rounding', 'Hips shooting up before the bar moves', 'Squatting it with hips too low', 'Bar swinging out around your knees', 'Jerking the bar off the floor', 'Leaning back or shrugging at the top'],
      guides: [plumb('grips', 'Bar over mid-foot'), spine('Neutral back'), pin('shL', 'Shoulders just ahead of the bar')] },
    'rdl': hinge, 'db-rdl': { ...hinge, setup: ['Stand tall holding dumbbells in front of your thighs, feet hip width.', 'Unlock your knees slightly — that small bend stays the same throughout.', 'Pull your shoulders back and brace.'], guides: [spine('Flat back'), arrow('hips', [0, 0, -1], 'Hips push back'), path('grips', 'Weights slide down legs')] },
    'ohp': {
      key: 'Press straight up close to your face and finish with the bar over your shoulders and mid-foot — ribs down, no leaning back.',
      setup: ['Grip just outside your shoulders; bar sits low in your palms on your collarbones.', 'Forearms vertical, elbows slightly in front of the bar.', 'Feet hip width, knees and hips locked. Squeeze your glutes, breathe and brace.'],
      how: ['Tuck your chin back and press the bar straight up past your face.', 'As the bar clears your forehead, bring your head and chest through under it.', 'Lock out with the bar over your shoulders and ears, and shrug up slightly.', 'Lower under control along the same path.'],
      cues: ['Forearms vertical', 'Bar path is a straight line', 'Head through at the top', 'Glutes and abs tight'],
      avoid: ['Leaning back and turning it into an incline press', 'Bar looping out in front of your face', 'Using your legs to bounce it up', 'Elbows flared behind the bar', 'Stopping short of lockout'],
      guides: [plumb('grips', 'Finish over mid-foot'), pin('elbowL', 'Elbows under the bar'), spine('Ribs down — no lean-back')] },
    'db-shoulder-press': {
      key: 'Press straight up over each shoulder with your ribs down — if your lower back arches, the weight is too heavy.',
      setup: ['Sit upright with your back supported and feet flat.', 'Dumbbells at shoulder height, forearms vertical, elbows slightly in front of your body.'],
      how: ['Brace and press straight up until your arms are straight.', 'Dumbbells finish over your shoulders, not touching.', 'Lower slowly to about ear level.'],
      cues: ['Forearms vertical', 'Elbows slightly forward, not straight out to the sides', 'Ribs down', 'Control the lowering'], avoid: ['Arching your lower back', 'Pressing forward instead of up', 'Elbows flared directly sideways', 'Stopping halfway down'],
      guides: [path('grips', 'Straight up'), pin('wristL', 'Wrist over elbow'), spine('Back against the pad')] },
    'bb-row': {
      key: 'Your torso stays still and your back stays flat. If you have to stand up to finish the rep, the weight is too heavy.',
      setup: ['Feet hip width, soft knees.', 'Hinge at the hips with a flat back until your torso is about 45° or lower, bar hanging just below your knees.', 'Brace, neck in line with your spine.'],
      how: ['Pull the bar to your lower ribs, elbows about 45° from your body.', 'Squeeze your shoulder blades together at the top.', 'Lower to fully straight arms without letting your torso move.'],
      cues: ['Torso frozen', 'Pull elbows back, not hands up', 'Bar to lower ribs', 'Flat back'],
      avoid: ['Jerking upright to heave the bar', 'Rounding your back', 'Shrugging toward your ears', 'Short, half-range pulls'],
      guides: [spine('Flat back, torso still'), path('grips', 'To lower ribs'), arrow('elbowL', [0, .5, -1], 'Elbows back')] },
    'one-arm-row': {
      key: 'Pull your elbow toward your hip, not your hand toward your shoulder — and keep your chest square to the floor.',
      setup: ['Place one hand on a bench, feet staggered, back flat and roughly parallel to the floor.', 'Let the dumbbell hang straight down from your shoulder.'],
      how: ['Pull your elbow back toward your hip until the dumbbell reaches your ribs.', 'Pause, then lower to a full stretch.'],
      cues: ['Elbow to hip', 'Shoulders stay level', 'Full stretch at the bottom'], avoid: ['Twisting your torso open', 'Yanking with your arm', 'Rounding your back'],
      guides: [spine('Back flat'), arrow('elbowR', [0, .5, -1], 'Elbow to hip'), level('shoulders', 'Shoulders level')] },
    'pullup': pull,
    'chinup': { ...pull, setup: ['Grip the bar shoulder width with palms facing you.', 'Hang with straight arms and legs still.', 'Set your shoulders: pull them down away from your ears.'] },
    'lat-pulldown': { ...pull,
      key: 'Pull your shoulder blades down first, then bring the bar to your upper chest with your elbows — not behind your neck.',
      setup: ['Set the thigh pad snug so you cannot lift off the seat.', 'Grip just wider than your shoulders and sit tall with a slight lean back.'],
      how: ['Pull your shoulders down, then drive your elbows toward your ribs.', 'Bring the bar to your upper chest and pause briefly.', 'Let it rise under control to fully straight arms.'],
      cues: ['Chest up to meet the bar', 'Elbows down and slightly forward', 'Slight lean, then stay still', 'Full stretch at the top'], avoid: ['Rocking back to use momentum', 'Pulling behind your neck', 'Shrugging', 'Letting the weight yank you up'],
      guides: [arrow('elbowL', [0, -1, 0], 'Elbows drive down'), pin('chest', 'Bar to upper chest'), spine('Slight lean, then still')] },
    'hip-thrust': {
      key: 'At the top your shins are vertical and your body is flat from shoulders to knees — squeeze your glutes, do not arch your lower back.',
      setup: ['Sit with your shoulder blades against the long edge of a bench, bar across your hip crease (use a pad).', 'Feet flat, about hip width, placed so your shins will be vertical at the top.', 'Tuck your chin and keep your ribs down.'],
      how: ['Drive through your heels and lift your hips until they are level with your shoulders and knees.', 'Squeeze your glutes hard for a second.', 'Lower under control.'],
      cues: ['Chin tucked, eyes forward', 'Ribs down', 'Shins vertical at the top', 'Push through your heels'], avoid: ['Arching your lower back to get higher', 'Feet too far away (hamstrings take over) or too close (quads take over)', 'Looking up at the ceiling', 'Stopping short of full hip lockout'],
      guides: [pin('kneeL', 'Shins vertical at the top'), spine('Ribs down, chin tucked'), pin('hips', 'Full lockout')] },
    'walking-lunge': lunge, 'reverse-lunge': lunge, 'db-reverse-lunge': lunge, 'split-squat': lunge,
    'bulgarian': { ...lunge, key: 'Front foot far enough forward that you drop straight down; nearly all your weight is on the front leg.', setup: ['Stand about two foot-lengths in front of a bench and rest the top of your back foot on it.', 'Hold dumbbells at your sides and stand tall.'] },
    'leg-press': {
      key: 'Your lower back and hips stay pressed into the seat. Go only as deep as you can without your hips curling up.',
      setup: ['Feet about shoulder width in the middle of the platform.', 'Back and hips flat against the pad, hands on the handles.'],
      how: ['Release the safeties and lower until your knees are bent to about 90° or a little more.', 'Knees track in line with your toes.', 'Press back up through your whole foot, stopping just short of locking your knees.'],
      cues: ['Hips stay down', 'Knees follow toes', 'Soft knees at the top', 'Slow down, strong up'], avoid: ['Hips rolling off the pad at the bottom', 'Knees caving in', 'Snapping your knees locked', 'Tiny range with too much weight'],
      guides: [pin('lowback', 'Low back stays on the pad'), knee('Stop short of lockout'), pin('kneeL', 'Knees follow toes')] },
    'bb-curl': curl, 'db-curl': curl, 'ez-curl': curl,
    'hammer-curl': { ...curl, setup: ['Stand tall with dumbbells at your sides, palms facing your thighs.', 'Shoulders back and down, elbows touching your ribs.'], how: ['Curl up with thumbs leading, palms facing each other the whole time.', 'Squeeze at the top.', 'Lower slowly to straight arms.'] },
    'pushdown': {
      key: 'Only your forearms move. Your elbows stay pinned at your sides from start to finish.',
      setup: ['Face the cable, bar at about chest height, slight forward lean.', 'Tuck your elbows against your ribs.'],
      how: ['Push down until your arms are fully straight and squeeze.', 'Let the bar rise only until your forearms are just above level — elbows do not move.'],
      cues: ['Elbows pinned', 'Lock out fully', 'Shoulders down', 'Control the return'], avoid: ['Elbows drifting forward and up', 'Leaning over to push with body weight', 'Half reps', 'Letting the stack pull you up'],
      guides: [pin('elbowL', 'Elbow pinned to ribs'), elbow('Lock out fully'), spine('Slight lean, still')] },
    'db-lateral': {
      key: 'Lead with your elbows and stop at shoulder height. Use light weights — this is not a heavy lift.',
      setup: ['Stand tall with light dumbbells at your sides, slight bend in the elbows.', 'Shoulders down, away from your ears.'],
      how: ['Raise your arms out to the sides until they are level with your shoulders.', 'Elbows stay slightly higher than your wrists.', 'Lower slowly — about 3 seconds.'],
      cues: ['Elbows lead', 'Stop at shoulder height', 'No shrug', 'Slow down'], avoid: ['Swinging the weights up', 'Shrugging toward your ears', 'Going above shoulder height', 'Bending elbows to 90° to cheat'],
      guides: [level('shoulders', 'Stop at shoulder height'), pin('elbowL', 'Elbows lead'), pin('shL', 'No shrug')] },
    'face-pull': {
      key: 'Elbows high and wide, and finish by rotating your hands back beside your ears — it is a shoulder-health move, so go light.',
      setup: ['Set the rope at upper-chest to face height and hold it with thumbs toward you.', 'Step back with arms straight and stand tall.'],
      how: ['Pull the rope toward your face, pulling the ends apart.', 'Elbows stay at or above shoulder height.', 'Finish with hands beside your ears, knuckles back. Pause, then return slowly.'],
      cues: ['Elbows high and wide', 'Pull the rope apart', 'Hands finish by your ears', 'Stay tall'], avoid: ['Elbows dropping so it becomes a row', 'Leaning back to pull', 'Going too heavy'],
      guides: [pin('elbowL', 'Elbows high and wide'), path('grips', 'To your face'), spine('Stand tall')] },
    'plank': {
      key: 'A straight line from ears to ankles. Squeeze your glutes and pull your ribs down — the moment your hips sag, stop.',
      setup: ['Forearms on the floor, elbows directly under your shoulders.', 'Legs straight, on your toes.'],
      how: ['Squeeze your glutes and brace your stomach.', 'Hold a straight line and breathe steadily.'],
      cues: ['Elbows under shoulders', 'Glutes tight', 'Ribs down', 'Eyes on the floor'], avoid: ['Hips sagging', 'Hips piked high', 'Holding your breath', 'Looking up'],
      guides: [line('ankles', 'head', 'One straight line'), pin('hips', 'Hips level — no sag'), pin('elbowL', 'Elbow under shoulder')] },
    'cable-crunch': {
      key: 'Your hips stay still. Curl your spine — ribs toward hips — instead of sitting back or folding at the waist.',
      setup: ['Kneel a step back from a high pulley holding the rope beside your head.', 'Hips above your knees, slight forward lean.'],
      how: ['Round your back and bring your ribs toward your hips, elbows toward your thighs.', 'Squeeze your abs, then rise slowly until your back is nearly straight again.'],
      cues: ['Hips do not move', 'Round your spine', 'Hands stay by your head', 'Exhale as you crunch'], avoid: ['Sitting your hips back', 'Pulling with your arms', 'Bending only at the hips with a flat back'],
      guides: [pin('hips', 'Hips stay still'), pin('chest', 'Ribs to hips'), spine('Round the spine')] },
  };
  for (const e of EX) { const c = C[e.id]; if (!c) continue; for (const k of ['key', 'setup', 'how', 'cues', 'avoid', 'guides']) if (c[k]) e[k] = c[k]; e.coached = true; }
  return C;
})();
