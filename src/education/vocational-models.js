export const VOCATIONAL_MODULES = {
  engine: {
    id: 'engine',
    title: '4-Stroke Internal Combustion Engine',
    titleHi: '४-स्ट्रोक आंतरिक दहन इंजन (IC Engine)',
    category: 'Mechanic Motor Vehicle / Fitter / Marine',
    categoryHi: 'मैकेनिक मोटर वाहन / फिटर',
    scaleDefault: 0.5,
    components: [
      {
        id: 'piston',
        name: 'Piston & Rings',
        nameHi: 'पिस्टन और रिंग्स',
        material: 'Cast Aluminum Alloy (Al-Si)',
        materialHi: 'ढलवा एल्युमिनियम मिश्र धातु',
        function: 'Receives combustion pressure during the Power Stroke (up to 60 bar) and transmits linear mechanical force to the connecting rod. The top two rings prevent gas blow-by while the bottom ring scrapes oil.',
        functionHi: 'दहन गैसों के उच्च दबाव (६० बार तक) को सहन कर कनेक्टिंग रॉड में गति स्थानांतरित करता है। ऊपर की रिंग्स गैस रिसाव रोकती हैं और निचली रिंग तेल को साफ़ करती है।',
        explodeOffset: [0, 0.45, 0]
      },
      {
        id: 'connectingRod',
        name: 'Connecting Rod',
        nameHi: 'कनेक्टिंग रॉड (संयोजक दंड)',
        material: 'Forged Carbon Steel (40Cr / 42CrMo4)',
        materialHi: 'जालीदार कार्बन स्टील',
        function: 'Converts reciprocating (up-and-down) motion of the piston into rotational motion of the crankshaft. Fitted with lead-bronze shell bearings.',
        functionHi: 'पिस्टन की ऊपर-नीचे (रेसिप्रोकेटिंग) गति को क्रैंकशाफ्ट की घूर्णन (रोटरी) गति में बदलता है।',
        explodeOffset: [0, 0.2, 0.15]
      },
      {
        id: 'crankshaft',
        name: 'Crankshaft with Counterweights',
        nameHi: 'क्रैंकशाफ्ट (मुख्य धुरी)',
        material: 'Drop-Forged Steel / Spheroidal Graphite Iron',
        materialHi: 'फोर्ज्ड स्टील या डक्टाइल आयरन',
        function: 'The primary drive component transmitting output torque to the flywheel. Counterweights dynamically balance reciprocating inertia forces, eliminating engine vibration.',
        functionHi: 'इंजन का मुख्य आउटपुट अंग जो टॉर्क को फ्लाईव्हील तक पहुंचाता है। काउंटरवेट्स कंपन को पूरी तरह संतुलित रखते हैं।',
        explodeOffset: [0, -0.3, 0]
      },
      {
        id: 'cylinderBlock',
        name: 'Cylinder Block & Liner',
        nameHi: 'सिलेंडर ब्लॉक और लाइनर',
        material: 'Grey Cast Iron (FG 200) with Boron-Alloy Liner',
        materialHi: 'ग्रे कास्ट आयरन (कच्चा लोहा)',
        function: 'Houses the combustion chamber and provides a precision-honed bore for smooth piston travel. Water jackets cool the high-temperature zone.',
        functionHi: 'दहन कक्ष को सुरक्षित रखता है और पिस्टन की चिकनी गति के लिए बोर प्रदान करता है।',
        explodeOffset: [0.35, 0, 0]
      },
      {
        id: 'sparkPlug',
        name: 'Spark Plug & Combustion Zone',
        nameHi: 'स्पार्क प्लग (अग्नि प्रज्वलक)',
        material: 'Alumina Ceramic Insulator & Nickel-Iridium Core',
        materialHi: 'एल्यूमिना सिरेमिक और इरिडियम इलेक्ट्रोड',
        function: 'Fires an 18,000–25,000V electric spark at 10°–15° before Top Dead Center (TDC) to ignite the compressed air-fuel mixture in the cylinder head.',
        functionHi: 'संपीड़ित पेट्रोल-हवा के मिश्रण को जलाने के लिए १८,०००-२५,००० वोल्ट की तीव्र विद्युत चिंगारी उत्पन्न करता है।',
        explodeOffset: [0, 0.7, 0]
      },
      {
        id: 'valves',
        name: 'Intake & Exhaust Poppet Valves',
        nameHi: 'इनटेक और एग्जॉस्ट वाल्व',
        material: 'Silchrome / Stellite Faced Austenitic Steel',
        materialHi: 'सिलक्रोम और स्टेलाइट स्टील',
        function: 'Camshaft-operated poppet valves. The larger intake valve draws fresh charge; the heat-resistant exhaust valve releases burnt flue gases at 800°C.',
        functionHi: 'कैमशाफ्ट द्वारा संचालित। बड़ा इनटेक वाल्व ताजा मिश्रण लेता है और एग्जॉस्ट वाल्व जली हुई गैसों को बाहर निकालता है।',
        explodeOffset: [-0.3, 0.45, 0]
      }
    ]
  },

  motor: {
    id: 'motor',
    title: '3-Phase AC Induction Motor (Squirrel Cage)',
    titleHi: '३-फेज एसी इंडक्शन मोटर (गिलहरी पिंजरा रोटर)',
    category: 'Electrician / Wireman / Industrial Automation',
    categoryHi: 'इलेक्ट्रीशियन / वायरमैन',
    scaleDefault: 0.5,
    components: [
      {
        id: 'statorCore',
        name: 'Laminated Stator Core',
        nameHi: 'स्टेटर कोर (लैमिनेटेड पत्तियां)',
        material: 'Silicon Steel Stampings (0.35mm–0.5mm, CRGO)',
        materialHi: 'सिलिकॉन स्टील स्टैम्पिंग (सीआरजीओ)',
        function: 'Carries the rotating magnetic field (RMF). Made of insulated thin laminations to drastically reduce Eddy Current losses ($P_e \propto f^2 B_m^2 t^2$).',
        functionHi: 'घूर्णनशील चुंबकीय क्षेत्र उत्पन्न करता है। एड़ी करंट के नुकसान को न्यूनतम रखने के लिए पतली लैमिनेटेड पत्तियों से बना होता है।',
        explodeOffset: [0.4, 0, 0]
      },
      {
        id: 'copperWindings',
        name: '3-Phase Stator Windings',
        nameHi: '३-फेज कॉपर वाइंडिंग',
        material: 'Dual-Coated Enamelled Copper Wire (Grade 2)',
        materialHi: 'एनामेल्ड तांबे का तार',
        function: 'Distributed 120° electrical degrees apart in the stator slots. When 3-phase AC flows through them, a constant-magnitude magnetic field rotates at synchronous speed $N_s = \frac{120f}{P}$.',
        functionHi: 'स्टेटर स्लॉट्स में १२०° की दूरी पर स्थित। ३-फेज करंट प्रवाहित होने पर एक स्थिर चुंबकीय क्षेत्र समकालिक गति पर घूमता है।',
        explodeOffset: [0, 0.35, 0]
      },
      {
        id: 'rotor',
        name: 'Squirrel-Cage Rotor & Shaft',
        nameHi: 'स्क्विरल केज रोटर और शाफ्ट',
        material: 'Die-cast Aluminum Bars shorted with End-Rings',
        materialHi: 'एल्यूमीनियम बार और एंड-रिंग्स',
        function: 'Conductors cut the stator RMF, inducing heavy currents ($e = -\frac{d\Phi}{dt}$) which produce mechanical rotor torque per Lenz’s Law. Bars are skewed to prevent magnetic cogging.',
        functionHi: 'स्टेटर के घूमते चुंबकीय क्षेत्र से इसमें करंट प्रेरित होता है जो लेन्ज के नियम से शाफ्ट को तेज गति से घुमाता है।',
        explodeOffset: [-0.45, 0, 0]
      },
      {
        id: 'coolingFan',
        name: 'External Bi-Directional Cooling Fan',
        nameHi: 'कूलिंग फैन (शीतलन पंखा)',
        material: 'High-Impact Polyamide / Cast Aluminum',
        materialHi: 'पॉलीअमाइड प्लास्टिक या एल्यूमीनियम',
        function: 'Mounted on the non-drive end of the shaft. Forces cooling airflow through exterior ribbed cooling fins, maintaining Class F/H insulation limits.',
        functionHi: 'शाफ्ट के पिछले सिरे पर लगा होता है। यह बाहरी रिब्स पर ठंडी हवा फेंककर मोटर के तापमान को नियंत्रित रखता है।',
        explodeOffset: [-0.7, 0, 0]
      }
    ]
  },

  compressor: {
    id: 'compressor',
    title: 'Reciprocating Air Compressor',
    titleHi: 'रेसिप्रोकेटिंग एयर कंप्रेसर',
    category: 'RAC Mechanic / Fitter / Pneumatics',
    categoryHi: 'आरएसी मैकेनिक / फिटर / न्यूमेटिक्स',
    scaleDefault: 0.5,
    components: [
      {
        id: 'cylinderHead',
        name: 'Cylinder Head with Reed Valves',
        nameHi: 'सिलेंडर हेड और रीड वाल्व',
        material: 'Cast Iron / Die-Cast Aluminum with Swedish Steel Valves',
        materialHi: 'कास्ट आयरन और स्वेडिश स्प्रिंग स्टील',
        function: 'Contains pressure-actuated suction and delivery reed valves that flex automatically under differential pressure during the stroke cycle.',
        functionHi: 'सक्शन और डिलीवरी वाल्व रखता है जो पिस्टन के दबाव के अनुसार स्वतः खुलते और बंद होते हैं।',
        explodeOffset: [0, 0.45, 0]
      },
      {
        id: 'pistonAssembly',
        name: 'Compression Piston & Rings',
        nameHi: 'कंप्रेशन पिस्टन और सील रिंग',
        material: 'High-Strength Cast Aluminum Alloy',
        materialHi: 'एल्युमिनियम अलॉय',
        function: 'Draws atmospheric air through an intake air filter during the downstroke and compresses it to working pressure (up to 10-12 bar) during upstroke.',
        functionHi: 'नीचे आते समय हवा खींचता है और ऊपर जाते समय उसे संपीड़ित करके १०-१२ बार दबाव उत्पन्न करता है।',
        explodeOffset: [0, 0.15, 0]
      },
      {
        id: 'crankcase',
        name: 'Crankcase & Splash Lubrication Sump',
        nameHi: 'क्रैंककेस और ऑयल सम्प',
        material: 'Cast Iron with Precision Oil Sight Glass',
        materialHi: 'कास्ट आयरन और ऑयल साइट ग्लास',
        function: 'Houses crankshaft and lubricating oil. Dipper needles on the con-rod ends fling oil mist onto cylinder walls and wrist pins.',
        functionHi: 'क्रैंकशाफ्ट और ल्यूब्रिकेंट ऑयल को सुरक्षित रखता है। स्पलैश सिस्टम से सभी गतिशील पुर्जों में तेल की परत बनाए रखता है।',
        explodeOffset: [0, -0.35, 0]
      }
    ]
  },

  gearbox: {
    id: 'gearbox',
    title: 'Automotive Manual Transmission Gearbox',
    titleHi: 'ऑटोमोबाइल मैनुअल ट्रांसमिशन गियरबॉक्स',
    category: 'Automobile Mechanic / MMV / Diploma Mechanical',
    categoryHi: 'ऑटोमोबाइल मैकेनिक / एमएमवी',
    scaleDefault: 0.5,
    components: [
      {
        id: 'inputShaft',
        name: 'Clutch Input Shaft & Primary Pinion',
        nameHi: 'क्लच इनपुट शाफ्ट और मुख्य पिनियन',
        material: 'Case-Hardened Alloy Steel (20MnCr5, 58–62 HRC)',
        materialHi: 'केस-हार्डन्ड अलॉय स्टील',
        function: 'Receives engine torque from the friction clutch and transmits motion directly to the countershaft constant-mesh gear.',
        functionHi: 'क्लच से इंजन टॉर्क प्राप्त करता है और काउंटरशाफ्ट के मुख्य गियर को निरंतर शक्ति प्रदान करता है।',
        explodeOffset: [0, 0, 0.45]
      },
      {
        id: 'countershaft',
        name: 'Countershaft (Layshaft) Cluster',
        nameHi: 'काउंटरशाफ्ट (लेशाफ्ट गियर क्लस्टर)',
        material: 'Single-Piece Forged Alloy Steel with Helical Teeth',
        materialHi: 'हेलिकल दांतों वाली जालीदार मिश्र धातु',
        function: 'Carries 1st, 2nd, 3rd, 4th and Reverse gear pinions of graduated teeth counts for torque multiplication and speed reduction.',
        functionHi: 'विभिन्न आकारों के गियर रखता है जो वाहन की गति और ताकत (टॉर्क) को आवश्यकतानुसार बदलते हैं।',
        explodeOffset: [0, -0.35, 0]
      },
      {
        id: 'shiftFork',
        name: 'Synchronizer Ring & Selector Fork',
        nameHi: 'सिंक्रोनाइज़र रिंग और गियर शिफ्टर फॉर्क',
        material: 'Phosphor Bronze Ring & Forged Steel Fork',
        materialHi: 'फॉस्फोर ब्रॉन्ज और फोर्ज्ड स्टील',
        function: 'Matches the rotational speeds of the gear and shaft using frictional cone surfaces before dog teeth engage, completely eliminating gear grinding.',
        functionHi: 'गियर बदलते समय दांतों को आपस में टकराने से रोकता है और बिना आवाज चिकनाई से नया गियर लॉक करता है।',
        explodeOffset: [0, 0.35, 0]
      }
    ]
  }
}
