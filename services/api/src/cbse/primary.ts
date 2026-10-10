// CBSE chapter lists for Classes 1 to 8, plus subjects that the bundled catalogue.json does not hold
// (Hindi for Classes 9 and 10, and the Humanities stream for Classes 11 and 12).
// Chapters follow the NCERT textbook for each class (NCERT is the CBSE prescribed textbook publisher).
// Only chapter titles are recorded; no textbook text is copied. Always check a chapter against the
// current NCERT edition at https://ncert.nic.in/textbook.php before using it for a timetable.

export type ChapterList = Record<string, string[]>;

export const NCERT_SITE = 'https://ncert.nic.in/textbook.php';

export const EXTRA_CHAPTERS: Record<number, ChapterList> = {
  1: {
    English: ['A Happy Child', 'Three Little Pigs', 'After a Bath', 'The Bubble, the Straw and the Shoe', 'One Little Kitten', 'Lalu and Peelu', 'Once I Saw a Little Bird', 'Mittu and the Yellow Mango', 'Merry-Go-Round', 'Circle', 'If I Were an Apple', 'Our Tree', 'A Kite', 'Sundari', 'The Tiger and the Mosquito', 'Anandi’s Rainbow'],
    Mathematics: ['Shapes and Space', 'Numbers 1 to 9', 'Addition', 'Subtraction', 'Numbers 10 to 20', 'Time', 'Measurement', 'Numbers 21 to 50', 'Data Handling', 'Patterns', 'Numbers', 'Money', 'How Many'],
    Hindi: ['झूला', 'आम की कहानी', 'आम की टोकरी', 'पत्ते ही पत्ते', 'पकौड़ी', 'छुक-छुक गाड़ी', 'रसोईघर', 'चूहा और मैं', 'बंदर बाँट', 'पतंग', 'अधिक बलवान कौन', 'हवा'],
    'Environmental Awareness': ['My Family and Me', 'Our Homes', 'Plants Around Us', 'Animals Around Us', 'Food We Eat', 'Water', 'Our Festivals', 'Helpers in Our Neighbourhood', 'Keeping Clean and Healthy', 'Safety at Home and School'],
  },
  2: {
    English: ['First Day at School', 'Haldi’s Adventure', 'I Am Lucky', 'I Want', 'A Smile', 'The Wind and the Sun', 'Rain', 'Storm in the Garden', 'Zoo Manners', 'Funny Bunny', 'Mr. Nobody', 'Curlylocks and the Three Bears', 'On My Blackboard I Can Draw', 'Make it Shorter', 'I Am the Music Man', 'The Mumbai Musicians', 'Granny, Granny Please Comb My Hair', 'The Magic Porridge Pot'],
    Mathematics: ['What is Long, What is Round', 'Counting in Groups', 'How Much Can You Carry', 'Counting in Tens', 'Patterns', 'Footprints', 'Jugs and Mugs', 'Tens and Ones', 'My Funday', 'Add Our Points', 'Lines and Lines', 'Give and Take', 'The Longest Step', 'Birds Come, Birds Go', 'How Many Ponytails'],
    Hindi: ['ऊँट चला', 'भालू ने खेली फुटबॉल', 'म्याऊँ, म्याऊँ!!', 'अधिक बलवान कौन?', 'दोस्त की मदद', 'बहादुर बित्तो', 'मित्र को पत्र', 'मीठी सारंगी', 'दो मित्र', 'चिड़िया का घर'],
    'Environmental Awareness': ['Our Body', 'Growing Up', 'Seasons and Weather', 'Birds and Their Nests', 'Transport', 'Water Everywhere', 'Good Habits', 'Our Country India', 'Houses Around the World', 'Caring for Our Environment'],
  },
  3: {
    English: ['Good Morning', 'The Magic Garden', 'Bird Talk', 'Nina and the Baby Sparrows', 'Little by Little', 'The Enormous Turnip', 'Sea Song', 'A Little Fish Story', 'The Balloon Man', 'The Yellow Butterfly', 'Trains', 'The Story of the Road', 'Puppy and I', 'Little Tiger, Big Tiger', 'What’s in the Mailbox?', 'My Silly Sister', 'Don’t Tell', 'He is My Brother', 'How Creatures Move', 'The Ship of the Desert'],
    Mathematics: ['What’s in a Name?', 'Toy Joy', 'Double Century', 'Vacation with My Nani Maa', 'Fun with Shapes', 'House of Hundreds – I', 'Raksha Bandhan', 'Fair Share', 'House of Hundreds – II', 'Fun at Class Party!', 'Filling and Lifting', 'Give and Take', 'Time Goes On', 'The Surajkund Fair', 'Ticky’s Adventures'],
    Hindi: ['कक्कू', 'शेखीबाज़ मक्खी', 'चाँद वाली अम्मा', 'मन करता है', 'बहादुर बित्तो', 'हमसे सब कहते', 'टिपटिपवा', 'बंदर बाँट', 'अक्कड़ बक्कड़', 'तिनका तिनका सुख', 'एक्की दोक्की', 'कौन?', 'सूरज की खोज'],
    EVS: ['Poonam’s Day Out', 'The Plant Fairy', 'Water O Water!', 'Our First School', 'Chhotu’s House', 'Foods We Eat', 'Saying Without Speaking', 'Flying High', 'It’s Raining', 'What is Cooking', 'From the Windows', 'Families Can Be Different', 'Two Willing Hands', 'A Shelter So High!', 'When the Earth Shook!', 'Blow Hot, Blow Cold', 'Who Will Do This Work?', 'Across the Wall'],
  },
  4: {
    English: ['Wake Up!', 'Neha’s Alarm Clock', 'Noses', 'The Little Fir Tree', 'Run!', 'Nasruddin’s Aim', 'Why?', 'Alice in Wonderland', 'Don’t Be Afraid of the Dark', 'Helen Keller', 'The Donkey', 'I Had a Little Pony', 'The Milkman’s Cow', 'Hiawatha', 'The Scholar’s Mother Tongue', 'The Giving Tree', 'The Selfish Giant'],
    Mathematics: ['Building with Bricks', 'Long and Short', 'A Trip to Bhopal', 'Tick-Tick-Tick', 'The Way the World Looks', 'The Junk Seller', 'Jugs and Mugs', 'Carts and Wheels', 'Halves and Quarters', 'Play with Patterns', 'Tables and Shares', 'How Heavy? How Light?', 'Fields and Fences', 'Smart Charts'],
    Hindi: ['मन के भोले-भाले बादल', 'जैसा सवाल वैसा जवाब', 'किरमिच की गेंद', 'पापा जब बच्चे थे', 'दोस्त की पोशाक', 'नाव बनाओ नाव बनाओ', 'दान का हिसाब', 'कौन?', 'स्वतंत्रता की ओर', 'थप्प रोटी थप्प दाल'],
    EVS: ['Going to School', 'Ear to Ear', 'A Day with Nandu', 'The Story of Amrita', 'Anita and the Honeybees', 'Omana’s Journey', 'From the Window', 'Reaching Grandmother’s House', 'Changing Families', 'Hu Tu Tu, Hu Tu Tu', 'The Valley of Flowers', 'Changing Times', 'A River’s Tale', 'Basva’s Farm', 'From Market to Home', 'A Busy Month', 'Nandita in Mumbai', 'Too Much Water, Too Little Water', 'Abdul in the Garden', 'Eating Together', 'Food and Fun'],
  },
  5: {
    English: ['Ice-cream Man', 'Wonderful Waste!', 'Teamwork', 'Flying Together', 'My Shadow', 'Robinson Crusoe Discovers a Footprint', 'Crying', 'My Elder Brother', 'The Lazy Frog', 'Rip Van Winkle', 'Class Discussion', 'The Talkative Barber', 'Topsy-turvy Land', 'Gulliver’s Travels', 'Nobody’s Friend', 'The Little Bully', 'Sing a Song of People', 'Malu Bhalu', 'Who Will be Ningthou?'],
    Mathematics: ['The Fish Tale', 'Shapes and Angles', 'How Many Squares?', 'Parts and Wholes', 'Does it Look the Same?', 'Be My Multiple, I’ll Be Your Factor', 'Can You See the Pattern?', 'Mapping Your Way', 'Boxes and Sketches', 'Tenths and Hundredths', 'Area and Its Boundary', 'Smart Charts', 'Ways to Multiply and Divide', 'How Big? How Heavy?'],
    Hindi: ['राख की रस्सी', 'फसलों के त्योहार', 'खिलौनेवाला', 'नन्हा फनकार', 'जहाँ चाह वहाँ राह', 'चिट्ठी के अनोखे रंग', 'वे दिन भी क्या दिन थे', 'एक माँ की बेबसी', 'एक दिन की बादशाहत', 'चावल की रोटियाँ', 'गुरु और चेला', 'स्वामी की दादी', 'बाघ आया उस रात', 'बिशन की दिलेरी', 'पाँव तले की ज़मीन'],
    EVS: ['Super Senses', 'A Snake Charmer’s Story', 'From Tasting to Digesting', 'Mangoes Round the Year', 'Seeds and Seeds', 'Every Drop Counts', 'Experiments with Water', 'A Treat for Mosquitoes', 'Up You Go!', 'Walls Tell Stories', 'Sunita in Space', 'What if it Finishes?', 'A Shelter so High!', 'When the Earth Shook!', 'Blow Hot, Blow Cold', 'Who Will Do This Work?', 'Across the Wall', 'No Place for Us?', 'A Seed Tells a Farmer’s Story', 'Whose Forests?', 'Like Father, Like Daughter', 'On the Move Again'],
  },
  6: {
    Mathematics: ['Patterns in Mathematics', 'Lines and Angles', 'Number Play', 'Data Handling and Presentation', 'Prime Time', 'Perimeter and Area', 'Fractions', 'Playing with Constructions', 'Symmetry', 'The Other Side of Zero'],
    Science: ['The Wonderful World of Science', 'Diversity in the Living World', 'Mindful Eating: A Path to a Healthy Body', 'Exploring Magnets', 'Measurement of Length and Motion', 'Materials Around Us', 'Temperature and its Measurement', 'A Journey through States of Water', 'Methods of Separation in Everyday Life', 'Living Creatures: Exploring their Characteristics', 'Nature’s Treasures', 'Beyond Earth'],
    'Social Science': ['Locating Places on the Earth', 'Oceans and Continents', 'Landforms and Life', 'Timeline and Sources of History', 'India, That Is Bharat', 'The Beginnings of Indian Civilisation', 'India’s Cultural Roots', 'Unity in Diversity, or ‘Many in the One’', 'Family and Community', 'Grassroots Democracy – Part 1: Governance', 'Grassroots Democracy – Part 2: Local Government in Rural Areas', 'Grassroots Democracy – Part 3: Local Government in Urban Areas', 'The Value of Work', 'Economic Activities Around Us'],
    English: ['A Bundle of Sticks', 'The Fun They Had', 'The Kite', 'Who Did Patrick’s Homework?', 'A House, A Home', 'The Quarrel', 'Beauty', 'Where Do All the Teachers Go?', 'The Wonder Called Sleep', 'A Different Kind of School', 'Who I Am', 'The Wonderful Words', 'Fair Play', 'A Game of Chance', 'Desert Animals', 'The Banyan Tree'],
    Hindi: ['वह चिड़िया जो', 'बचपन', 'नादान दोस्त', 'चाँद से थोड़ी-सी गप्पें', 'अक्षरों का महत्व', 'पार नज़र के', 'साथी हाथ बढ़ाना', 'ऐसे-ऐसे', 'टिकट अलबम', 'झाँसी की रानी', 'जो देखकर भी नहीं देखते', 'संसार पुस्तक है', 'मैं सबसे छोटी होऊँ', 'लोकगीत', 'नौकर', 'वन के मार्ग में', 'साँस-साँस में बाँस'],
    'Computer Science': ['Introduction to Computers', 'Parts of a Computer', 'Operating Systems and Files', 'Word Processing Basics', 'Internet and Safe Browsing', 'Introduction to Scratch Programming', 'Algorithms and Flowcharts', 'Digital Citizenship'],
  },
  7: {
    Mathematics: ['Large Numbers Around Us', 'Arithmetic Expressions', 'A Peek Beyond the Point', 'Expressions Using Letter-Numbers', 'Parallel and Intersecting Lines', 'Number Play', 'A Tale of Three Intersecting Lines', 'Working with Fractions'],
    Science: ['Exploring Substances: Acidic, Basic, and Neutral', 'Electricity: Circuits and their Components', 'The World of Metals and Non-metals', 'Changes Around Us: Physical and Chemical', 'Adolescence: A Stage of Growth and Change', 'Heat Transfer in Nature', 'Measurement of Time and Motion', 'Life Processes in Animals', 'Life Processes in Plants', 'Light: Shadows and Reflections', 'Earth, Moon, and the Sun'],
    'Social Science': ['Geographical Diversity of India', 'Understanding the Weather', 'Climates of India', 'New Beginnings: Cities and States', 'The Rise of Empires', 'The Age of Reorganisation', 'The Gupta Era: An Age of Tireless Creativity', 'Tapestry of Indian Society', 'Democracy and Equality', 'Markets Around Us', 'Our Economy: Money and Exchange'],
    English: ['Three Questions', 'A Gift of Chappals', 'Gopal and the Hilsa-Fish', 'The Ashes That Made Trees Bloom', 'Quality', 'Expert Detectives', 'The Invention of Vita-Wonk', 'Fire: Friend and Foe', 'A Bicycle in Good Repair', 'The Story of Cricket', 'The Cop and the Anthem', 'Garden Snake', 'Chivvy', 'Trees', 'Mystery of the Talking Fan'],
    Hindi: ['हम पंछी उन्मुक्त गगन के', 'दादी माँ', 'हिमालय की बेटियाँ', 'कठपुतली', 'मिठाईवाला', 'रक्त और हमारा शरीर', 'पापा खो गए', 'शाम – एक किसान', 'चिड़िया की बच्ची', 'अपूर्व अनुभव', 'रहीम के दोहे', 'कंचा', 'एक तिनका', 'खानपान की बदलती तस्वीर', 'नीलकंठ', 'भोर और बरसात', 'वीर कुँवर सिंह', 'संघर्ष के कारण मैं तुनक मिज़ाज हो गया धनराज'],
    'Computer Science': ['Evolution of Computers', 'Input, Output and Storage Devices', 'Spreadsheets for Beginners', 'Presentations and Multimedia', 'Cyber Safety and Ethics', 'Block Programming with Scratch', 'Introduction to HTML'],
  },
  8: {
    Mathematics: ['A Square and A Cube', 'Power Play', 'A Story of Numbers', 'Quadrilaterals', 'Number Play', 'We Distribute, Yet Things Multiply', 'Proportional Reasoning – 1'],
    Science: ['Crop Production and Management', 'Microorganisms: Friend and Foe', 'Coal and Petroleum', 'Combustion and Flame', 'Conservation of Plants and Animals', 'Reproduction in Animals', 'Reaching the Age of Adolescence', 'Force and Pressure', 'Friction', 'Sound', 'Chemical Effects of Electric Current', 'Some Natural Phenomena', 'Light'],
    'Social Science': ['Natural Resources and Their Use', 'Reshaping India’s Political Map', 'The Rise of the Marathas', 'The Colonial Era in India', 'Universal Franchise and India’s Electoral System', 'The Parliamentary System: Legislature and Executive', 'Factors of Production'],
    English: ['The Best Christmas Present in the World', 'The Tsunami', 'Glimpses of the Past', 'Bepin Choudhury’s Lapse of Memory', 'The Summit Within', 'This is Jody’s Fawn', 'A Visit to Cambridge', 'A Short Monsoon Diary', 'The Great Stone Face – I', 'The Great Stone Face – II', 'The Ant and the Cricket', 'Geography Lesson', 'Macavity: The Mystery Cat', 'The Last Bargain', 'The School Boy', 'The Duck and the Kangaroo'],
    Hindi: ['ध्वनि', 'लाख की चूड़ियाँ', 'बस की यात्रा', 'दीवानों की हस्ती', 'चिट्ठियों की अनूठी दुनिया', 'भगवान के डाकिए', 'क्या निराश हुआ जाए', 'यह सबसे कठिन समय नहीं', 'कबीर की साखियाँ', 'सुदामा चरित', 'जहाँ पहिया है', 'अकबरी लोटा', 'सूरदास के पद', 'पानी की कहानी', 'बाज और साँप'],
    'Computer Science': ['Computer Networks', 'Spreadsheet Formulas and Charts', 'Introduction to Python', 'Databases for Beginners', 'Artificial Intelligence Basics', 'Web Page Design with HTML', 'Cyber Security and Safe Computing'],
  },
  9: {
    Hindi: ['दो बैलों की कथा', 'ल्हासा की ओर', 'उपभोक्तावाद की संस्कृति', 'साँवले सपनों की याद', 'नाना साहब की पुत्री देवी मैना को भस्म कर दिया गया', 'प्रेमचंद के फटे जूते', 'मेरे बचपन के दिन', 'एक कुत्ता और एक मैना', 'साखियाँ एवं सबद', 'वाख', 'सवैये', 'कैदी और कोकिला', 'ग्राम श्री', 'चंद्र गहना से लौटती बेर', 'मेघ आए', 'यमराज की दिशा', 'बच्चे काम पर जा रहे हैं'],
  },
  10: {
    Hindi: ['सूरदास के पद', 'राम-लक्ष्मण-परशुराम संवाद', 'सवैया और कवित्त', 'आत्मकथ्य', 'उत्साह और अट नहीं रही है', 'यह दंतुरहित मुस्कान और फसल', 'छाया मत छूना', 'कन्यादान', 'संगतकार', 'नेताजी का चश्मा', 'बालगोबिन भगत', 'लखनवी अंदाज़', 'मानवीय करुणा की दिव्य चमक', 'एक कहानी यह भी', 'स्त्री शिक्षा के विरोधी कुतर्कों का खंडन', 'नौबतखाने में इबादत', 'संस्कृति'],
  },
  11: {
    History: ['From the Beginning of Time', 'Writing and City Life', 'An Empire Across Three Continents', 'The Central Islamic Lands', 'Nomadic Empires', 'The Three Orders', 'Changing Cultural Traditions', 'Confrontation of Cultures', 'The Industrial Revolution', 'Displacing Indigenous Peoples', 'Paths to Modernisation'],
    'Political Science': ['Constitution: Why and How?', 'Rights in the Indian Constitution', 'Election and Representation', 'Executive', 'Legislature', 'Judiciary', 'Federalism', 'Local Governments', 'Constitution as a Living Document', 'The Philosophy of the Constitution'],
    Geography: ['Geography as a Discipline', 'The Origin and Evolution of the Earth', 'Interior of the Earth', 'Distribution of Oceans and Continents', 'Minerals and Rocks', 'Geomorphic Processes', 'Landforms and their Evolution', 'Composition and Structure of Atmosphere', 'Solar Radiation, Heat Balance and Temperature', 'Atmospheric Circulation and Weather Systems', 'Water in the Atmosphere', 'World Climate and Climate Change', 'Water (Oceans)', 'Movements of Ocean Water', 'Life on the Earth', 'Biodiversity and Conservation'],
    Psychology: ['What is Psychology?', 'Methods of Enquiry in Psychology', 'The Bases of Human Behaviour', 'Human Development', 'Sensory, Attentional and Perceptual Processes', 'Learning', 'Human Memory', 'Thinking', 'Motivation and Emotion'],
  },
  12: {
    History: ['Bricks, Beads and Bones', 'Kings, Farmers and Towns', 'Kinship, Caste and Class', 'Thinkers, Beliefs and Buildings', 'Through the Eyes of Travellers', 'Bhakti-Sufi Traditions', 'An Imperial Capital: Vijayanagara', 'Peasants, Zamindars and the State', 'Kings and Chronicles', 'Colonialism and the Countryside', 'Rebels and the Raj', 'Colonial Cities', 'Mahatma Gandhi and the Nationalist Movement', 'Understanding Partition', 'Framing the Constitution'],
    'Political Science': ['The Cold War Era', 'The End of Bipolarity', 'US Hegemony in World Politics', 'Alternative Centres of Power', 'Contemporary South Asia', 'International Organisations', 'Security in the Contemporary World', 'Environment and Natural Resources', 'Globalisation', 'Challenges of Nation Building', 'Era of One-Party Dominance', 'Politics of Planned Development', 'India’s External Relations', 'Challenges to the Congress System', 'The Crisis of Democratic Order', 'Rise of Popular Movements', 'Regional Aspirations', 'Recent Developments in Indian Politics'],
    Geography: ['Human Geography: Nature and Scope', 'The World Population: Distribution, Density and Growth', 'Human Development', 'Primary Activities', 'Secondary Activities', 'Tertiary and Quaternary Activities', 'Transport and Communication', 'International Trade', 'Population: Distribution, Density, Growth and Composition', 'Human Settlements', 'Land Resources and Agriculture', 'Water Resources', 'Mineral and Energy Resources', 'Manufacturing Industries', 'Planning and Sustainable Development in Indian Context', 'Transport and Communication in India', 'International Trade of India', 'Geographical Perspective on Selected Issues and Problems'],
    Psychology: ['Variations in Psychological Attributes', 'Self and Personality', 'Meeting Life Challenges', 'Psychological Disorders', 'Therapeutic Approaches', 'Attitude and Social Cognition', 'Social Influence and Group Processes'],
  },
};

