"""Women's players present in the 2026 sources.

The FC 27 ratings snapshot (FIFPlay) mixes men and women without a gender column, and the FutTactical
rosters carry a few women's squads (Toulouse, Lens, Lazio). The game has men's football only, so these
players are left out of the merge. Names as they appear in each source (checked one by one)."""

WOMEN_FP27 = {
    "Elma Junttila Nelhage", "Teagan Micah", "Inès Benyahia", "Lily Yohannes", "Maria-Luisa Grohs", "Tarciane",
    "Marie-Antoinette Katoto", "Ada Hegerberg", "Christiane Endler", "Jule Brand", "Ingrid Syrstad Engen", "Damaris Egurrola",
    "Wendie Renard", "Salma Paralluelo", "Cecilie Fløe", "Mara Alber", "Lieske Carleer", "Camilla Küver",
    "Julia Landenberger", "Stina Johannes", "Giovanna Hoffmann", "Cora Zicai", "Lena Lattwein", "Regina Van Eijk",
    "Anna Klink", "Alara", "Stine Ballisager", "Lena Oberdorf", "Vanessa Gilles", "Edna Imade",
    "Ena Mahmutovic", "Eve Boettcher", "Rosa Ruckert", "Tamar Dongus", "Janina Hechler", "Fabienne Dongus",
    "Verena Wieder", "Laura Giuliani", "Maximiliane Rall", "Emily Ramsey", "Mathilde Harviken", "Anna Patten",
    "Ellie Roebuck", "Lynn Wilms", "Elise Isolde Stenevik", "Irina Fuchs", "Celina Degen", "Lisa Schmitz",
    "Taylor Ziemer", "Laureta Elmazi", "Livia Peng", "Nathalie Björn", "Lauren James", "Mayra Ramírez",
    "Hannah Hampton", "Shumaira Mheuka", "Gracie Prior", "Sydney Lohmann", "Jade Rose", "Rebecca Knaak",
    "Khadija Shaw", "Vivianne Miedema", "Valentina Mädl", "Caroline Kehrer", "Charlotte Voll", "Selina Ostermeier",
    "Rafaela Borggräfe", "Jaqueline Dönges", "Andrea Svibkova", "Victoria Schulz", "Larissa Haidner", "Nina Räcke",
    "Nikola Karczewska", "Elena Mühlemann", "Medina Dešić", "Lina Hausicke", "Michelle Ulbrich", "Lena Petermann",
    "Katie Reid", "Anneke Borbe", "Lotte Wubben-Moy", "Stina Blackstenius", "Daphne Van Domselaar", "Sophie Lindner",
    "Charlotte Hulst", "Nikée Van Dijk", "Andrea Norheim", "Elvira Herzog", "Lorena Barth", "Lina Von Schrader",
    "Luca Birkholz", "Laura Benkarth", "Isa Álvarez", "Esther Sullastres", "Gemma Gili", "Lourdes Romero",
    "Rebecca Adamczyk", "Julia Pollak", "Noémie Mouchon", "Rylee Foster Inman", "Karen Holmgaard", "Megan Finnigan",
    "Courtney Brosnan", "Rakel Engesvik", "Ziqin Shao", "Michaely Bihina", "Lena Pauels", "Caroline Møller",
    "Bella Andersson", "Sara Holmgaard", "Signe Bruun", "Merle Frohms", "Sydney Schertenleib", "Caroline Graham Hansen",
    "Irene Paredes", "Simi Awujo", "Janina Leitzig", "Fridolina Rolfö", "Phallon Tullis-Joyce", "Dominique Janssen",
    "Marthine Østenstad", "Larissa Mühlhaus", "Paulina Krumbiegel", "Sophia Winkler", "Amanda Ilestedt", "Anna Csiki",
    "Cathinka Tandberg", "Clare Hunt", "Esther Mbakem-Niaro", "Taylor Beitz", "Marie Petiteau", "Maïté Boucly",
    "Bo Van Egmond", "Louise Van Oosten", "Sari Kees", "Nurija Van Schoonhoven", "Rachele Baldi", "Olivie Lukášová",
    "Alice Corelli", "Martina Piemonte", "Bibi", "Irene Oguiza", "Eunate Astralaga", "Somea Polozen",
    "Andrea Gómez", "Lauren Leal", "Chiara Hahn", "Lisa Doorn", "Laura Dick", "Jenna Clark",
    "Rachael Laws", "Sophie Román Haug", "Kelly Gago", "Constance Picaud-Inconnu", "Barbora Votíková", "Yasmin Mrabet",
    "Alice Pinguet", "Charlize Rule", "Maelys Mpome", "Chiamaka Nnadozie", "Justine Vanhaevermaet", "Pauline Peyraud-Magnin",
    "Jennyfer Limage", "Emma Stølen Godø", "Cecilia Salvai", "Nadine Böhi", "Amber Tysiak", "Johanna Berg",
    "Marina Georgieva", "Marie-Morgane Sieber", "Salomé Elisor", "Sofie Gron", "Julie Pasquereau", "Hillary Diaz",
    "Mylène Chavas", "Ana-Maria Crnogorčević", "Katarzyna Kiedrzynek", "Merveille Kanjinga", "Carmen Álvarez", "Klára Cahynová",
}

WOMEN_FT = {
    "Jennyfer Limage", "Roseline Éloissaint", "Lea Notel", "Carla Polito", "Elisa Launay", "Julie Rabanne",
    "Selen Altunkulak", "Christy Gavory", "Chloé Tapia", "Lina Gay", "Chloe Marty", "Fiona Bogi",
    "Roma Grinfan", "Lou Jumere Seignou", "Tatiana Solanet", "Carla Camacho Carrillo",
}

WOMEN = WOMEN_FP27 | WOMEN_FT
