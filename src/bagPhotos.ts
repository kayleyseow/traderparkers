/**
 * Shared helpers used by both /bags/:slug (Parker's photos) and
 * /encyclopedia/:id (reference photos) — angle types, filename-to-angle
 * inference, URL building, and the per-bag design-notes lookup.
 */

const BASE = import.meta.env.BASE_URL

export type Angle = 'front' | 'back' | 'left' | 'right' | 'bottom'

export const ANGLE_ORDER: Angle[] = ['front', 'back', 'left', 'right', 'bottom']

export const ANGLE_LABEL: Record<Angle, string> = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
  bottom: 'Bottom',
}

export function inferAngleMap(photos: string[]): Partial<Record<Angle, string>> {
  const result: Partial<Record<Angle, string>> = {}
  for (const p of photos) {
    const base = p
      .split('/')
      .pop()
      ?.replace(/\.[^./]+$/, '')
      .toLowerCase()
    if (!base) continue
    // Match exact angle name (front.png) or a color-prefixed form
    // (skyblue_front.png, navy_back.png) so we can keep multiple colorways
    // of the same bag side by side in one folder.
    const matched = (ANGLE_ORDER as readonly string[]).find(
      (a) => base === a || base.endsWith('_' + a),
    ) as Angle | undefined
    if (matched) {
      result[matched] = p
    }
  }
  return result
}

