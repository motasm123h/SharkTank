import { count, money, monthlyRevenue, score } from "../helpers";
import { l } from "../localize";
import type { MockScenario } from "../scenario";

const USD = "USD";
const PRICED_IN_SYP = l(
  "Charged in Syrian pounds at the day's market rate; shown in USD because SYP prices change often.",
  "يُدفع بالليرة السورية حسب سعر السوق اليومي؛ معروض بالدولار لأن أسعار الليرة تتغير كثيرًا.",
);

export const damascusHealthyFood: MockScenario = {
  id: "damascus-healthy-food",
  countries: ["SY"],
  input: {
    idea: l(
      "A healthy meal-prep delivery service in Damascus: weekly subscription boxes of balanced, portion-controlled meals (grilled chicken, freekeh, salads, low-sugar desserts), ordered on WhatsApp and delivered by our own motorbike couriers, paid cash on delivery.",
      "خدمة توصيل وجبات صحية مُحضّرة مسبقًا في دمشق: صناديق اشتراك أسبوعية لوجبات متوازنة ومحسوبة الكمية (دجاج مشوي، فريكة، سلطات، حلويات قليلة السكر)، يُطلب عبر واتساب ويوصلها سائقو دراجات نارية تابعون لنا، والدفع نقدًا عند الاستلام.",
    ),
    country: "SY",
    city: l("Damascus", "دمشق"),
    budget: { min: 3000, max: 8000, currency: USD },
    mode: "online",
    stage: "idea",
  },

  questions: [
    {
      id: "q1",
      judgeId: "investor",
      text: l(
        "How many weekly subscribers do you need to cover your kitchen and delivery costs, and how fast can you get there?",
        "كم مشتركًا أسبوعيًا تحتاج لتغطية تكاليف المطبخ والتوصيل، وبأي سرعة يمكنك الوصول إلى هذا الرقم؟",
      ),
      ack: l("Clear. I'll hold you to that number.", "واضح. سأحاسبك على هذا الرقم."),
      reactions: { finance: "thinking", skeptic: "skeptical" },
    },
    {
      id: "q2",
      judgeId: "local",
      text: l(
        "Most families in Damascus cook at home, and many households live on tight incomes. Who exactly is your customer: which neighborhoods, which jobs?",
        "معظم العائلات في دمشق تطبخ في البيت، وكثير من الأسر دخلها محدود. من هو زبونك بالضبط: أي أحياء وأي مهن؟",
      ),
      ack: l(
        "Good. Mezzeh, Malki and Abu Rummaneh are where I'd start too.",
        "جيد. المزة والمالكي وأبو رمانة هي المناطق التي كنت سأبدأ بها أيضًا.",
      ),
      reactions: { marketing: "happy", investor: "thinking" },
    },
    {
      id: "q3",
      judgeId: "marketing",
      text: l(
        "Would you rather spend your first $500 on Instagram ads, or on free boxes for gym coaches and food bloggers in Damascus?",
        "هل تفضّل إنفاق أول 500 دولار على إعلانات إنستغرام، أم على صناديق مجانية لمدربي النوادي الرياضية ومدوّني الطعام في دمشق؟",
      ),
      ack: l(
        "Interesting choice. Trust travels fast through coaches here.",
        "اختيار مثير للاهتمام. الثقة تنتقل بسرعة عبر المدربين هنا.",
      ),
      reactions: { local: "happy", skeptic: "thinking" },
    },
    {
      id: "q4",
      judgeId: "finance",
      text: l(
        "Food prices in Syria move fast. If chicken and olive oil rise 20% next month, how do you protect your margin when customers prepaid a weekly price?",
        "أسعار الغذاء في سوريا تتغير بسرعة. إذا ارتفع سعر الدجاج وزيت الزيتون 20% الشهر القادم، كيف تحمي هامش ربحك وقد دفع الزبائن سعرًا أسبوعيًا مسبقًا؟",
      ),
      ack: l(
        "A weekly price review is sensible. Tell customers about it up front.",
        "مراجعة الأسعار أسبوعيًا فكرة معقولة. أخبر الزبائن بها من البداية.",
      ),
      reactions: { investor: "happy", skeptic: "skeptical" },
    },
    {
      id: "q5",
      judgeId: "skeptic",
      text: l(
        "Power cuts and fuel shortages are part of daily life. What happens to your cold chain and your couriers in a bad week?",
        "انقطاع الكهرباء ونقص الوقود جزء من الحياة اليومية. ماذا يحدث لسلسلة التبريد وللسائقين في أسبوع سيئ؟",
      ),
      ack: l(
        "A generator plan is a start. I'm still worried.",
        "خطة المولّدة بداية، لكنني ما زلت قلقًا.",
      ),
      reactions: { finance: "thinking", local: "thinking" },
    },
  ],

  debate: [
    {
      id: "d1",
      judgeId: "investor",
      stance: "opens",
      text: l(
        "The unit economics can work at around 60 weekly subscribers. The real question is whether they stay after the first month.",
        "اقتصاديات الوحدة يمكن أن تنجح عند نحو 60 مشتركًا أسبوعيًا. السؤال الحقيقي: هل سيبقون بعد الشهر الأول؟",
      ),
    },
    {
      id: "d2",
      judgeId: "skeptic",
      stance: "disagrees",
      replyTo: { turnId: "d1", judgeId: "investor" },
      text: l(
        "Sixty subscribers paying cash, in a city with long power cuts? One spoiled batch and the story spreads on WhatsApp within hours.",
        "ستون مشتركًا يدفعون نقدًا، في مدينة فيها انقطاعات كهرباء طويلة؟ دفعة واحدة فاسدة وتنتشر القصة على واتساب خلال ساعات.",
      ),
    },
    {
      id: "d3",
      judgeId: "local",
      stance: "builds_on",
      replyTo: { turnId: "d2", judgeId: "skeptic" },
      text: l(
        "That word of mouth cuts both ways. In Damascus, a recommendation in a family WhatsApp group is worth more than any ad. Good food spreads just as fast.",
        "الكلام المتناقل سلاح ذو حدين. في دمشق، توصية في مجموعة واتساب عائلية تساوي أكثر من أي إعلان، والطعام الجيد ينتشر بالسرعة نفسها.",
      ),
    },
    {
      id: "d4",
      judgeId: "marketing",
      stance: "agrees",
      replyTo: { turnId: "d3", judgeId: "local" },
      text: l(
        "Agreed. Skip broad Meta ads at first. Seed 30 fitness coaches and nutritionists, then retarget their followers on Instagram with a small budget.",
        "أوافق. تجاهل إعلانات ميتا الواسعة في البداية. ابدأ بثلاثين مدربًا وأخصائي تغذية، ثم استهدف متابعيهم على إنستغرام بميزانية صغيرة.",
      ),
    },
    {
      id: "d5",
      judgeId: "finance",
      stance: "disagrees",
      replyTo: { turnId: "d1", judgeId: "investor" },
      text: l(
        "I'm less optimistic about the margin. With cash on delivery and your own couriers, I'd assume 15 to 20 percent at best until volume grows.",
        "أنا أقل تفاؤلًا بشأن الهامش. مع الدفع عند الاستلام وسائقين خاصين بك، أتوقع 15 إلى 20 بالمئة في أحسن الأحوال حتى يكبر الحجم.",
      ),
    },
    {
      id: "d6",
      judgeId: "investor",
      stance: "builds_on",
      replyTo: { turnId: "d5", judgeId: "finance" },
      text: l(
        "Fair. Then start with pickup shelves at partner gyms to cut delivery costs, and add home delivery once routes are dense.",
        "منطقي. إذن ابدأ برفوف استلام في نوادٍ رياضية شريكة لتخفيض تكلفة التوصيل، وأضف التوصيل للمنازل عندما تزدحم المسارات بالطلبات.",
      ),
    },
  ],

  verdicts: [
    {
      judgeId: "investor",
      decision: "in",
      reason: l(
        "Real demand from health-conscious professionals, and it can start lean.",
        "هناك طلب حقيقي من المهنيين المهتمين بصحتهم، ويمكن البدء بتكلفة منخفضة.",
      ),
    },
    {
      judgeId: "local",
      decision: "in",
      reason: l(
        "It fits how Damascus buys: WhatsApp orders and cash on delivery.",
        "تناسب طريقة الشراء في دمشق: طلب عبر واتساب ودفع نقدي عند الاستلام.",
      ),
    },
    {
      judgeId: "marketing",
      decision: "in",
      reason: l(
        "Coaches and word of mouth can bring cheap first customers.",
        "المدربون والكلام المتناقل يمكن أن يجلبوا أول الزبائن بتكلفة قليلة.",
      ),
    },
    {
      judgeId: "finance",
      decision: "out",
      reason: l(
        "Margins are too thin to absorb food-price swings yet.",
        "الهوامش ما زالت أضعف من أن تتحمل تقلبات أسعار الغذاء.",
      ),
    },
    {
      judgeId: "skeptic",
      decision: "out",
      reason: l(
        "Power and fuel problems could break the cold chain.",
        "مشاكل الكهرباء والوقود قد تكسر سلسلة التبريد.",
      ),
    },
  ],

  report: {
    overallScore: score(64),
    scoreBreakdown: {
      demand: score(7),
      competition: score(6),
      purchasingPower: score(4),
      easeOfLaunch: score(6),
      scalability: score(5),
    },
    canSell: {
      verdict: "conditional",
      summary: l(
        "Yes, to a narrow audience first: health-conscious professionals and gym-goers in central Damascus, as long as operations stay lean and prices are reviewed weekly.",
        "نعم، لجمهور محدود في البداية: المهنيون المهتمون بصحتهم ورواد النوادي الرياضية في وسط دمشق، بشرط إبقاء التشغيل بسيطًا ومراجعة الأسعار أسبوعيًا.",
      ),
    },
    salesPlan: {
      price: money(18, USD, {
        low: 15,
        high: 22,
        note: l(
          "Per weekly box of 5 lunches. Charged in Syrian pounds at the day's market rate.",
          "لكل صندوق أسبوعي من 5 وجبات غداء. يُدفع بالليرة السورية حسب سعر السوق اليومي.",
        ),
      }),
      pricingRationale: l(
        "Priced just above a restaurant lunch so it feels like an upgrade, not a luxury, for the target neighborhoods.",
        "السعر أعلى بقليل من وجبة غداء في مطعم، ليبدو ترقيةً لا رفاهية في الأحياء المستهدفة.",
      ),
      channels: [
        l("WhatsApp Business catalog and broadcast lists", "كتالوج واتساب للأعمال وقوائم البث"),
        l("Instagram posts from partner coaches", "منشورات المدربين الشركاء على إنستغرام"),
        l("Pickup shelves at partner gyms", "رفوف استلام في النوادي الرياضية الشريكة"),
      ],
      firstCustomers: [
        l("Members of 5 gyms in Mezzeh and Malki", "أعضاء 5 نوادٍ رياضية في المزة والمالكي"),
        l(
          "Staff at NGOs and private companies around Abu Rummaneh",
          "موظفو المنظمات والشركات الخاصة حول أبو رمانة",
        ),
        l("Followers of local fitness coaches", "متابعو مدربي اللياقة المحليين"),
      ],
    },
    whatMustChange: [
      l(
        "Secure backup power and ice packs before taking prepaid orders.",
        "تأمين كهرباء احتياطية وأكياس ثلج قبل قبول الطلبات المدفوعة مسبقًا.",
      ),
    ],
    keyFigures: [
      {
        label: l(
          "Reachable health-focused customers in central Damascus",
          "الزبائن المهتمون بالصحة الذين يمكن الوصول إليهم في وسط دمشق",
        ),
        figure: count(15000, { low: 8000, high: 25000 }),
      },
      {
        label: l(
          "Weekly subscribers needed to break even",
          "عدد المشتركين الأسبوعيين اللازم لتغطية التكاليف",
        ),
        figure: count(60, { low: 45, high: 80 }),
      },
    ],
    salesScenarios: [
      {
        kind: "pessimistic",
        monthly: monthlyRevenue(500, 0.08, USD),
        assumptions: [
          l(
            "Slow word of mouth, many one-time buyers",
            "انتشار بطيء بالكلام المتناقل وكثير من المشترين لمرة واحدة",
          ),
          l(
            "Frequent price changes push some customers away",
            "تغيّر الأسعار المتكرر يُبعد بعض الزبائن",
          ),
        ],
      },
      {
        kind: "realistic",
        monthly: monthlyRevenue(800, 0.18, USD),
        assumptions: [
          l(
            "Coach partnerships bring 5–8 new subscribers a week",
            "شراكات المدربين تجلب 5–8 مشتركين جدد أسبوعيًا",
          ),
          l(
            "About half of subscribers renew after month one",
            "نحو نصف المشتركين يجددون بعد الشهر الأول",
          ),
        ],
      },
      {
        kind: "optimistic",
        monthly: monthlyRevenue(1200, 0.2, USD),
        assumptions: [
          l("An office lunch contract within 3 months", "عقد وجبات غداء لمكتب خلال 3 أشهر"),
          l("Strong referrals in family WhatsApp groups", "توصيات قوية في مجموعات واتساب العائلية"),
        ],
      },
    ],
    successReasons: [
      l(
        "Growing interest in fitness and healthy eating among young professionals.",
        "اهتمام متزايد باللياقة والأكل الصحي بين المهنيين الشباب.",
      ),
      l(
        "Few dedicated meal-prep services in Damascus.",
        "قلة خدمات الوجبات الصحية المخصصة في دمشق.",
      ),
      l(
        "WhatsApp ordering and cash on delivery match local habits.",
        "الطلب عبر واتساب والدفع عند الاستلام يناسبان العادات المحلية.",
      ),
    ],
    failureReasons: [
      l(
        "Limited purchasing power outside a few neighborhoods.",
        "قدرة شرائية محدودة خارج بعض الأحياء.",
      ),
      l("Power cuts threaten food safety.", "انقطاع الكهرباء يهدد سلامة الطعام."),
      l("Volatile ingredient prices squeeze margins.", "تقلّب أسعار المكونات يضغط على الهوامش."),
    ],
    marketing: {
      summary: l(
        "Lead with trusted people, not ads: coaches, nutritionists and WhatsApp groups. Use paid Meta ads later, only to retarget warm audiences.",
        "ابدأ بأشخاص موثوقين لا بالإعلانات: المدربون وأخصائيو التغذية ومجموعات واتساب. استخدم إعلانات ميتا لاحقًا فقط لإعادة استهداف جمهور مهتم.",
      ),
      channels: [
        {
          channel: "influencers",
          priority: 1,
          monthlyBudget: money(200, USD, { note: PRICED_IN_SYP }),
          expectedCac: money(6, USD),
          rationale: l(
            "Free boxes for 30 gym coaches and nutritionists; their recommendations are trusted.",
            "صناديق مجانية لثلاثين مدربًا وأخصائي تغذية؛ توصياتهم موثوقة.",
          ),
        },
        {
          channel: "whatsapp",
          priority: 2,
          monthlyBudget: money(50, USD),
          expectedCac: money(3, USD),
          rationale: l(
            "Catalog, weekly menu broadcasts and a referral discount for family groups.",
            "كتالوج، وبث القائمة الأسبوعية، وخصم إحالة لمجموعات العائلة.",
          ),
        },
        {
          channel: "meta_ads",
          priority: 3,
          monthlyBudget: money(150, USD),
          expectedCac: money(10, USD),
          rationale: l(
            "Small Instagram retargeting only. Paying for Meta ads from Syria often needs an agency or someone abroad, because international card payments are limited.",
            "إعادة استهداف صغيرة على إنستغرام فقط. الدفع لإعلانات ميتا من سوريا يحتاج غالبًا إلى وكالة أو شخص في الخارج، لأن الدفع بالبطاقات الدولية محدود.",
          ),
        },
        {
          channel: "offline",
          priority: 4,
          monthlyBudget: money(100, USD),
          rationale: l(
            "Tasting stands and flyers at partner gyms.",
            "منصات تذوّق ومنشورات ورقية في النوادي الشريكة.",
          ),
        },
      ],
      totalMonthlyBudget: money(500, USD),
    },
    location: {
      recommendation: "hybrid",
      rationale: l(
        "Cook in a small licensed kitchen with no storefront, deliver to homes, and add pickup shelves at gyms to cut delivery costs.",
        "اطبخ في مطبخ صغير مرخّص دون واجهة محل، وأوصل للمنازل، وأضف رفوف استلام في النوادي لتقليل تكلفة التوصيل.",
      ),
    },
    timing: {
      verdict: "right_time",
      rationale: l(
        "Interest in fitness is rising and few competitors exist, though spending power is still limited.",
        "الاهتمام باللياقة في ازدياد والمنافسون قليلون، مع أن القدرة الشرائية ما زالت محدودة.",
      ),
      signals: [
        l(
          "New gyms opening in central neighborhoods",
          "افتتاح نوادٍ رياضية جديدة في الأحياء المركزية",
        ),
        l(
          "Home cooks already selling meals in Facebook groups",
          "طهاة منزليون يبيعون وجبات في مجموعات فيسبوك",
        ),
      ],
    },
    localContext: {
      paymentMethods: [
        l("Cash on delivery (most common)", "الدفع نقدًا عند الاستلام (الأكثر شيوعًا)"),
        l(
          "Mobile wallets such as Syriatel Cash and MTN Cash",
          "المحافظ الإلكترونية مثل سيريتل كاش وMTN كاش",
        ),
      ],
      platforms: [
        l("WhatsApp", "واتساب"),
        l("Facebook", "فيسبوك"),
        l("Instagram", "إنستغرام"),
        l("Telegram", "تيليغرام"),
      ],
      realities: [
        l(
          "Daily power cuts; plan for generators and cool boxes.",
          "انقطاع يومي للكهرباء؛ خطط لمولّدة وصناديق تبريد.",
        ),
        l(
          "Prices in Syrian pounds change often; many businesses review them weekly.",
          "الأسعار بالليرة السورية تتغير كثيرًا؛ كثير من المحلات تراجعها أسبوعيًا.",
        ),
        l(
          "Motorbike couriers are the norm for deliveries.",
          "التوصيل بالدراجات النارية هو المعتاد.",
        ),
      ],
    },
    globalFit: [
      {
        country: "SY",
        fit: score(64),
        reason: l(
          "Low competition, but limited spending power.",
          "منافسة قليلة، لكن القدرة الشرائية محدودة.",
        ),
      },
      {
        country: "JO",
        fit: score(72),
        reason: l(
          "Similar food culture, more card payments in Amman.",
          "ثقافة طعام مشابهة، والدفع بالبطاقات أكثر في عمّان.",
        ),
      },
      {
        country: "LB",
        fit: score(68),
        reason: l(
          "Health-aware customers in Beirut, but a crowded market.",
          "زبائن مهتمون بالصحة في بيروت، لكن السوق مزدحم.",
        ),
      },
      {
        country: "IQ",
        fit: score(66),
        reason: l(
          "Growing middle class in Baghdad and Erbil.",
          "طبقة وسطى متنامية في بغداد وأربيل.",
        ),
      },
      {
        country: "TR",
        fit: score(58),
        reason: l(
          "Strong demand, but many established meal brands.",
          "طلب قوي، لكن هناك علامات وجبات راسخة كثيرة.",
        ),
      },
      {
        country: "AE",
        fit: score(52),
        reason: l(
          "Big demand but very crowded with meal-plan brands.",
          "طلب كبير لكن السوق مزدحم جدًا بعلامات خطط الوجبات.",
        ),
      },
    ],
    similarIdeas: [
      {
        name: l("Home cooks on Facebook groups", "طهاة منزليون في مجموعات فيسبوك"),
        description: l(
          "Informal sellers in Damascus offering daily home-cooked meals; cheap but inconsistent and rarely health-focused.",
          "بائعون غير رسميين في دمشق يقدمون وجبات منزلية يومية؛ رخيصة لكنها غير ثابتة الجودة ونادرًا ما تركز على الصحة.",
        ),
        country: "SY",
        status: "active",
      },
      {
        name: "Kcal",
        description: l(
          "Healthy meal-plan brand in the UAE with subscriptions and delivery; a model for premium positioning.",
          "علامة خطط وجبات صحية في الإمارات بالاشتراك والتوصيل؛ نموذج للتموضع المميز.",
        ),
        country: "AE",
        status: "active",
      },
      {
        name: "Right Bite",
        description: l(
          "Long-running UAE nutrition and meal-plan service, built around dietitian-designed menus.",
          "خدمة تغذية وخطط وجبات قديمة في الإمارات، قائمة على قوائم يصممها أخصائيو تغذية.",
        ),
        country: "AE",
        status: "active",
      },
    ],
    improvements: [
      l(
        "Start with office lunch boxes on weekdays: fixed routes and bulk orders.",
        "ابدأ بصناديق غداء للمكاتب في أيام العمل: مسارات ثابتة وطلبات بالجملة.",
      ),
      l(
        "Offer a 3-day trial box to lower the first-purchase risk.",
        "قدّم صندوق تجربة لثلاثة أيام لتقليل مخاطرة الشراء الأول.",
      ),
      l(
        "Print calories and protein on every box; it's your proof of being 'healthy'.",
        "اطبع السعرات والبروتين على كل صندوق؛ هذا دليلك على أنك 'صحي'.",
      ),
      l(
        "Use reusable insulated bags with a deposit.",
        "استخدم حقائب معزولة قابلة لإعادة الاستخدام مقابل تأمين.",
      ),
    ],
    nextSteps: [
      {
        title: l("Cook a tasting batch for 20 people", "اطبخ دفعة تذوّق لعشرين شخصًا"),
        detail: l(
          "Invite gym members and friends, collect honest feedback and ask what they would pay.",
          "ادعُ أعضاء نوادٍ رياضية وأصدقاء، واجمع آراء صريحة واسأل كم سيدفعون.",
        ),
      },
      {
        title: l("Talk to 3 gym owners in Mezzeh", "تحدّث مع 3 أصحاب نوادٍ رياضية في المزة"),
        detail: l(
          "Propose a pickup shelf and a member discount in exchange for promotion.",
          "اقترح رف استلام وخصمًا للأعضاء مقابل الترويج.",
        ),
      },
      {
        title: l("Set up a WhatsApp Business catalog", "أنشئ كتالوج واتساب للأعمال"),
        detail: l(
          "List the weekly menu with prices in Syrian pounds and a simple order format.",
          "اعرض القائمة الأسبوعية بأسعار بالليرة السورية وبطريقة طلب بسيطة.",
        ),
      },
    ],
  },
};
