export interface Theme {
  id: string
  name: string
  words: string[]
}

// Mots écrits avec leurs accents pour l'affichage ; ils sont normalisés (majuscules sans accents) dans la grille.
export const THEMES: Theme[] = [
  {
    id: 'animaux',
    name: 'Animaux',
    words: [
      'chat', 'chien', 'lapin', 'cheval', 'vache', 'mouton', 'chèvre', 'cochon', 'poule', 'canard', 'renard', 'loup',
      'ours', 'tigre', 'lion', 'zèbre', 'girafe', 'éléphant', 'singe', 'panda', 'koala', 'kangourou', 'castor',
      'hérisson', 'écureuil', 'blaireau', 'belette', 'loutre', 'phoque', 'baleine', 'dauphin', 'requin', 'pieuvre',
      'méduse', 'crabe', 'homard', 'tortue', 'lézard', 'serpent', 'crocodile', 'grenouille', 'hibou', 'chouette',
      'aigle', 'faucon', 'corbeau', 'moineau', 'pigeon', 'mouette', 'pingouin', 'autruche', 'flamant', 'perroquet',
      'abeille', 'fourmi', 'papillon', 'coccinelle', 'souris', 'taupe', 'cerf', 'biche', 'sanglier', 'chameau', 'lama',
      'rhinocéros', 'gorille', 'jaguar', 'panthère', 'guépard', 'lynx', 'bison', 'yak', 'gazelle', 'antilope',
    ],
  },
  {
    id: 'fruits-legumes',
    name: 'Fruits et légumes',
    words: [
      'pomme', 'poire', 'cerise', 'fraise', 'framboise', 'myrtille', 'groseille', 'cassis', 'abricot', 'pêche', 'prune',
      'mirabelle', 'raisin', 'figue', 'melon', 'pastèque', 'ananas', 'banane', 'mangue', 'kiwi', 'citron', 'orange',
      'clémentine', 'pamplemousse', 'grenade', 'litchi', 'papaye', 'goyave', 'datte', 'noix', 'noisette', 'amande',
      'châtaigne', 'carotte', 'poireau', 'navet', 'radis', 'chou', 'salade', 'épinard', 'tomate', 'poivron', 'courgette',
      'aubergine', 'concombre', 'potiron', 'citrouille', 'haricot', 'pois', 'lentille', 'oignon', 'ail', 'échalote',
      'céleri', 'fenouil', 'artichaut', 'asperge', 'brocoli', 'betterave', 'patate', 'endive', 'maïs', 'avocat',
      'rhubarbe',
    ],
  },
  {
    id: 'cuisine',
    name: 'En cuisine',
    words: [
      'casserole', 'poêle', 'louche', 'fouet', 'couteau', 'fourchette', 'cuillère', 'assiette', 'saladier', 'passoire',
      'râpe', 'tablier', 'four', 'frigo', 'évier', 'recette', 'farine', 'sucre', 'beurre', 'oeuf', 'lait', 'crème',
      'levure', 'sel', 'poivre', 'huile', 'vinaigre', 'moutarde', 'gratin', 'soupe', 'potage', 'omelette', 'crêpe',
      'gâteau', 'tarte', 'quiche', 'rôti', 'ragoût', 'pot-au-feu', 'blanquette', 'ratatouille', 'fondue', 'raclette',
      'tartiflette', 'cassoulet', 'choucroute', 'bouillabaisse', 'croissant', 'baguette', 'brioche', 'mijoter',
      'rissoler', 'flamber', 'émincer', 'éplucher', 'saler', 'cuire', 'mixer', 'pétrir',
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    words: [
      'football', 'rugby', 'tennis', 'golf', 'judo', 'karaté', 'boxe', 'escrime', 'natation', 'plongée', 'surf', 'voile',
      'aviron', 'canoë', 'kayak', 'cyclisme', 'vélo', 'course', 'marathon', 'sprint', 'saut', 'perche', 'javelot',
      'disque', 'marteau', 'haie', 'relais', 'ski', 'luge', 'patinage', 'hockey', 'curling', 'biathlon', 'basket',
      'handball', 'volley', 'badminton', 'squash', 'ping-pong', 'escalade', 'randonnée', 'équitation', 'polo',
      'triathlon', 'gymnastique', 'lutte', 'arbitre', 'stade', 'ballon', 'raquette', 'filet', 'maillot', 'médaille',
      'podium', 'trophée', 'champion', 'équipe', 'match', 'but', 'record',
    ],
  },
  {
    id: 'pays',
    name: 'Pays du monde',
    words: [
      'France', 'Espagne', 'Italie', 'Portugal', 'Allemagne', 'Belgique', 'Suisse', 'Autriche', 'Pologne', 'Suède',
      'Norvège', 'Finlande', 'Danemark', 'Irlande', 'Islande', 'Grèce', 'Turquie', 'Russie', 'Ukraine', 'Roumanie',
      'Hongrie', 'Croatie', 'Égypte', 'Maroc', 'Tunisie', 'Algérie', 'Sénégal', 'Mali', 'Kenya', 'Nigeria',
      'Madagascar', 'Canada', 'Mexique', 'Brésil', 'Argentine', 'Chili', 'Pérou', 'Colombie', 'Cuba', 'Chine', 'Japon',
      'Inde', 'Népal', 'Vietnam', 'Thaïlande', 'Corée', 'Iran', 'Irak', 'Israël', 'Liban', 'Australie', 'Bolivie',
      'Cameroun', 'Gabon', 'Togo', 'Bénin', 'Niger', 'Tchad', 'Laos', 'Oman', 'Qatar', 'Yémen', 'Malte', 'Chypre',
    ],
  },
  {
    id: 'metiers',
    name: 'Métiers',
    words: [
      'médecin', 'infirmier', 'dentiste', 'pharmacien', 'vétérinaire', 'boulanger', 'pâtissier', 'boucher', 'fromager',
      'cuisinier', 'serveur', 'coiffeur', 'fleuriste', 'libraire', 'facteur', 'pompier', 'policier', 'gendarme',
      'avocat', 'juge', 'notaire', 'architecte', 'ingénieur', 'maçon', 'plombier', 'électricien', 'menuisier',
      'charpentier', 'peintre', 'jardinier', 'agriculteur', 'berger', 'pêcheur', 'marin', 'pilote', 'chauffeur',
      'mécanicien', 'professeur', 'instituteur', 'chercheur', 'journaliste', 'photographe', 'musicien', 'acteur',
      'danseur', 'sculpteur', 'écrivain', 'traducteur', 'comptable', 'banquier', 'vendeur', 'caissier', 'horloger',
      'bijoutier', 'cordonnier', 'couturier', 'tailleur', 'guide', 'maire', 'chef',
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    words: [
      'forêt', 'arbre', 'chêne', 'sapin', 'bouleau', 'érable', 'saule', 'tilleul', 'olivier', 'palmier', 'feuille',
      'branche', 'racine', 'tronc', 'écorce', 'mousse', 'fougère', 'champignon', 'fleur', 'rose', 'tulipe', 'marguerite',
      'lavande', 'coquelicot', 'tournesol', 'orchidée', 'prairie', 'colline', 'montagne', 'vallée', 'rivière', 'fleuve',
      'ruisseau', 'cascade', 'lac', 'étang', 'océan', 'plage', 'falaise', 'dune', 'désert', 'volcan', 'glacier',
      'grotte', 'île', 'nuage', 'pluie', 'neige', 'orage', 'éclair', 'arc-en-ciel', 'soleil', 'lune', 'étoile', 'vent',
      'brume', 'rosée', 'terre', 'sable', 'galet', 'bruyère', 'horizon', 'marécage', 'lagune', 'archipel', 'clairière',
      'buisson', 'ronce', 'lierre', 'bambou', 'cactus', 'jungle', 'savane', 'toundra', 'banquise', 'marée', 'vague',
      'source', 'crépuscule', 'aurore', 'printemps', 'automne', 'feuillage', 'sentier', 'bocage', 'littoral',
    ],
  },
  {
    id: 'musique',
    name: 'Musique',
    words: [
      'piano', 'guitare', 'violon', 'violoncelle', 'contrebasse', 'harpe', 'flûte', 'clarinette', 'hautbois', 'basson',
      'saxophone', 'trompette', 'trombone', 'tuba', 'cor', 'batterie', 'tambour', 'cymbale', 'triangle', 'xylophone',
      'accordéon', 'harmonica', 'orgue', 'banjo', 'ukulélé', 'mandoline', 'chant', 'chorale', 'orchestre', 'concert',
      'opéra', 'symphonie', 'sonate', 'mélodie', 'rythme', 'tempo', 'accord', 'gamme', 'note', 'clé', 'portée',
      'soupir', 'silence', 'croche', 'noire', 'blanche', 'ronde', 'solfège', 'refrain', 'couplet', 'chanson', 'rock',
      'jazz', 'blues', 'reggae', 'rap', 'valse', 'tango', 'disque', 'scène',
    ],
  },
]