export function photoUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${BASE}${path.replace(/^\//, '')}`
}

/**
 * The default photo set for an encyclopedia entry. Entries with variants store
 * photos inside each variant; this falls through to the first variant when the
 * entry has no top-level photos of its own.
 */
export function defaultReferencePhotos(bag: {
  referencePhotos?: string[]
  referencePhoto?: string
  variants?: { referencePhotos?: string[]; colorways?: { photo: string }[] }[]
}): string[] {
  if (bag.referencePhotos?.length) return bag.referencePhotos
  const v0 = bag.variants?.[0]
  if (v0?.colorways?.length) return v0.colorways.map((c) => c.photo)
  if (v0?.referencePhotos?.length) return v0.referencePhotos
  if (bag.referencePhoto) return [bag.referencePhoto]
  return []
}

/* ───────────────── PER-BAG DESIGN NOTES ─────────────────
   Subtitle, blurb, and per-angle captions describe the *bag design*
   (encyclopedia-level info, not pantry-level). Keyed by EncyclopediaBag.id.
   Will likely migrate into encyclopedia.json once we know the shape we want,
   but living here keeps the schema stable while iterating. */

export type DesignNotes = {
  subtitle?: string
  blurb?: string
  angleCaptions?: Partial<Record<Angle, string>>
}

export const DESIGN_NOTES: Record<string, DesignNotes> = {
  al: {
    subtitle: 'the Beautiful',
    blurb:
      'A five-sided road trip across the state. The front is the camellia, Alabama’s state flower. The back is Muscle Shoals — the recording town that shaped American music. The side panels nod to Huntsville’s Saturn V and a hand-written banana pudding recipe, and the underside leans into Alabama’s love of a good fried pickle.',
    angleCaptions: {
      front: 'Alabama the Beautiful — camellias, the state flower',
      back: 'Muscle Shoals — the sound that shaped American music',
      left: 'Huntsville — Rocket City and the Saturn V',
      right: 'Joe’s ’Bama Banana Pudding recipe, panel side',
      bottom: 'Fried pickle potential — dill pickles down below',
    },
  },
  'ca-norcal': {
    subtitle: 'the Bay & Wine Country',
    blurb:
      'A five-panel postcard from Northern California. The front looks across the Bay — Golden Gate, hearts left in San Francisco, poppies, and a Pacific crab. The back drifts inland to the state capitol at Sacramento. The side panels detour through the Summer of Love at Haight-Ashbury and the road signs of wine country, and the underside leans into the Central Valley’s yellow peaches.',
    angleCaptions: {
      front: 'I left my heart in San Francisco — Golden Gate, poppies, and Pacific crab',
      back: 'Trader Joe’s at the state capitol — Sacramento side',
      left: 'Wine country signposts — Napa, Geyserville, Healdsburg, Highway 128',
      right: '1967 Summer of Love — Haight-Ashbury and a flower-power VW bus',
      bottom: 'California yellow peaches — a Central Valley orchard staple',
    },
  },
  'ca-socal': {
    subtitle: 'Freeways & Beach Towns',
    blurb:
      'A five-panel love letter to Southern California’s freeway-and-beach geometry. The front roots itself at a vintage Trader Joe’s storefront with an avocado on the counter. The back is a litany of surf breaks and beach towns. The side panels become freeway-entrance signs — South 5 on one side, North 110 on the other — and the underside lays out the full grid of SoCal freeway shields.',
    angleCaptions: {
      front: 'Trader Joe’s storefront — avocados, “Mmmm,” and where it all began',
      back: 'Beach-town roll call — Mondos, Manhattan, Hermosa, Venice, Malibu',
      left: 'Freeway Entrance — South 5, Exit C',
      right: 'Freeway Entrance — North 110, where the city begins',
      bottom: 'The SoCal freeway grid — 101, 405, 5, 10, 110, 210, 605, 710 and friends',
    },
  },
  co: {
    subtitle: 'Camp & Summit',
    blurb:
      'A two-season tour of Colorado. The front sets up at Joe’s Campground — RVs by a lake, s’mores by the fire. The back climbs to Joe’s Summit, where a hand-drawn trail map lays out the ski runs. The side panels pack in Colorado road culture — bumper stickers on one side, brewery placards on the other — and the underside is a collage of national-park signs, including a delightful "Parker Lot."',
    angleCaptions: {
      front: 'Joe’s Campground — RVs by the lake, s’mores by the fire',
      back: 'Joe’s Summit — a hand-drawn trail map for a perfect powder day',
      left: 'Colorado bumper stickers — "I brake for speculoos," "I ♥ TJ"',
      right: 'Brewery and restaurant placards — Colorado main-street signage',
      bottom: 'National-park placards — Arches, the "Parker Lot," and friends',
    },
  },
  ct: {
    subtitle: 'Birthplace of the Hamburger',
    blurb:
      'A five-panel ode to Connecticut, often credited as the birthplace of the hamburger (Louis’ Lunch, New Haven, 1900). The front lays out the recipe on a vintage typewriter — a nod to Mark Twain’s Hartford. The back assembles it: Trader Joe’s Anatomy of a Hamburger. The side panels carry the state’s literary heritage on one side and the Latin state motto plus a pickle on the other, and the underside flashes a Speed Limit 12 sign in striped rays.',
    angleCaptions: {
      front: 'A secret-menu hamburger recipe — typed on a Hartford typewriter',
      back: 'Trader Joe’s Anatomy of a Hamburger — Connecticut’s most famous invention',
      left: 'Connecticut authors — Mark Twain and Harriet Beecher Stowe, both Hartford residents',
      right: 'Qui Transtulit Sustinet — Connecticut’s state motto, with a pickle',
      bottom: 'Speed Limit 12 — Connecticut quirkiness on striped rays',
    },
  },
  dc: {
    subtitle: 'The Nation’s Capital',
    blurb:
      'A patriotic Washington tour. The front rolls out the cherry-blossom welcome with the White House and the District’s three-stars-and-two-bars flag. The back assembles the Great Seal, the Constitution’s preamble, and a can of Senate Bean Soup. The side panels offer up the Lincoln Memorial and DC’s colorful row houses, and the underside slaps on a "Top Secret" stamp — capital humor.',
    angleCaptions: {
      front: 'DC welcome — the White House, cherry blossoms, and the District’s flag',
      back: 'The Great Seal, "We the People," and Senate Bean Soup',
      left: 'The Lincoln Memorial — "in this temple… the memory of Abraham Lincoln is enshrined forever"',
      right: 'DC row houses — and Joe’s Best Corn for the back porch',
      bottom: 'TOP SECRET — classified capital quirk',
    },
  },
  de: {
    subtitle: 'The First State',
    blurb:
      'A two-nicknames tour of Delaware. The front features the Blue Hen Chicken and "First State" in script — Delaware was the first colony to ratify the Constitution. The back claims its other title, "The Diamond State," with a glittering diamond on coastal blue. The side panels run from the cranes of Wilmington’s port to a horseshoe crab on the Delaware shoreline, and the underside displays a vintage low-numbered "DEL." plate — every digit a quiet brag.',
    angleCaptions: {
      front: 'First State — the Blue Hen Chicken and a Delaware brag in script',
      back: 'The Diamond State — Delaware’s other nickname, on coastal blue',
      left: 'Port of Wilmington — Delaware River cranes at work',
      right: 'Delaware shore — the horseshoe crab, the state marine animal',
      bottom: 'DEL. 13·636 — a vintage low-numbered Delaware plate',
    },
  },
  fl: {
    subtitle: 'The Sunshine State',
    blurb:
      'A five-panel Florida vacation. The front rounds up the state’s iconic wildlife — flamingos, gators, pelicans, palms — under FLORIDA TRADER JOE’S in serif red. The back is pure citrus: oranges arranged into the TJ monogram on turquoise. The side panels grab a saltwater fish on one side and a pink hibiscus-and-surfboard scene on the other. The underside is a handwritten postcard "down here in the sunshine state," addressed home to Trader Joe’s HQ in Monrovia, CA.',
    angleCaptions: {
      front: 'Florida wildlife roll call — flamingos, gators, pelicans, palms',
      back: 'Florida citrus — oranges arranged into the TJ monogram',
      left: 'Trader Joe’s saltwater catch — fish and citrus on green stripes',
      right: 'Beach pink — surfboard, hibiscus, and palm',
      bottom: 'Postcard home — "Enjoying my time down here in the Sunshine State. xoxoxo TJ" — addressed to Monrovia, CA',
    },
  },
  ga: {
    subtitle: 'the Peach State',
    blurb:
      'A peach-saturated tour of Georgia. The front pairs the state name with a Cherokee rose and a peach already wearing the TJ sticker. The back is a peach taxonomy — pie, cobbler, jam, bellini, lemonade, ice cream, muffins, clafoutis, shortcake, crumble. The side panels offer a Georgia waterfall with patchwork quilting on one side and a hand-lettered cold-brew peach tea recipe on the other, and the underside is a vintage "COOKY·BTR" Peach State license plate.',
    angleCaptions: {
      front: 'Georgia the Peach State — Cherokee rose, peach, and TJ patchwork',
      back: 'The peach taxonomy — pie, cobbler, jam, bellini, lemonade, ice cream, more',
      left: 'Georgia waterfall and patchwork quilt — Tallulah Falls country',
      right: 'Sweet & Easy Cold Brew Peach Tea — hand-lettered recipe',
      bottom: 'GEORGIA · COOKY·BTR · 1967 · PEACH STATE — vintage plate humor',
    },
  },
  'ga-atlanta': {
    subtitle: 'A Souvenir from the ATL',
    blurb:
      'A discontinued Atlanta print framed like a souvenir ticket stub, part of the same "ADMIT ONE" series as the Arizona Sonoran Voyage. The front pairs a fat Georgia peach with a tall ship sailing across a stylized red landscape and stamps the panel ADMIT ONE. The side panels run a column of Atlanta-area Trader Joe\'s store locations down a red field, with small mascot figures and palm leaves at the foot.',
    angleCaptions: {
      front: 'A Georgia peach beside a tall ship on a stylized red Atlanta scene, stamped ADMIT ONE',
      back: 'TRADER JOE\'S ATLANTA, second panel of the same souvenir-ticket layout',
      left: 'The roster of Atlanta-area TJ store locations running down the side panel',
      right: 'More TJ store names on the matching opposite side panel, mascot figure at the foot',
      bottom: 'Red polypropylene underside, the bag\'s base',
    },
  },
  id: {
    subtitle: 'The Gem State',
    blurb:
      'A five-panel spud-and-gem tour of Idaho. The front is a vintage Idaho potato sack — "U.S. No. 1 Certified" — anchored by the state outline and a Syringa bloom. The back assembles the state seal, a salmon, the mountain bluebird, and a "BOY-SEE!" pronunciation lesson. The side panels offer a Gem State menu (huckleberry pie, finger steaks, ice cream potato) on one side and a verse from the state song among huckleberry sprigs and Sawtooth Forest road signs on the other. The underside maps every way to dress a potato.',
    angleCaptions: {
      front: 'Idaho potatoes — Trader Joe’s U.S. No. 1 Certified, vintage sack style',
      back: 'The state seal — wildlife, a salmon, and "It’s pronounced BOY-SEE!"',
      left: 'Gem State menu — huckleberry pie, finger steaks, ice cream potato',
      right: 'Idaho state song verse — huckleberries, syringa, Sawtooth Forest road signs',
      bottom: 'The potato lookbook — wedges, crinkle fries, garlic fries, and friends',
    },
  },
  'il-chicago': {
    subtitle: 'The Windy City',
    blurb:
      'A vintage-newsprint tour of Chicago. The front pairs the city skyline with retro red lettering — "Your Neighborhood Grocery Store." The back drops into a Prohibition-era street scene with classic cars and 1920s figures. The side panels celebrate Chicago’s two great calling cards — Da Blues on one side, sausage and beer on the other — and the underside reads as a Trader Joe’s broadsheet, Est. 1967.',
    angleCaptions: {
      front: 'Chicago skyline + retro red lettering — "Your Neighborhood Grocery Store"',
      back: 'Prohibition-era street scene — vintage cars and 1920s figures',
      left: 'Trader Joe’s Cures Da Blues — Chicago’s musical patrimony',
      right: 'Chicago Style — sausage and beer',
      bottom: 'Trader Joe’s Est. 1967 — broadsheet newsprint',
    },
  },
  in: {
    subtitle: 'The Crossroads of America',
    blurb:
      'A five-panel Indiana road trip. The front races up with the Indy 500 — Trader Joe’s INDIANA over an open-wheel racer, with a verse from "On the Banks of the Wabash" and a quiet "is that a parking space?" aside. The back arranges peonies (the state flower) around a can of Joe’s Best Sweet Corn and a Hoagy Carmichael portrait. The side panels run from Hoosier basketball to a TJ Chocolate Egg Cream. The underside settles on a cardinal in a winter branch and Kurt Vonnegut’s three syllables: "So it goes."',
    angleCaptions: {
      front: 'Trader Joe’s INDIANA — the Indy 500 and "On the Banks of the Wabash"',
      back: 'Peonies (state flower), Joe’s Best Sweet Corn, and Hoagy Carmichael',
      left: 'Hoosiers — Indiana basketball with TJ on the ball',
      right: 'TJ Chocolate Egg Cream — striped straw and a frothy top',
      bottom: 'Cardinal on a winter branch — and Kurt Vonnegut’s "So it goes."',
    },
  },
  ky: {
    subtitle: 'the Bluegrass State',
    blurb:
      'A five-panel Kentucky day. The front pairs a Victorian fiddler with "Kentucky the Bluegrass State," the cardinal, and goldenrod. The back is Derby Day — "Off to the Races," horseshoes, mint juleps, and a horse politely requesting one. The side panels offer Joe’s Kentucky Hot Brown recipe on one side and a fancy-hatted derby crowd (rabbit jockey included) on the other. The underside racks a Trader Joe’s bourbon barrel — distilled in the state of bluegrass and bourbon both.',
    angleCaptions: {
      front: 'Kentucky the Bluegrass State — Victorian fiddler, cardinal, goldenrod',
      back: 'Off to the Races — Kentucky Derby with mint juleps and derby hats',
      left: 'Joe’s Kentucky Hot Brown — Louisville’s famous open-faced sandwich',
      right: 'The Derby crowd — fancy hats, rabbit jockey, and entry #67',
      bottom: 'Trader Joe’s bourbon barrel — distilled in the bluegrass',
    },
  },
  la: {
    subtitle: 'The Pelican State',
    blurb:
      'A five-panel Louisiana spread. The front centers Trader Joe’s LOUISIANA on Mardi Gras purple, with a brass tuba and a pile of crawfish. The back composes the Cajun-Creole holy trinity — bell pepper, onion, celery — as a celestial still life over a starlit bayou. The side panels run from Pelican State imagery (magnolia, football, the namesake bird) to a Fearless Flyer crawfish-boil spread with corn and lemon. The underside drifts through a bayou swamp with the "BAYOU STATE" boat moored among the moss-draped trees.',
    angleCaptions: {
      front: 'Trader Joe’s Louisiana — brass tuba, crawfish, and Mardi Gras purple',
      back: 'The Holy Trinity — bell pepper, onion, celery as a celestial still life',
      left: 'Pelican State — football, magnolia, and the state bird mid-catch',
      right: 'Fearless Flyer crawfish boil — crawfish, corn cobs, and lemon',
      bottom: 'BAYOU STATE — a boat moored in the moss-draped swamp',
    },
  },
  'ma-boston': {
    subtitle: 'Beantown',
    blurb:
      'A five-panel postcard from Boston. The front lays out the city skyline — Hancock Tower, Custom House Tower — with the famous rainbow T line snaking along the bottom. The back tilts into New England summer: a bicycle by a picket fence, a lobster escaping a barrel, corn on the ground, "Entering Trader Joe’s Est. 1967." The side panels run from a "Brie, Beer & football for Boston" trio to a Cape Cod harbor scene with sailboats and a lighthouse. The underside drops the address: traderjoes.com, Massachusetts.',
    angleCaptions: {
      front: 'Boston skyline — Hancock, Custom House, and the rainbow T line',
      back: 'New England summer — bicycle, picket fence, lobster, and corn',
      left: 'Brie, Beer & football for Boston — TJ’s Bs trio',
      right: 'Cape Cod harbor — sailboats, lighthouse, glass jug',
      bottom: 'Trader Joe’s Massachusetts — broadsheet bottom panel',
    },
  },
  md: {
    subtitle: 'Crab Country',
    blurb:
      'A five-panel Maryland map. The front pairs a black racehorse — "Did you bring the carrots?" — with a Baltimore Oriole and a halo of black-eyed Susans, the state flower. The back is the Maryland double act: Old Bay spice tins (mustard, paprika, celery seed, bay leaf, black pepper, the rest) over a blue crab on the table. The side panels offer a can of TJ’s whole-kernel corn and a hand-lettered Maryland Fried Chicken recipe with milk gravy. The underside flies the state flag — Calvert and Crossland coats of arms in checker and cross.',
    angleCaptions: {
      front: 'Trader Joe’s Maryland — racehorse, Baltimore Oriole, and black-eyed Susans',
      back: 'Old Bay + blue crab — Maryland’s defining flavor combination',
      left: 'Whole-kernel corn — black-eyed Susans around the can',
      right: 'Our Maryland Fried Chicken — recipe, milk gravy, red oven mitts',
      bottom: 'The Maryland state flag — Calvert and Crossland coats of arms',
    },
  },
  mi: {
    subtitle: 'the Great Lakes State',
    blurb:
      'A five-panel Michigan road trip. The front pairs "Michigan" in red brush lettering with a hand reaching down for cherries and blueberries — peak Up North fruit country. The back stitches together a roadside scene: a US 23 sign, a moose with a pasty-flour reminder, an owl asking "who?", and a vintage Model T. The side panels run a roll call of state nicknames — Mitten, Great Lakes, Wolverine, Motor City, Motown — and a Trader Joe’s Flour sack with another Model T. The underside lays down the state song: "A song to thee, fair State of mine, my Michigan."',
    angleCaptions: {
      front: 'Michigan in brush lettering — cherries and blueberries from Up North',
      back: 'Michigan roadside — moose with pasty flour, owl, Model T, M 43',
      left: 'Michigan nicknames roll call — Mitten, Great Lakes, Wolverine, Motor City, Motown',
      right: 'Trader Joe’s Flour and another Model T — Detroit roots',
      bottom: '"A song to thee, fair State of mine, my Michigan" — state song',
    },
  },
  mn: {
    subtitle: 'Land of 10,000 Lakes',
    blurb:
      'A five-panel Minnesota tour, summer through winter. The front sets the state motto — L’Étoile du Nord, "the Star of the North" — against a giant blue ox and a flurry of snowflakes. The back composes the state seal, a work boot, and a monarch butterfly with a verse from the state song. The side panels detour into the Minnesota State Fair (every food, fried) on one side and an ice-fishing "did you bring the hot dish?" tableau on the other. The underside is a state welcome can: "Come! Bring the family. Land of Ten Thousand Lakes."',
    angleCaptions: {
      front: 'L’Étoile du Nord — the Star of the North, a blue ox, and a snow flurry',
      back: 'State seal + work boot + monarch — Minnesota state-song verse below',
      left: 'Minnesota State Fair food — fried everything, and "It’s not soda. It’s pop."',
      right: 'Ice fishing + "Did you bring the hot dish?" — Minnesota winter pastimes',
      bottom: 'Minnesota welcomes you — Whole Kernel Corn meets the Land of 10,000 Lakes',
    },
  },
  mo: {
    subtitle: 'The Show-Me State',
    blurb:
      'A five-panel Missouri showcase. The front teaches you to square dance in jeans and a sundress — Forward and Back, Allemande Left, Promenade, Do-Si-Do — under MISSOURI in white block letters. The back tilts toward Branson, the "Live Entertainment Capital of the World," with cowboy hat, guitar, and theatrical curtains. The side panels offer a Busch Stadium hot-dog-and-baseball moment on one side and a glass pitcher of iced lemonade ("did you just put ice in the tea?") on the other. The underside lays out the recipe for Vanilla Bean Gooey Butter Cake — the St. Louis classic.',
    angleCaptions: {
      front: 'Missouri square dance — Forward and Back, Allemande Left, Promenade, Do-Si-Do',
      back: 'Branson — the Live Entertainment Capital of the World, cowboy hat and guitar',
      left: 'Busch Stadium — Cardinals baseball with hot dog and crown',
      right: 'Iced lemonade pitcher — "Did you just put ice in the tea?"',
      bottom: 'Vanilla Bean Gooey Butter Cake — Trader Joe’s recipe, St. Louis classic',
    },
  },
  nc: {
    subtitle: 'the Tar Heel State',
    blurb:
      'A five-panel North Carolina mix. The front pairs a colonial-era figure in a tricorne hat with a dogwood blossom — the state flower. The back chalks up a Carolina BBQ menu (sweet potatoes, coleslaw, hush puppies, cornbread, sweet tea, peach cobbler, banana pudding) over green-and-white gingham, with a bottle of TJ’s BBQ Sauce on flames. The side panels strum out a bluegrass banjo with a verse from "The Old North State" on one side, and a stretch of Outer Banks lighthouses with a wild horse on the other. The underside is a TAR HEELS license plate, stamped "First in Flight."',
    angleCaptions: {
      front: 'Colonial dogwood — the state flower in a tricorne hat',
      back: 'Carolina BBQ menu — sweet potatoes, coleslaw, hush puppies, sweet tea, TJ’s BBQ Sauce',
      left: 'Bluegrass banjo — a verse from "The Old North State," the state song',
      right: 'Outer Banks lighthouses — Cape Hatteras striped tower and a wild horse',
      bottom: 'NORTH CAROLINA · TAR HEELS · First in Flight — license plate',
    },
  },
  ne: {
    subtitle: 'The Cornhusker State',
    blurb:
      'A five-panel Nebraska prairie tour. The front rolls in with a vintage bicycle through goldenrod and corn under a NEBRASKA banner. The back is Nebraska’s gift to the calendar: Arbor Day, born here in 1872 — "Planting trees in kindness." The side panels stack NEBRASKA in block letters with goldenrod sprays on one side, and a hand-of-liberty rendering of the state motto, "Equality Before the Law," on the other. The underside dusts off a TJ Pony Express Fearless Flyer — Nebraska was the long middle of the line.',
    angleCaptions: {
      front: 'Trader Joe’s Nebraska — bicycle through goldenrod, corn, and prairie sky',
      back: 'Arbor Day — born in Nebraska, 1872, "Planting trees in kindness"',
      left: 'NEBRASKA in block letters — goldenrod, the state flower, in sprays',
      right: 'Equality Before the Law — Nebraska state motto, with sun rays and wheat',
      bottom: 'Trader Joe’s Pony Express — a Fearless Flyer tribute to the long middle of the line',
    },
  },
  nh: {
    subtitle: 'Live Free or Die',
    blurb:
      'A five-panel New Hampshire autumn. The front pairs a giant red apple with "New Hampshire" in script — peak orchard country. The back stands the state motto "Live Free or Die" against purple lilacs, the state flower. The side panels drift into fall foliage — maple leaves in every shade of red and orange on one side, a quieter autumn arrangement on the other. The underside is a recipe card "from the kitchen of Trader Joe’s" on a bed of fallen leaves.',
    angleCaptions: {
      front: 'New Hampshire apple — bright red and orchard-perfect',
      back: '"Live Free or Die" — the state motto with purple lilacs, the state flower',
      left: 'Fall foliage — maple leaves in every shade of New England autumn',
      right: 'Autumn arrangement — lilacs and falling leaves',
      bottom: 'Recipe from the kitchen of Trader Joe’s — autumn leaves underneath',
    },
  },
  nj: {
    subtitle: 'The Garden State',
    blurb:
      'A five-panel Jersey day trip. The front sends a postcard from the Shore — a "Greetings from" boardwalk with a roller coaster and bowling lanes. The back parks at a Jersey diner menu, late-night classics in diner type. The side panels carry "New Jersey" in red script on one side and TRADER JOE’S in stacked red block letters on the other. The underside marks the moment every Jersey trip really begins: TURNPIKE ENTRANCE, arrow east.',
    angleCaptions: {
      front: 'Greetings from the Jersey Shore — boardwalk roller coaster and bowling lanes',
      back: 'Jersey diner menu — late-night classics in diner type',
      left: 'New Jersey in red script — Garden State green',
      right: 'TRADER JOE’S stacked red — Jersey-style block letters',
      bottom: 'TURNPIKE ENTRANCE — every Jersey trip really begins here',
    },
  },
  nm: {
    subtitle: 'Land of Enchantment',
    blurb:
      'A five-panel New Mexico sunburst. The front pairs a hand holding a giant green chile — wrist wearing a TJ bracelet — with "New Mexico" in red script. The back floats up an Albuquerque-style hot-air balloon under "Land of Enchantment," flanked by two jars of TJ green chile sauce. The side panels run adobe pueblos with a Whole Kernel Corn can on one side and a ristra of red chiles with migrating monarchs on the other. The underside flies the New Mexico flag — the Zia sun in red on yellow.',
    angleCaptions: {
      front: 'New Mexico — a hand holding a green chile, TJ bracelet, red script',
      back: 'Land of Enchantment — Albuquerque hot-air balloon, green chile sauce jars',
      left: 'Whole Kernel Corn — adobe pueblos and yellow sun rays',
      right: 'Red chile ristra and monarch butterflies — Sonoran sun radiating',
      bottom: 'The New Mexico state flag — the Zia sun, red on yellow',
    },
  },
  nv: {
    subtitle: 'The Silver State',
    blurb:
      'A five-panel Nevada road trip. The front sets a TRADER JOE’S NEVADA scene — cyclist on a desert highway, longhorn skull, prickly pear, canyon walls. The back lights up Vegas: T.J. NEVADA in slot-machine font, 777 jackpot, cherries, dice, and 1967. The side panels split between an Old West cowboy and a roadrunner-meets-sagebrush vignette — two Nevadas in one bag. The underside posts the Area 51 sign: RESTRICTED AREA · NO TRESPASSING · PHOTOGRAPHY IS PROHIBITED, with a green friend peeking around the edge.',
    angleCaptions: {
      front: 'Trader Joe’s Nevada — cyclist on a desert highway, longhorn skull, prickly pear',
      back: 'Vegas neon — T.J. NEVADA, 777 jackpot, cherries, dice, 1967',
      left: 'Old West cowboy — right in the heart of the wild west',
      right: 'Roadrunner and red sagebrush blooms — desert wildlife',
      bottom: 'RESTRICTED AREA — Area 51 sign, photography prohibited (alien anyway)',
    },
  },
  'nv-poker-chips': {
    subtitle: 'Place Your Bets',
    blurb:
      'A loud, graphic Nevada bag built almost entirely from typography. The words NEVADA and TRADER JOE\'S overlap each other in red, yellow, blue, and black across both main panels, like a billboard caught mid-shuffle. The side panel switches gears into a tower of heart-stamped poker chips stacked floor-to-ceiling, the only literal Vegas wink on the whole bag.',
    angleCaptions: {
      front: 'NEVADA + TRADER JOE\'S overlapping in red, yellow, blue, and black',
      back: 'More stacked NEVADA + TJ\'s typography, the second main panel',
      right: 'A tower of heart-stamped poker chips down the side',
    },
  },
  ny: {
    subtitle: 'The Empire State',
    blurb:
      'A five-panel New York omnibus. The front layers NYC skyline silhouettes with a Magnolia-style cupcake, a wine bottle, and "I ♥ TJ’s" stickers. The back stands the Brooklyn Bridge against TRADER JOE’S in vertical green. The side panels pair the Queens Unisphere with a TJ elephant-and-peanuts vignette — two different state-fair Sundays. The underside lifts a Trader Joe’s parody of "The New Colossus" — "Give me your tasty, your scrumptious, your huddled mint and limb-craving to breathe free…"',
    angleCaptions: {
      front: 'NYC skyline + Magnolia-style cupcake + wine + "I ♥ TJ’s" stickers',
      back: 'Brooklyn Bridge + TRADER JOE’S in vertical green',
      left: 'The Queens Unisphere — 1964 World’s Fair globe + TJ',
      right: 'Elephant, Joe’s Peanuts, and a TJ baseball — state-fair Sunday',
      bottom: 'A Trader Joe’s "New Colossus" — "Give me your tasty, your scrumptious, your huddled mint…"',
    },
  },
  oh: {
    subtitle: 'the Buckeye State',
    blurb:
      'A five-panel Ohio mixtape. The front sets a Trader Joe’s UFO above an orchard of apples — Johnny Appleseed country with a wink. The back lifts a Wright Brothers airplane with athletes mid-motion — Ohio, the birthplace of aviation. The side panels stack OHIO in vertical letters with one cardinal on one side, and the rock-and-roll cardinal mid-strum on the other — "Let’s Rock," the Cleveland Rock and Roll Hall salute. The underside scripts "the Buckeye State" over buckeye nuts and leaves.',
    angleCaptions: {
      front: 'Trader Joe’s UFO over an apple orchard — Johnny Appleseed country with a twist',
      back: 'Wright Brothers airplane — Ohio, the birthplace of aviation',
      left: 'OHIO vertical — cardinal, the state bird, in red',
      right: 'Cardinal with a guitar — "Let’s Rock," the Cleveland Rock and Roll Hall salute',
      bottom: '"the Buckeye State" — buckeye nuts and leaves in script',
    },
  },
  ok: {
    subtitle: 'The Sooner State',
    blurb:
      'A five-panel Oklahoma trip. The front blooms with the Eastern Redbud — the state tree, adopted as a state emblem in 1937. The back lays out Oklahoma’s State Meal (yes, the state has one): fried okra, biscuits and gravy, sausage, grits, corn, strawberries. The side panels feature sunflowers and a "Sooner Suntan" on one side, and a geography lesson on the other — Oklahoma smack-dab between the Great Plains and the Ozark Plateau. The underside lands an airmail postcard fact: Oklahoma has the world’s longest continually-burning light bulbs.',
    angleCaptions: {
      front: 'Eastern Redbud — Oklahoma’s state tree, adopted 1937',
      back: 'Oklahoma’s State Meal — fried okra, biscuits and gravy, sausage, grits, corn, strawberries',
      left: 'Sunflowers + the Sooner Suntan',
      right: 'OKLAHOMA the Sooner State — smack dab between the Great Plains and the Ozark Plateau',
      bottom: 'Airmail-postcard state map: light bulbs, Black Mesa, the Ozarks, Sooners, and the Trail of Tears labeled across the state',
    },
  },
  'or-portland': {
    subtitle: 'Keep Portland Weird',
    blurb:
      'A five-panel Portland mixtape, soaked through with rain and indie irony. The front pairs PDX with a "Rain or Shine" walker under an umbrella. The back keeps it weird — punk-show flyers for KALE bands, "Live at the Canned Corn," a "Keep Portland Weird" sticker, the works. The side panels stack a rain boot and an OWL cinema poster on one side, and a fake show bill — "Druid Circles + Reduced Guilt LIVE at the Garden Patch" — on the other. The underside posts the night’s setlist, track listing in spinach hummus, granola, almonds, and truffle tots.',
    angleCaptions: {
      front: 'Rain or Shine — Portland walker, umbrella, PDX tag',
      back: 'Keep Portland Weird — KALE flyers, Live at the Canned Corn, sticker stack',
      left: 'Rain boot + TJ fence sign + an OWL cinema poster',
      right: 'Druid Circles + Reduced Guilt — Live at the Garden Patch (a Portland show bill)',
      bottom: 'The setlist — spinach hummus, granola, almonds, truffle tots, more',
    },
  },
  'pa-philadelphia': {
    subtitle: 'The City of Brotherly Love',
    blurb:
      'A five-panel Philadelphia roll call. The front stacks PhiLaDeLPhia in distorted red letters with the Liberty Bell hanging in. The back is a Philly icon grid — Betsy Ross flag, soft pretzel, eagle, fist, lightning bolt, owl, heart, more — all in red on kraft. The side panels rep Philly’s Boathouse Row regatta with stacked rowing oars on one side and Philly dialect on the other ("Jeet? Wanna grab a hoagie? Or maybe just some water ice?"). The underside lands the most Philly phrase ever: "ALLS I’M SAYIN…"',
    angleCaptions: {
      front: 'PhiLaDeLPhia stacked in red — Liberty Bell hanging in',
      back: 'Philly icon grid — Betsy Ross, pretzel, eagle, fist, lightning, owl, heart',
      left: 'Boathouse Row regatta — stacked rowing oars on the Schuylkill',
      right: 'Philly dialect — "Jeet? Wanna grab a hoagie? Or just some water ice?"',
      bottom: '"ALLS I’M SAYIN…" — Philadelphia’s most Philly phrase',
    },
  },
  ri: {
    subtitle: 'The Ocean State',
    blurb:
      'A five-panel sail through Rhode Island. The front frames Trader Joe’s between the Newport Pell Bridge, a striped lighthouse, and a sailboat — peak Ocean State waterfront. The back centers the Providence State House dome under a COFFEE MILK banner (yes, Rhode Island has an official state drink). The side panels carry Newport Gilded Age mansions with a Rhode Island Red rooster on one side, and a biplane-over-bridge scene on the other. The underside sails over Block Island.',
    angleCaptions: {
      front: 'Trader Joe’s on the Bay — Newport Pell Bridge, lighthouse, sailboat',
      back: 'Providence State House + Coffee Milk — Rhode Island’s official state drink',
      left: 'Newport Gilded Age mansion + lighthouse + Rhode Island Red rooster',
      right: 'Biplane, chicken, and a Rhode Island bridge',
      bottom: 'Block Island — a small sailboat off the coast',
    },
  },
  sc: {
    subtitle: 'The Palmetto State',
    blurb:
      'A five-panel South Carolina lowcountry tour. The front pours a Trader Joe’s cauldron full of Lowcountry-boil vegetables — corn, sausage, shrimp — under "South Carolina" in script on yellow gingham. The back gathers SC’s bounty: a hand holding a peach (the state is a top peach producer), a peach tree with cardinals, butterflies, and a hot-air balloon. The side panels mix coastal carnival — Ferris wheel, yellow Jessamine, palms — with a "Joe’s Hot Boiled Peanuts" panel, the state snack. The underside flies the South Carolina flag — white palmetto and crescent moon on indigo, with a sneaky little red shopping cart.',
    angleCaptions: {
      front: 'South Carolina script + a Trader Joe’s Lowcountry-boil cauldron, flames underneath',
      back: 'Peach harvest — a hand holding the state fruit, with cardinals, butterflies, and a balloon',
      left: 'Coastal carnival — Ferris wheel, yellow Jessamine, palm trees',
      right: 'Joe’s Hot Boiled Peanuts — South Carolina’s official state snack',
      bottom: 'The South Carolina flag — white palmetto and crescent moon on indigo',
    },
  },
  'tn-nashville': {
    subtitle: 'Music City',
    blurb:
      'A five-panel Nashville set. The front pulls TRADER JOE’S NASHVILLE under "Music City" with a fiddle, a banjo, and three stars. The back ruffles its feathers with a Nashville-hot-chicken rooster duo. The side panels stack Music Row / Circle / Square / Here / There with a Greek muse on one side, and the Nashville Parthenon on the other — where marble statues chat each other up in a full-scale replica. The underside dials in a vintage Grand Ole Opry-style radio.',
    angleCaptions: {
      front: 'Trader Joe’s Nashville — Music City, with fiddle, banjo, and three stars',
      back: 'Two roosters — Nashville hot chicken',
      left: 'Music Row, Music Circle, Music Square, Music Here, Music There — and Trader Joe’s',
      right: 'The Nashville Parthenon — marble statues chatting in a full-scale replica',
      bottom: 'Vintage Grand Ole Opry radio — Music City on the airwaves',
    },
  },
  tn: {
    subtitle: 'the Volunteer State',
    blurb:
      'A five-panel Tennessee tour from one end of the state to the other. The front pairs TRADER JOE’S TENNESSEE with a giant acoustic guitar under a "Volunteer State" banner, a State Route 840 shield, and a red trolley rolling across the foothills. The back drops into Memphis: a neon "Beale Street TRADER JOE’S" marquee glows above a heart-stamped guitar and a stiletto on the dance floor, with TENNESSEE in red script underneath. The side panels light up a vintage music-genre marquee — Country · Bluegrass · Rock and Roll · Rhythm and Gospel — on one side, and pour "Smooth as Tennessee Whiskey" from a barrel into a glass on the rocks on the other. The underside is a patchwork quilt: tri-star state flag, 1796 statehood, fiddle, mockingbird, and Route 840 all stitched in.',
    angleCaptions: {
      front: 'Trader Joe’s Tennessee — acoustic guitar, "Volunteer State," and a red trolley on State Route 840',
      back: 'Memphis Beale Street — neon marquee, heart-stamped guitar, and TENNESSEE in red script',
      left: 'The music marquee — Country · Bluegrass · Rock and Roll · Rhythm and Gospel',
      right: '"Smooth as Tennessee Whiskey" — barrel, spigot, and a glass on the rocks',
      bottom: 'Tennessee patchwork quilt — tri-star flag, 1796 statehood, fiddle, and Route 840',
    },
  },
  tx: {
    subtitle: 'The Lone Star State',
    blurb:
      'A five-panel Texas tour, big and proud. The front and back both stamp TRADER JOE’S TEXAS with a tooled cowboy boot, saddle, and ribbon banner — the panel is so good it gets used twice. The side panels feature a salute-and-butterfly tableau on one side and a rooster-and-tree scene on the other. The underside lassos a heart over Texas red — TRADER JOE’S roped in.',
    angleCaptions: {
      front: 'Trader Joe’s Texas — tooled cowboy boot, saddle, and ribbon banner',
      back: 'Trader Joe’s Texas — same panel as the front, twice the Texas',
      left: 'A saluting figure with butterflies + "Our Year Round" label',
      right: 'Rooster, tree, and sun on Texas red',
      bottom: 'TRADER JOE’S roped into a lasso heart — Texas red, wide bottom',
    },
  },
  ut: {
    subtitle: 'The Beehive State',
    blurb:
      'A five-panel Utah outdoors tour. The front frames Delicate Arch with UTAH in scattered red letters — Arches National Park, the Mighty Five anchor. The back swaps the arch for a giant T-Rex, because Utah’s dinosaur fossil record is unreal. The side panels chart a Great Salt Lake treasure map on one side and a hot-air balloon scene on the other. The underside gathers a canopy of colorful umbrellas — Utah arts open-air.',
    angleCaptions: {
      front: 'Delicate Arch + UTAH in scattered red — Arches National Park, the Mighty Five anchor',
      back: 'UTAH wrapped around a giant T-Rex — Utah’s deep dinosaur fossil record',
      left: 'Great Salt Lake treasure map — compass, anchor, sea creatures',
      right: 'Hot-air balloons rising — outdoor-festival Utah',
      bottom: 'A canopy of colorful umbrellas — outdoor art installation',
    },
  },
  va: {
    subtitle: 'Virginia is for Lovers',
    blurb:
      'A five-panel Virginia mashup. The front hangs a Virginia ham in burlap with a 1940s-style figure pointing and a Trader Joe’s Mustard jar standing by. The back parodies the state’s most famous slogan: "TRADER JOE’S is for LOVERS," painted as a Renaissance kiss. The side panels mix flowering dogwood (the state flower) with a quiet stone figure on one side, and an "I’m in the MOO’D for love" Whole Milk bottle on the other. The underside flies maritime signal flags with a pelican and a compass rose — Virginia’s Chesapeake naval heritage.',
    angleCaptions: {
      front: 'Virginia Ham — hanging in burlap with TJ Mustard and a 1940s lady',
      back: '"TRADER JOE’S is for LOVERS" — a Renaissance riff on "Virginia is for Lovers"',
      left: 'Flowering dogwood — Virginia’s state flower — and a quiet stone figure',
      right: '"I’m in the MOO’D for love" — TJ Whole Milk with a cow',
      bottom: 'Maritime signal flags + compass + pelican — Virginia’s Chesapeake heritage',
    },
  },
  wa: {
    subtitle: 'The Evergreen State',
    blurb:
      'A five-panel Washington state tour. The front pairs "Washington" in red script with the Space Needle, a lighthouse, and a compass — Seattle-Tacoma waypoints. The back drifts into the deep woods: "the Evergreen State" with a curious deer, pine cones, and evergreen sprigs. The side panels rise on a hot-air balloon over Mount Rainier and lean into Seattle coffee culture with a press pot and a "Buy local" nudge. The underside greets you "from WA — your neighborhood grocery store."',
    angleCaptions: {
      front: 'The Evergreen State — a curious deer in evergreen woods with pine cones',
      back: 'Buy local — Seattle coffee press, TJ’s neighborhood spirit',
      left: 'Hot-air balloon over Mount Rainier',
      right: 'Washington in red script — Space Needle, lighthouse, compass',
      bottom: 'Greetings from WA — TJ’s, your neighborhood grocery store',
    },
  },
  wi: {
    subtitle: 'America’s Dairyland',
    blurb:
      'A five-panel Wisconsin quilt. The front is a patchwork roll call — badger (the state animal), corn, canoe, evergreen, Milwaukee, the state outline. The back lays out a Wisconsin county fair: cheese cubes, brats, beer, a cow, fish, a Ferris wheel, a train. The side panels go full dairy — a red-and-white Holstein hide on one side, a brown-and-white one on the other — milk’s whole genetic spectrum. The underside stamps a STATE OF WISCONSIN approval certificate: Trader Joe’s, officially approved.',
    angleCaptions: {
      front: 'Wisconsin patchwork — badger, corn, canoe, evergreen, Milwaukee, state outline',
      back: 'The county fair — cheese, brats, beer, a cow, Ferris wheel, train',
      left: 'Red-and-white Holstein hide — Wisconsin’s other state flag',
      right: 'Brown-and-white Holstein hide — dairy’s full color range',
      bottom: 'STATE OF WISCONSIN · APPROVED — TJ’s officially certified',
    },
  },
  az: {
    subtitle: 'the Grand Canyon State',
    blurb:
      'A pan-Arizona panorama. The front blooms with citrus and a hummingbird; the back glows with a Sonoran sunset. The side panels run from a Mexican kitchen pantry to a hot-air balloon drifting over red-rock country — and the underside carries the state flag, copper star and all.',
    angleCaptions: {
      front: 'Sonoran citrus and a hummingbird — Arizona’s grove-and-garden side',
      back: 'Golden hour in the desert — Sonoran sunset',
      left: 'Refried pinto beans, jalapeño sauce, a Sonoran burrito',
      right: 'Hot-air balloon over red rocks — Sedona country',
      bottom: 'The Arizona state flag — 13 copper rays and a star for the Copper State',
    },
  },
  'az-sonoran-voyage': {
    subtitle: 'A Souvenir from the Sonoran',
    blurb:
      'An earlier Arizona print, framed like a vintage souvenir-ticket stub. A tall ship sails across a stylized red Sonoran landscape on the front, and a side panel runs the roster of Arizona Trader Joe\'s stores (Phoenix, Tempe, Tucson, Prescott Valley, Surprise).',
    angleCaptions: {
      front: 'A tall ship sailing across a stylized red Sonoran scene, stamped ADMIT ONE',
      left: 'Arizona Says: the roster of AZ store cities running down the side panel',
      bottom: 'Polypropylene underside, the bag\'s desert-red base',
    },
  },
  'coffee-jute': {
    subtitle: 'Pasadena, 1967',
    blurb:
      'A jute tote dressed up as a vintage coffee sack, and a quiet love letter to Trader Joe’s own origin story. The front and back are blocked out in brick-red and cream burlap panels, stenciled with "Coffee Beans, Product of Pasadena, Premium Roast, 1967." That’s the year Joe Coulombe opened the first Trader Joe’s on Arroyo Parkway in Pasadena, California, and ground coffee was one of the early specialty categories (alongside cheap European wine) that built the brand’s reputation. The side panels paint a coffee plant in fruit: glossy green leaves and ripening red cherries, hand-drawn on the natural jute.',
    angleCaptions: {
      front: 'Premium Roast, vintage coffee-sack styling stenciled on brick red',
      back: 'Trader Joe’s 1967, the year the first store opened in Pasadena',
      left: 'Coffee in fruit: glossy green leaves and ripening red cherries',
      right: 'The other side of the branch, the same plant mirrored',
      bottom: 'Looking in: the painted panels lining the interior',
    },
  },
  'jute': {
    subtitle: 'Just the Jute',
    blurb:
      'A back-to-basics jute tote, also sold online as the "Mini Jute Tote." The front carries the unadorned essentials: a small black "Trader Joe’s" circle stamp on natural burlap, with the tiny line "Stock Keeping Unit 39375" floating above it. Everything else is left as woven jute, framed in cream cotton banding at the top and bottom and finished with chunky braided rope handles. The back is bare; so is the inside, except for one more Trader Joe’s stamp tucked on the floor of the bag. The whole thing feels less like a themed souvenir and more like a back-of-house staple, the everyday companion for farmers markets, beach days, and picnic runs.',
    angleCaptions: {
      front: 'The Trader Joe’s circle stamp on natural burlap, with "Stock Keeping Unit 39375" in tiny type above',
      back: 'Bare burlap with cream banding, hangtag still attached',
      left: 'Side profile: plenty of depth for a small market run',
      right: 'The other side, also unembellished',
      bottom: 'A hidden Trader Joe’s stamp on the inside floor of the bag',
    },
  },
  'vegetable-jute': {
    subtitle: 'Garden Variety',
    blurb:
      'A spring release that turns the front and back into one continuous vegetable patch. Purple eggplants and beets, green pea pods, orange carrots and pumpkins, and pale onions sit shoulder to shoulder across natural jute, with no real foreground or background. The fun detail is the brand mark itself: in the lower-right corner of each face, a small purple eggplant silhouette doubles as a "Trader Joe’s" badge, the name written across the vegetable. The side panels show off the unbleached jute weave at full height, and the underside is left bare. The bag has since been discontinued, so it tends to surface secondhand around spring planting season.',
    angleCaptions: {
      front: 'An edge-to-edge medley of eggplants, beets, pea pods, carrots, and onions',
      back: 'The same vegetable patch, repeated on the reverse',
      left: 'A peek of the print as the jute side panel wraps around',
      right: 'The other side, mostly plain jute',
      bottom: 'Natural jute weave at the base, no print on the underside',
    },
  },
  'stock-keeping-unit': {
    subtitle: 'All the Breath and the Bloom',
    blurb:
      'A pocket-sized jute tote that turns itself into a museum label. The front carries a tight block of stamped text: "This is a bag.", "Trader Joe’s", "Stock Keeping Unit 95375", and the bag’s botanical credentials, Corchorus and Tiliaceae, the genus and family of the jute plant itself. The block closes with a winking line lifted from Robert Browning’s 1889 poem "Summum Bonum." The original reads, "All the breath and the bloom of the year in the bag of one bee," and Trader Joe’s quietly swaps "bee" for "bag," turning a love poem into a bag joke. Everything else stays bare: woven natural jute, cream cotton banding top and bottom, chunky white braided rope handles. The literary footnote is easy to miss unless you stop and read the front, which is exactly the point.',
    angleCaptions: {
      front: 'The full text block: "This is a bag.", Trader Joe’s, SKU 95375, the jute plant’s botanical credentials, and a winking line of Browning',
      back: 'Bare natural jute with cream banding and braided rope handles',
      left: 'Side profile, plain natural jute and cotton banding',
      right: 'The other side, just as quiet',
      bottom: 'Cream cotton banding wrapping under the bag',
    },
  },
  'reusable-breakfast': {
    subtitle: 'A Considerate Pancake With Pockets',
    blurb:
      'A breakfast-themed canvas tote built like a two-page entry from a Trader Joe’s-flavored dictionary. The front sets the table around a fat Belgian waffle, with a doodled coffee mug, bacon strips, a jar of JAM, a butter dish, a citrus slice, and a milk carton crowding in from the edges. Tucked into the upper corner is the definition itself: "waffle, noun [waf-fəl], a considerate pancake with pockets." The back flips to a toaster mid-pop, ringed by a fried egg, a banana, sliced bread, and a wedge of cheese, with its own entry: "toast, noun [tōst], a humble cousin to a tortilla." Bright yellow canvas body, candy-red handles. The dry-funny copy is pure Trader Joe’s Fearless Flyer, the print newsletter where every product gets its own small, deadpan-funny blurb.',
    angleCaptions: {
      front: 'Waffle side: "a considerate pancake with pockets," ringed by coffee, jam, bacon, and butter',
      back: 'Toast side: "a humble cousin to a tortilla," ringed by an egg, a banana, and bread',
    },
  },
  'pickle-cotton': {
    subtitle: 'Now Showing: Pickles',
    blurb:
      'A canvas tote dressed up as a vintage circus poster, with Trader Joe’s pickle department in the starring role. The front is laid out like a marquee for a feature presentation: "Trader Joe’s Presents PICKLES, in a shipping crate near you." A massive green dill stands at center, ringed by carnival-style call-outs about cheeseburgers and bread toppings, with the ticket price stamped at 99¢. Flip it and the back becomes the sequel poster, "Trader Joe’s Stories Presents PICKLE IN A JAR," in 70s funky lettering, with a giant pickle jar illustration and the warning "Guaranteed Sell Out, Come Early." Yellow canvas, candy-red handles, and a lot of love for what is arguably the most cult-followed item in the store.',
    angleCaptions: {
      front: '"Trader Joe’s Presents PICKLES," a vintage movie marquee for the deli-aisle main event',
      back: '"Pickle in a Jar," billed as the sequel: guaranteed sell out, come early',
    },
  },
  'sardine': {
    subtitle: 'Sardines on Toast',
    blurb:
      'A canvas tote built around Trader Joe’s sardine tin, with the canned-fish renaissance on full display. The front presents a hand-drawn label for "Trader Joe’s Sardines in Olive Oil," with a vintage tinned-fish illustration in the middle and little call-outs pointing to the sardine’s virtues, sodium-busting and heart-healthy among them. The back flips the program: a "Sardine Toast" recipe poster with dozens of silvery sardines radiating from a central Trader Joe’s badge like a fishmonger’s sunburst, and a sketched recipe block in the lower corner. Bright turquoise canvas, candy-red handles. The bag rides the tinned-fish trend that swept food media in the early 2020s, with Trader Joe’s olive-oil sardines (around $1.99 a tin) often cited as the affordable gateway to the category.',
    angleCaptions: {
      front: '"Sardines in Olive Oil," a vintage tin label with little call-outs for the fish’s nutritional virtues',
      back: '"Sardine Toast," a recipe poster with dozens of fish radiating in a sunburst around the Trader Joe’s badge',
    },
  },
  'cheese-adventure-canvas': {
    subtitle: 'From Cheeseboard to Cheeseburger',
    blurb:
      'A canvas tote built like a two-course cheese menu, with a different program on each side. The front, titled "Trader Joe’s Cheese Experience," runs through the slightly fancy end of the spectrum: quesadilla, patatas au gratin, cheese grits, mozzarella sticks. Hand-drawn ingredient call-outs ring the title, with a wedge of brie, a cheese grater mid-action, a fondue pot, a cheese ball, and a slice carrying a tiny "yes!" speech bubble. The back, titled "Cheese Adventures," carries the comfort-food cousins: grilled cheese, macaroni and cheese, cheeseburger, nachos, with a cheese block, a slicing tool labeled "Easy to slice. Better to eat," and a few more friendly speech bubbles. Red canvas, yellow handles, the cheese department’s whole reach captured on one bag.',
    angleCaptions: {
      front: '"Cheese Experience": quesadilla, patatas au gratin, cheese grits, and mozzarella sticks, with hand-drawn call-outs all around',
      back: '"Cheese Adventures": grilled cheese, mac and cheese, cheeseburger, and nachos, with a slicer labeled "Easy to slice. Better to eat"',
    },
  },
  'heritage': {
    subtitle: 'The Old Seal',
    blurb:
      'A pre-polypropylene Trader Joe’s tote, stamped edge to edge with the company’s old wreath seal in a quiet all-over print. The bag is constructed in heavy cotton canvas with simple self-fabric handles, the seal repeating across both faces and wrapping around the side panels like a Victorian wallpaper. Two colorways turn up most often secondhand: a cream-on-taupe Classic version and a rarer red one. Inside the red bag, the lining is a clean cream printed with the same seal motif, so the design quietly continues even when the tote is empty. These come from Trader Joe’s pre-2000s collectibles era, predating the now-ubiquitous polypropylene reusable bags, and they tend to surface on Poshmark and eBay as vintage finds rather than current inventory.',
    angleCaptions: {
      front: 'The all-over wreath-seal stamp, repeating across the front in cream on taupe',
      back: 'The print wrapping around the side and back without a single seam in the pattern',
      bottom: 'Inside the red variant: a cream lining printed with the same seal motif',
    },
  },
  'vintage-lady': {
    subtitle: 'All the Fruit on Her Hat',
    blurb:
      'A pre-polypropylene Trader Joe’s canvas tote in butter yellow, set off by magenta ribbon handles. Both faces star Edwardian-era figures from what reads like a turn-of-the-century fruit market. The front centers a young woman in an elaborate hat that is itself a fruit basket: cherries, pears, plums, and grapes piled high, with a fan tucked in her hand and a Trader Joe’s signboard tilted in beside her. The back continues the scene with a second figure cradling a paper-wrapped bouquet of fruit, the same shop banner anchored in the composition. The illustration style is straight out of a Belle Époque lithograph, and the bag itself is an early TJ collectible from the canvas era, well before the now-universal polypropylene shoppers.',
    angleCaptions: {
      front: 'An Edwardian woman in a fruit-piled hat, with a Trader Joe’s signboard tilted in beside her',
      back: 'A second figure cradling a paper-wrapped bouquet of fruit, the same shop banner in view',
    },
  },
  'vintage-produce': {
    subtitle: 'A Marker-Drawn Market',
    blurb:
      'A Made-in-USA cotton tote in natural cream, with kelly-green ribbon handles and a matching green base band, fronted by a riot of hand-drawn fruits and vegetables in thick marker strokes. Tomatoes, oranges, pears, eggplant, lemons, and cherries crowd the front around a red "Trader Joe’s" painted in script. The back continues the cast list with broccoli, watermelons, artichokes, bananas, mushrooms, carrots, and garlic, set against the same painted-banner Trader Joe’s; the print wraps continuously around the gusset onto the base. The whole thing reads like a farmstand chalkboard menu drawn by an enthusiastic art student, and like the rest of TJ’s early canvas pieces, it predates the polypropylene era and tends to surface secondhand.',
    angleCaptions: {
      front: 'Tomatoes, oranges, pears, eggplant, and cherries crowd the front around a painted Trader Joe’s script',
      back: 'Broccoli, watermelons, artichokes, and bananas continue the cast list on the reverse',
      bottom: 'The painted produce wraps around onto the green base band',
    },
  },
  'victorian-kitchen': {
    subtitle: 'An Engraved Pantry',
    blurb:
      'A vintage Trader Joe’s tote built like a page from a Victorian-era kitchen-supply catalog. The yellow canvas is printed edge to edge with engraving-style illustrations of late-1800s cookware: brass kettles, three-legged stoves, mortars and pestles, copper pans, eggbeaters, mason jars, packages of cocoa, and a half-dozen tiny "Trader Joe’s" labels tucked between them like archival stamps. The back continues the catalog with more of the same. The palette runs through sepia, gold, and faded red, the kind of ink colors you would find in an antique typesetter’s drawer. Another pre-polypropylene TJ collectible, often sold secondhand by listings that call it "Vintage Kitchen" or "Victorian Kitchen."',
    angleCaptions: {
      front: 'An engraved kitchen catalog in yellow: kettles, stoves, cocoa boxes, and tiny Trader Joe’s stamps tucked between',
      back: 'The catalog continues on the reverse, the same Victorian-era pantry tools repeating',
    },
  },
  'reusable-flower': {
    subtitle: 'Hawaiian Hibiscus, Retired',
    blurb:
      'A retired Trader Joe’s insulated tote in deep red and cream, banded across its lower half with white Hawaiian hibiscus flowers in tropical-shirt style. The front center carries the classic Trader Joe’s circle stamp, this version with an "ICE" tag at the bottom and a wine-bottle silhouette inside, marking it as one of TJ’s nylon-lined insulated cooler bags rather than a regular canvas shopper. Roughly 18 inches across, with short red carrying handles built for an easy in-and-out cooler trip rather than a full-day haul.\n\nThe bag has been out of production for years and tends to surface only secondhand on eBay, Mercari, and Poshmark, often listed under names like "Rare Retired TRADER JOE’S Hawaiian Hibiscus." It belongs to Trader Joe’s older Hawaiian-themed merchandise generation, a quiet nod to founder Joe Coulombe’s original South Seas trader concept, the same maritime thread that shows up in the anchor stamp on the 50th anniversary bag.',
    angleCaptions: {
      front: 'Red-and-cream nylon with white Hawaiian hibiscus, the Trader Joe\'s circle stamped with an "ICE" tag for the insulated lining',
      back: 'Same hibiscus print continues around to the reverse, short red handles for cooler-trip carrying',
    },
  },
  'mini-insulated': {
    subtitle: 'A Cooler in Miniature',
    blurb:
      'A lunch-sized insulated cooler tote, just bigger than a sandwich and a drink. Trader Joe’s runs this silhouette through frequent seasonal colorway capsules. Past releases include paired colorways like peach and blue, lavender and pink, red and emerald for the holidays, and teal and magenta. The Summer 2026 capsule, released May 20, 2026, shifted into solid colorways patterned with a hand-drawn Trader Joe’s storefront silhouette across the front and palm trees plus vintage VW vans rolling down the side panels. The release came in green, blue, purple, and orange at $3.99 each. Nylon body with a foil-lined interior and short cotton-strap handles, sized for a cooler trip but small enough to fit on a backpack hook.',
    angleCaptions: {
      front: 'The Trader Joe’s storefront silhouette across the front, palm trees framing the sign',
      back: 'The neighborhood from the other side, more palms and a Trader Joe’s Market awning',
      left: 'Side panel: palm trees and a vintage VW van rolling past',
      right: 'Other side: more palms, another VW van silhouette',
      bottom: 'Looking down: sky-blue cooler base with lime-green zipper trim',
    },
  },
  'classic-reusable': {
    subtitle: 'The OG',
    blurb:
      'Trader Joe’s full-size canvas grocery tote, the bag every other TJ canvas piece is a riff on. Heavy cream canvas body with contrast-colored handles and base banding, a deep front pocket, and the red Trader Joe’s circle stamp printed dead-center. Roomy enough for a real grocery run, not a tote-as-accessory the way the mini became.\n\nNavy has been the longtime ongoing colorway, the version most TJ regulars picture when they hear "Trader Joe’s tote." In 2026, Trader Joe’s ran two limited drops in the same silhouette: a green release and a lilac one (cream canvas with lilac handles and a pink TJ logo) that promptly sold out and triggered a smaller version of the mini-tote frenzy. The 2026 releases retailed around $3.99, in-store only, with stores limiting per-customer purchases.',
  },
  'mini-canvas': {
    subtitle: 'The Mini That Broke TikTok',
    blurb:
      'The tiny canvas tote that broke TikTok in March 2024. Trader Joe’s released the mini in four bright primary colors (red, yellow, green, blue) at $2.99 apiece, and within days a single viral video pulled in millions of views and turned every nearby TJ into a midweek mob scene. Bags sold out in minutes. Stores started limiting purchases per customer, and almost immediately the secondary market got out of hand: $2.99 totes were going for $50, then $100, then $200 on eBay and Depop, with one listing famously topping $900. Trader Joe’s publicly said the company does not condone reselling, but the genie was out of the bag.\n\nSince the original drop, TJ has run the mini through seasonal capsule colorways, a Fall 2024 Halloween set (orange, black, purple, and a multi-color holiday print) and a March 2026 spring pastel set (pink, lavender, mint green, baby blue), each of which has triggered the same buying frenzy on a smaller scale.\n\nThe bag itself is unfussy. Thick natural-canvas body with a colored print of the Trader Joe’s wordmark, a small "TJ\'s" badge, double cotton straps, sized at roughly 13 inches wide by 11 inches tall by 6 inches deep. The kind of object that absolutely should not be the most coveted thing in the store, which is exactly why it became the most coveted thing in the store.',
  },
  '50th-anniversary': {
    subtitle: 'He Doesn’t Look a Day Over 49',
    blurb:
      'A 2017 limited-edition shopper marking Trader Joe’s 50th birthday, and one of the most narrative bags the company has ever made. Every panel tells a small piece of TJ’s origin story.\n\nThe front recreates the original Trader Joe’s storefront in Pasadena, where Joe Coulombe opened the very first store in August 1967. A teal sky radiates white sun-rays out from a centerpiece can of "Trader Joe’s Specialty Foods Corn," floating mid-air like a setting sun. A red shopping cart sits unattended in front of the marquee, palm-tree silhouettes leaning in from the right.\n\nThe back becomes a kind of party scene. "Trader Joe’s 1967-2017 (And Beyond)" runs in bold marquee type along the side, set over a lime-green field with tropical leaves. Two cartoon-cutout crew members ("Joey" in a polka-dot blazer and "Josie" in a flared pantsuit, both wearing red Trader Joe’s name badges) stand together exchanging the bag’s punchline: "I can’t believe Joe is 50." / "He doesn’t look a day over 49."\n\nEach side panel hosts another Victorian-engraved crew member with their own red name badge. On the left, a mustachioed gentleman in a red suit holds up a Fearless Flyer (TJ’s longtime in-store newspaper) and offers "Thanks for listening!", framed above a tiny black-and-white illustration captioned "1st Trader Joe’s, Pasadena, CA, August 1967." On the right, a green-suited gentleman tips his hand toward a small ringing bell on a red curtain backdrop, a quip floating overhead.\n\nThe underside is a carnival-style banner reading "Trader Joe’s Made in 1967" around a small anchor, a quiet nod to founder Joe Coulombe’s original South Seas trader theme. The bag sold for a short window in 2017 and now turns up secondhand as a genuinely sought-after collectible.',
    angleCaptions: {
      front: 'The original Pasadena storefront under a teal sky, with a can of Trader Joe’s Specialty Foods Corn floating overhead as the sun',
      back: '"Trader Joe’s 1967-2017 (And Beyond)": crew members Joey and Josie exchange the bag’s punchline, "I can’t believe Joe is 50." / "He doesn’t look a day over 49."',
      left: 'A mustachioed crew member in a red suit holds a Fearless Flyer, captioned "Thanks for listening!", above a tiny tag reading "1st Trader Joe’s, Pasadena, CA, August 1967"',
      right: 'A green-suited crew member tipping his hand to a small ringing bell on a red curtained backdrop, a quip overhead',
      bottom: '"Trader Joe’s Made in 1967," stamped carnival-style around a maritime anchor',
    },
  },
  'chicken-citrus': {
    subtitle: 'From the Frozen Aisle',
    blurb:
      'A bright purple-and-yellow polypropylene shopper built around Trader Joe’s single most cult-followed frozen product: Mandarin Orange Chicken. The front blares a giant orange-and-yellow rooster on a deep purple field, with "Trader Joe’s" stamped into its body like a vintage Chinese seal and the characters 橙色鸡 (orange chicken) underneath. The back continues the rooster theme with two chickens standing nose-to-orange, the citrus of their dreams hovering above them in a Trader Joe’s thought bubble. The side panels carry crossed chopsticks and orange slices on yellow, and the underside is one giant cross-section of orange on a field of repeating Chinese type. Mandarin Orange Chicken first hit Trader Joe’s freezers in 2004 after an anonymous chef pitched the recipe to the company’s tasting panel, and it has dominated the Customer Choice Awards every year since 2017, the year it dethroned Cookie Butter as Favorite Overall.',
    angleCaptions: {
      front: 'A giant orange-and-yellow rooster on deep purple, with 橙色鸡 (orange chicken) stamped underneath',
      back: 'Two chickens nose to orange, the citrus of their dreams hovering in a Trader Joe’s thought bubble',
      left: 'Crossed chopsticks and an orange slice on yellow, the side-panel place setting',
      right: 'The matching panel, same chopsticks-and-citrus motif',
      bottom: 'A cross-section of orange on a field of repeating Chinese type',
    },
  },
  'perky-and-uni-corny': {
    subtitle: 'Pursued with Forks & Hope',
    blurb:
      'A polypropylene 6-gallon shopper starring two named TJ mascots and a scattering of literary food jokes. The front is "perky.", a yellow owl in a pink top hat perched on a pink Trader Joe\'s kettle. The back is "uni-corny.", a yellow chef-hatted unicorn rearing up with a CORNY can hoisted overhead, while a tiny top-hatted Perky watches from the corner. The side panels go full Victorian aphorism: a teal silver-spoon trophy with the Emerson line "let us count our spoons.", and a giant blue fork beside a frock-coated gentleman captioned "pursued with forks & hope." (from Lewis Carroll\'s Hunting of the Snark). The underside lays a potato and a tomato side by side under the deadpan line "fries with catsup."',
    angleCaptions: {
      front: '"perky." — a yellow top-hatted owl perched on a pink Trader Joe\'s kettle',
      back: '"uni-corny." — a chef-hatted unicorn rearing with a CORNY can, Perky watching from the corner',
      left: '"let us count our spoons." — a Victorian portrait beneath a silver-spoon trophy (Emerson)',
      right: '"pursued with forks & hope." — a frock-coated gentleman beside a giant blue fork (Lewis Carroll, Hunting of the Snark)',
      bottom: '"fries with catsup." — a potato and a tomato laid side by side on the underside',
    },
  },
  'moon': {
    subtitle: 'Happy New Year, 2016',
    blurb:
      'Trader Joe\'s 2016 New Year special, with two moons (one for each side). The front carries a silver-white moon with an awake, quietly smiling face, "TRADER JOE\'S" curving up its left edge over a cream Old World streetscape of Parisian rooftops, a pineapple-shaped tree, and a river running across the foreground. Flip it and the moon is asleep, a big yellow face with closed eyes floating over the same cityscape redrawn in pale teal, with a hand on the right raising a champagne flute to ring in the new year. The side panels wrap in a lilac wash past Victorian apartment facades: one carries a green-sleeved arm passing a "HAPPY NEW YEAR" envelope through a window, the other a scribbled "HAPPY" overhead. The underside finishes with a distressed "2016 / TRADER JOE\'S" stamp in faded cream, like the date on a champagne cork.',
    angleCaptions: {
      front: 'A silver-white moon, awake and quietly smiling, floats over a cream Old World streetscape with a trumpet-player on the corner and a river reflecting the buildings back',
      back: 'Flip side: a big yellow moon sleeps over the same cityscape redrawn in pale teal, a champagne flute raised in toast on the right',
      left: 'A Parisian apartment facade in lilac wash, a green-sleeved arm passing a "HAPPY NEW YEAR" envelope through one of the windows',
      right: 'The other side of the street, a second Victorian facade with "HAPPY" scribbled overhead in script',
      bottom: '"2016 / Trader Joe\'s" stamped in distressed cream lettering, like the date on a champagne cork',
    },
  },
  'home-cooking-with-joe': {
    subtitle: 'Portraits from the Pantry',
    blurb:
      'A canvas-textured reusable shopper that doubles as a Trader Joe’s family album, rendered in the high-Victorian engraving style of an 1880s pharmacy catalog. The front and back each feature a different "crew member" portrait, both wearing red Trader Joe’s name badges: Jolene with a flower in her hair and a black-ribbon choker, and Joni with her hair pinned up over a green Sunday blouse. The side panels turn over to two more crew in the same style, a bearded gentleman and a chef in his work cap, all four framed by botanical illustrations and scraps of handwritten letters. The underside finishes with an antique salt-and-pepper-shaker etching and a stanza from Jonathan Swift’s poem "Mutton," the kind of literary footnote Trader Joe’s loves to bury in its merch. "Crew member" is what Trader Joe’s officially calls its employees, a maritime holdover from founder Joe Coulombe’s original South Seas trader theme.',
    angleCaptions: {
      front: 'Jolene: a young woman with a flower in her hair and a black-ribbon choker, name badge pinned to her dress',
      back: 'Joni: hair pinned up over a green Sunday blouse, another red Trader Joe’s name badge in place',
      left: 'A bearded crew member in profile, framed by grape clusters and a handwritten letter',
      right: 'A chef in his work cap, another engraved portrait surrounded by herbs and notes',
      bottom: 'A salt-and-pepper-shaker etching with a stanza from Jonathan Swift’s "Mutton"',
    },
  },
  'citrus-jute': {
    subtitle: 'Rind to Rind',
    blurb:
      'A burlap citrus carrier in two colorways at once. The front centers a fat golden lemon on natural jute, ringed by retro splashes and a tiny lemon-wheel slice, with "Trader Joe’s" looping across the rind in green banner script. Flip it and the back becomes the lime version of the same composition: green pulp, green splashes, a lime wheel tucked into the corner. The side panels carry the slogans in groovy bubble type, "So Fresh & So Zesty" on the lemon side and "So Bright & So Tart" on the lime side. The 1970s grocery-sack styling is no accident; Trader Joe’s grew up alongside California’s citrus belt, and a generously stocked produce wall remains one of the chain’s loudest aesthetic signatures.',
    angleCaptions: {
      front: 'Lemon side: a fat golden citrus on jute, with Trader Joe’s in green banner script',
      back: 'Lime side: the same composition rendered in green',
      left: 'So Fresh & So Zesty, groovy bubble type on the lemon panel',
      right: 'So Bright & So Tart, the matching slogan on the lime panel',
      bottom: 'Plain jute weave at the base, no print on the underside',
    },
  },
  'corn-can': {
    subtitle: 'Naturally Sweet & Crisp',
    blurb:
      'A yellow polypropylene shopper printed to look like an oversized can of Trader Joe’s Whole Kernel Corn, top to bottom. The front mimics the canned-goods label with the product name in white block type, the small print "Naturally Sweet & Crisp, No Sugar Added, No Preservatives," and a NET WT block at the base. The back becomes the rear of the same can: a barcode panel on one side, a nutrition-style ingredients block beside it, and a hand-drawn green corn stalk running up the right edge. Even the side panels stay in character, each carrying a vintage manual can opener silhouetted against the can-lid concentric rings. The underside finishes the joke with a small printed label reading "Ingredients: corn, water, salt." and the distributor line "Dist. & Sold Exclusively By: Trader Joe’s, Monrovia, CA 91016," the address of Trader Joe’s actual corporate headquarters.',
    angleCaptions: {
      front: 'Trader Joe’s Whole Kernel Corn: the front of the can, "Naturally Sweet & Crisp, No Sugar Added, No Preservatives"',
      back: 'The back of the can: barcode and ingredients block, a green corn stalk running up the side',
      left: 'A vintage manual can opener silhouetted against the yellow can-lid rings',
      right: 'The opener on the other side, still mid-twist',
      bottom: '"Ingredients: corn, water, salt." Distributed by Trader Joe’s, Monrovia, CA 91016, the company’s corporate address',
    },
  },
  'flower-shop': {
    subtitle: 'Fresh Cut, Five Sides',
    blurb:
      'A five-panel floral arrangement themed around the Trader Joe\'s in-store Flower Shop. The front is the FLOWER SHOP wordmark in red on a black panel, surrounded by a graphic-illustration garden on deep purple ground: peony, larkspur, hydrangea, red tulips, and a galvanized tin bucket signed off with a ladybug. The back swaps to painterly teal and centers a fat pink peony in a metal tub, with bees, lilacs, baby\'s breath, gerbera daisies, and cream roses crowding the frame. The side panels go navy, one with chrysanthemums and snapdragons, the other with yellow daffodils and red tulips. The underside finishes with a vintage TRADER JOE\'S SUNFLOWERS seed-packet label running across the bottom.',
    angleCaptions: {
      front: 'FLOWER SHOP wordmark on purple, surrounded by peony, larkspur, hydrangea, tulips, and a galvanized bucket (ladybug included)',
      back: 'Painterly pink peony in a galvanized tub on teal, with bees, lilacs, baby\'s breath, gerbera, and cream roses',
      left: 'Side panel on navy: chrysanthemums and snapdragons',
      right: 'Side panel on navy: yellow daffodils and red tulips',
      bottom: 'TRADER JOE\'S SUNFLOWERS, a vintage seed-packet label across the underside',
    },
  },
  'new-recruit': {
    subtitle: 'Welcome to the Crew',
    blurb:
      'A polypropylene welcome bag pressed into new Trader Joe’s hires on day one, not stocked on shelves. The front rallies a crowd of crew silhouettes around a single highlighted Hawaiian shirt printed with "Trader Joe’s Crew Member," marking the moment someone joins the lineup. The back stretches a yellow United States map across the panel while a small crew member squints through a telescope, captioned "I see more stores on the horizon!" The bag belongs to the same family as the Crew Member Portrait tote, a quiet internal-merch tradition built around the chain’s maritime-themed staff vocabulary.',
    angleCaptions: {
      front: 'Trader Joe’s Newest Recruit: a crowd of crew silhouettes around the day-one Hawaiian shirt',
      back: '"I see more stores on the horizon!" telescope across a yellow US map',
    },
  },
  'surfboard': {
    subtitle: 'Boards in the Sand',
    blurb:
      'A polypropylene shopping bag turned into a one-bag beach vacation. Both faces stage the same scene: a deep purple-pink sunset sky, palm-tree silhouettes leaning in, and three surfboards planted in golden sand, each painted with a chunk of the brand name so the row spells "Trader Joe’s" across the boards. A circular wood-grain medallion stamped "Trader Joe’s" in red ink anchors the upper sky like a vintage Hawaiian-souvenir patch. The front leaves a red beach ball at the water’s edge; the back rolls a pair of coconuts across the sand instead. The side panels continue the scene as a wraparound diorama, one a quiet stretch of palms with a hammock strung between two trees, the other a stack of boards with snippets of "BEACH" and "JUS" peeking through. The underside finishes the joke by rendering the bag itself as the bottom of a surfboard: tan wood-grain ripples stamped "WWW.TRADERJOES.COM" in red across the curve.',
    angleCaptions: {
      front: 'Three surfboards planted in the sand spelling Trader Joe\'s, a red beach ball at the water\'s edge, the medallion seal anchoring the sunset sky',
      back: 'The same beach turned around: more surfboards, a pair of coconuts rolling across the sand',
      left: 'A quiet side-panel beach: palms leaning in, a hammock strung between two trees',
      right: 'The other side of the surf shop, boards leaning back-to-back with "BEACH" and "JUS" peeking through',
      bottom: 'Tan wood-grain ripples like the underside of a surfboard, stamped "WWW.TRADERJOES.COM"',
    },
  },
  'nocturne': {
    subtitle: 'Open Late',
    blurb:
      'A polypropylene shopper that turns Trader Joe’s into a city after dark. The dark navy field reads at first as a downtown skyline, gold-lit buildings rising against the night sky with a yellow moon overhead and an elevated train running across the lower edge. On closer look, each tower is actually a row of supermarket shelves, with product names ("CORN" in red label type, and others) lit up like apartment windows, the late-night shopper just another commuter heading home via the night train. The side panels pull the camera up overhead, looking down at an empty parking lot: tidy rows of shopping carts in cream wireframe against the same midnight navy. The underside flickers with the late-night signage itself, "TJ’s Shop" in big gold letters under a row of streetlamps.',
    angleCaptions: {
      front: 'A gold-lit grocery-shelf skyline, the night train running along the lower edge with the moon hanging overhead',
      back: 'The other side of the city: a wider moon, the train mid-arrival, a CORN shelf-tower catching the light',
      left: 'Looking down at the parking lot, tidy rows of empty shopping carts in cream wireframe',
      right: 'The same overhead view from the other side, the cart grid continuing in formation',
      bottom: '"TJ\'s Shop" in gold under a row of streetlamps, a sliver of red product label peeking in from the side',
    },
  },
  'recycled-ocean-plastic': {
    subtitle: 'Made From the Sea',
    blurb:
      'A polypropylene shopper printed edge to edge as a panoramic ocean scene, and quietly self-aware: the underside spells out, in block letters, that the bag itself is made from plastic collected from marine and coastal environments. The front sits at the waterline, a school of dark fish around a single orange clownfish above, and below the surface an old brass-helmeted deep-sea diver standing on the ocean floor with three seahorses curling past on the right. The back drifts deeper: pale moon jellyfish on the left, an old diesel submarine through the center carrying a small "Recycled Ocean Plastic Bag" stamp like a buoy, an octopus unfurling across the right. The side panels turn into tall kelp forests, each with a small white paper sailboat at the surface, the bag\'s only sign of land.',
    angleCaptions: {
      front: 'At the waterline: a school of dark fish around a single orange clownfish above, a brass-helmeted deep-sea diver and three seahorses below',
      back: 'Deeper down: pale jellyfish trailing on the left, an old diesel submarine cutting through the center, an octopus unfurling on the right',
      left: 'A tall kelp forest in profile, a small paper sailboat floating at the surface',
      right: 'The other side, more kelp and another paper sailboat, the bag\'s only sign of land',
      bottom: 'A debris-patterned navy panel with the manufacturing claim printed in cream block letters: "This bag is made entirely from recycled plastic collected from marine and coastal environments"',
    },
  },
  'comfort-food': {
    subtitle: 'A Pairing Per Panel',
    blurb:
      'A polypropylene 6-gallon shopper that treats every face of the bag as its own diner-menu placard, each one bannering a different comfort-food pairing in chunky cursive. The front is "Mac & Cheese" on mustard yellow, ringed by an elbow noodle, a wedge of cheese, a grater, and a cheese wheel. The back flips into deep purple for "PB & Jam," a Trader Joe\'s peanut butter jar at center surrounded by grapes, a strawberry, a peanut, and a fruit-pastry icon. The side panels run on golden yellow: "Ketchup & Fries" with a Trader Joe\'s ketchup bottle, two tomatoes, and a fry box on one side, "Bacon & Eggs" with sunny-side-ups, bacon strips, and a hardboiled egg on the other. The underside finishes on chocolate brown with "Milk & Cookies," a milk carton beside a chocolate chip cookie. Deep purple trim and handles tie all five backgrounds together. A regular in-store polypropylene shopper at roughly 99¢, less a special edition than a quietly fun standby in the rack by the registers.',
    angleCaptions: {
      front: '"Mac & Cheese" on mustard yellow: an elbow noodle, a wedge of cheese, a grater, and a cheese wheel',
      back: '"PB & Jam" on deep purple: a Trader Joe\'s peanut butter jar surrounded by grapes, a strawberry, a peanut, and a fruit-pastry icon',
      left: '"Ketchup & Fries" on golden yellow: a Trader Joe\'s ketchup bottle, two tomatoes, and a box of fries',
      right: '"Bacon & Eggs" on golden yellow: sunny-side-up eggs, bacon strips, and a hardboiled egg',
      bottom: '"Milk & Cookies" on chocolate brown: a milk carton beside a chocolate chip cookie',
    },
  },
  'george-washington-peanuts': {
    subtitle: 'The Peanut Bag',
    blurb:
      'A 6-gallon polypropylene shopper that turns each panel into a different page from Trader Joe\'s peanut catalog, with a tip of the hat to George Washington Carver. The front banners "GET \'YER PEANUTS HERE!" in cream over an orange peanut polka-dot, a split peanut showing two halves. The back is a purple speech bubble: "George Washington Carver is the man!" The side panels carry vintage labels for two TJ peanut products: "Truly Old Fashioned Peanut Butter" on lilac and "Dark Chocolate Peanut Butter Cups" on navy. The underside finishes brown with "Pre-Posterously Good Peanut Butter Cup Cookies."',
    angleCaptions: {
      front: '"GET \'YER PEANUTS HERE!" in cream over an orange peanut polka-dot, a split peanut up top showing two halves',
      back: 'A purple speech bubble floats above the peanut: "George Washington Carver is the man!"',
      left: 'A vintage label for "Truly Old Fashioned Peanut Butter" on lilac, framed in a pink ribbon',
      right: 'A vintage label for "Dark Chocolate Peanut Butter Cups" on navy with brown peanut polka-dot',
      bottom: 'A third label, "Pre-Posterously Good Peanut Butter Cup Cookies," stamped across brown kraft',
    },
  },
  'fearless-flyer': {
    subtitle: 'The Bag Is the Newsletter',
    blurb:
      'A 2025 6-gallon polypropylene shopper that turns itself into a page from the Fearless Flyer, Trader Joe\'s in-store newsletter. The front is a torn-paper collage on cream newsprint: cut-out "TRADER JOE\'S FEARLESS FLYER" letters over a bearded Victorian portrait, a pear, berries, and a watermelon slice. The back continues with a red "Fearless Flyer" banner, a covered platter lifted mid-flourish, a pickle ribbon, and a Victorian lady reading. Side panels run teal with faint repeating newsprint. The underside is a fake Fearless Flyer article titled "Reusable Grocery Bag" describing the bag itself.',
    angleCaptions: {
      front: 'Torn-paper collage on cream newsprint: cut-out "TRADER JOE\'S FEARLESS FLYER" letters over a bearded Victorian portrait, a pear, berries, and a watermelon slice',
      back: 'A red "Fearless Flyer" banner over a chef\'s covered serving platter, a pickle ribbon, and a Victorian lady reading',
      left: 'A teal side panel patterned with faint repeating newsprint type, the bag\'s quiet margin',
      right: 'The other teal panel, more repeating newsprint type',
      bottom: 'The punchline: a fake Fearless Flyer article titled "Reusable Grocery Bag" describes the bag itself in red column type',
    },
  },
  'ship': {
    subtitle: 'Watercolor Voyage',
    blurb:
      'A maritime 6-gallon polypropylene shopper, cataloged secondhand as "Ship (or Water)." The front layers vintage engravings over watercolor wash: a tall sailing ship on the left, a hot-air balloon and a crescent moon wearing a crown overhead, a sun, a swallow in flight, and a Trader Joe\'s banner at the foot. The back goes cartographic with a North/South America map, a red crab on the wave, a ship-in-a-bottle, a tall pineapple, and two globe medallions at the bottom. Side panels run turquoise watercolor, one with a small black bird on the wave. Mermaid-scale waves run across the lower edge of every panel.',
    angleCaptions: {
      front: 'A tall sailing ship at left, a hot-air balloon and a crowned crescent moon overhead, a sun with rays, a swallow in flight, and a Trader Joe\'s banner at the foot',
      back: 'A North/South America map in pale green, a red crab perched on the wave, a ship-in-a-bottle on the left, a tall pineapple on the right, two globe medallions at the bottom',
      left: 'A turquoise watercolor side panel, a small black bird standing on the mermaid-scale wave',
      right: 'The other side, bare turquoise watercolor over the same mermaid-scale wave',
      bottom: 'A teal watercolor underside finished with a small manufacturer ticket sewn into the seam',
    },
  },
}