/** Sub-topics worth studying inside a chapter, keyed by subject family. Used when the syllabus has no listed parts. */
export const SUBJECT_FOCUS: Record<string, string[]> = {
  Mathematics: ['key definitions and notation', 'worked examples from the NCERT text', 'method steps to follow in order', 'common mistakes to avoid', 'word problems from daily life'],
  Science: ['key terms and definitions', 'diagrams to draw and label', 'activities and experiments in the chapter', 'real-life applications', 'cause-and-effect reasoning'],
  'Social Science': ['key dates, places and people', 'maps and timelines', 'causes and consequences', 'source-based reading', 'connections to present-day India'],
  English: ['theme and central idea', 'characters or speaker', 'vocabulary and word meanings', 'literary devices', 'writing a short response'],
  Hindi: ['भावार्थ और मुख्य विचार', 'शब्दार्थ', 'पात्र / कवि का परिचय', 'व्याकरण अभ्यास', 'प्रश्न-उत्तर लेखन'],
  General: ['main ideas', 'key vocabulary', 'examples from daily life', 'activities to try', 'questions to ask your teacher'],
};

export type SubjectFamily = keyof typeof SUBJECT_FOCUS;

export const subjectFamily = (subject: string): SubjectFamily => {
  const s = subject.toLowerCase();
  if (/math|account|statistics/.test(s)) return 'Mathematics';
  if (/social|history|geography|political|econom|business|civics|commerce/.test(s)) return 'Social Science';
  if (/physics|chem|bio|science|computer|informatics|evs|environment|psychology/.test(s)) return 'Science';
  if (/hindi|sanskrit/.test(s)) return 'Hindi';
  if (/english/.test(s)) return 'English';
  return 'General';
};
