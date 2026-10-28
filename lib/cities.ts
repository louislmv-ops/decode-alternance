// Les plus grandes villes de France et leur département, pour placer une offre qui ne donne que la ville
// (« Lyon », « Boulogne-Billancourt ») : les flux des logiciels de recrutement et des agrégateurs le font souvent.

export const CITY_DEPARTMENTS: Record<string, string> = {
  paris: '75', marseille: '13', lyon: '69', toulouse: '31', nice: '06', nantes: '44', montpellier: '34', strasbourg: '67',
  bordeaux: '33', lille: '59', rennes: '35', reims: '51', toulon: '83', 'saint etienne': '42', 'le havre': '76', grenoble: '38',
  dijon: '21', angers: '49', nimes: '30', villeurbanne: '69', 'clermont ferrand': '63', 'le mans': '72', 'aix en provence': '13',
  brest: '29', tours: '37', amiens: '80', limoges: '87', annecy: '74', perpignan: '66', 'boulogne billancourt': '92', metz: '57',
  besancon: '25', orleans: '45', 'saint denis': '93', argenteuil: '95', rouen: '76', mulhouse: '68', montreuil: '93', caen: '14',
  nancy: '54', 'saint paul': '974', roubaix: '59', tourcoing: '59', nanterre: '92', vitry: '94', 'vitry sur seine': '94', avignon: '84',
  creteil: '94', poitiers: '86', dunkerque: '59', aubervilliers: '93', versailles: '78', 'aulnay sous bois': '93', colombes: '92',
  pau: '64', courbevoie: '92', 'la defense': '92', puteaux: '92', 'issy les moulineaux': '92', 'levallois perret': '92',
  'neuilly sur seine': '92', 'rueil malmaison': '92', 'saint cloud': '92', montrouge: '92', clichy: '92', 'asnieres sur seine': '92',
  'saint ouen': '93', 'saint ouen sur seine': '93', pantin: '93', 'noisy le grand': '93', 'cergy': '95', 'cergy pontoise': '95',
  'saint quentin en yvelines': '78', guyancourt: '78', velizy: '78', 'velizy villacoublay': '78', massy: '91', evry: '91',
  'evry courcouronnes': '91', saclay: '91', palaiseau: '91', 'marne la vallee': '77', 'champs sur marne': '77', meaux: '77',
  melun: '77', ivry: '94', 'ivry sur seine': '94', rungis: '94', 'la rochelle': '17', calais: '62', 'cannes': '06', antibes: '06',
  'sophia antipolis': '06', valence: '26', ajaccio: '2A', bastia: '2B', quimper: '29', lorient: '56', vannes: '56', 'saint nazaire': '44',
  'saint malo': '35', laval: '53', cholet: '49', niort: '79', 'la roche sur yon': '85', angouleme: '16', bayonne: '64', biarritz: '64',
  troyes: '10', chartres: '28', beauvais: '60', compiegne: '60', 'saint quentin': '02', arras: '62', lens: '62', douai: '59',
  valenciennes: '59', 'villeneuve d ascq': '59', colmar: '68', belfort: '90', chambery: '73', 'bourg en bresse': '01', macon: '71',
  chalon: '71', 'chalon sur saone': '71', auxerre: '89', nevers: '58', bourges: '18', blois: '41', chateauroux: '36', vichy: '03',
  montlucon: '03', 'le puy en velay': '43', aurillac: '15', rodez: '12', albi: '81', montauban: '82', agen: '47', perigueux: '24',
  'brive la gaillarde': '19', tarbes: '65', carcassonne: '11', narbonne: '11', beziers: '34', sete: '34', ales: '30', arles: '13',
  'salon de provence': '13', aubagne: '13', 'la ciotat': '13', 'frejus': '83', 'hyeres': '83', gap: '05', digne: '04',
  'saint brieuc': '22', cherbourg: '50', 'saint lo': '50', alencon: '61', evreux: '27', 'fort de france': '972',
  'pointe a pitre': '971', cayenne: '973', 'saint pierre': '974', mamoudzou: '976',
};
