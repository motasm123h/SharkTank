import { count, money, monthlyRevenue, percent, score } from "../helpers";
import { l } from "../localize";
import type { MockScenario } from "../scenario";

const EGP = "EGP";

/** The deliberately weak idea: should get mostly "I'm out". */
export const cairoWaterApp: MockScenario = {
  id: "cairo-water-app",
  countries: ["EG"],
  input: {
    idea: l(
      "A mobile app that reminds people in Cairo to drink water during the day, with streaks and badges, sold as a subscription for 149 EGP a month.",
      "تطبيق جوال يذكّر الناس في القاهرة بشرب الماء خلال اليوم، مع سلاسل إنجاز وشارات، ويُباع باشتراك 149 جنيهًا شهريًا.",
    ),
    country: "EG",
    city: l("Cairo", "القاهرة"),
    budget: { min: 20000, max: 50000, currency: EGP },
    mode: "online",
    stage: "idea",
  },

  questions: [
    {
      id: "q1",
      judgeId: "investor",
      text: l(
        "Phones already have free water-reminder apps. What does someone get for 149 pounds a month that they can't get for free?",
        "الهواتف فيها أصلًا تطبيقات مجانية للتذكير بشرب الماء. ماذا سيحصل المستخدم مقابل 149 جنيهًا شهريًا ولا يجده مجانًا؟",
      ),
      ack: l(
        "Streaks and badges are features, not a business.",
        "سلاسل الإنجاز والشارات ميزات، وليست مشروعًا.",
      ),
      reactions: { skeptic: "skeptical", finance: "skeptical" },
    },
    {
      id: "q2",
      judgeId: "local",
      text: l(
        "Have you asked people in Cairo whether they'd pay monthly for an app? Most people here don't pay for apps at all.",
        "هل سألت الناس في القاهرة إن كانوا سيدفعون شهريًا لتطبيق؟ معظم الناس هنا لا يدفعون للتطبيقات أصلًا.",
      ),
      ack: l(
        "Friends saying 'nice idea' is not the same as paying.",
        "أن يقول الأصدقاء 'فكرة حلوة' ليس مثل أن يدفعوا.",
      ),
      reactions: { investor: "thinking", marketing: "skeptical" },
    },
    {
      id: "q3",
      judgeId: "marketing",
      text: l(
        "Who would you target first, and why would they tell their friends about it?",
        "من ستستهدف أولًا، ولماذا سيخبرون أصدقاءهم عن التطبيق؟",
      ),
      ack: l(
        '"Everyone who drinks water" is not a target audience.',
        '"كل من يشرب الماء" ليس جمهورًا مستهدفًا.',
      ),
      reactions: { skeptic: "skeptical", local: "thinking" },
    },
    {
      id: "q4",
      judgeId: "finance",
      text: l(
        "Google Play takes a cut, and many users here can't pay in-app easily. How will you collect 149 pounds every month?",
        "متجر جوجل يأخذ نسبة، وكثير من المستخدمين هنا لا يستطيعون الدفع داخل التطبيق بسهولة. كيف ستحصّل 149 جنيهًا كل شهر؟",
      ),
      ack: l(
        "Fawry or wallets could help, but expect heavy churn.",
        "فوري أو المحافظ قد تساعد، لكن توقع نسبة إلغاء عالية.",
      ),
      reactions: { investor: "skeptical" },
    },
    {
      id: "q5",
      judgeId: "skeptic",
      text: l(
        "What stops a user from cancelling after the first week, once the novelty is gone?",
        "ما الذي يمنع المستخدم من الإلغاء بعد الأسبوع الأول، عندما تزول متعة التجربة؟",
      ),
      ack: l(
        "That's the core problem, and I don't hear a solution.",
        "هذه هي المشكلة الأساسية، ولا أسمع حلًا لها.",
      ),
      reactions: { investor: "skeptical", finance: "skeptical", marketing: "thinking" },
    },
  ],

  debate: [
    {
      id: "d1",
      judgeId: "skeptic",
      stance: "opens",
      text: l(
        "This is a feature, not a company. Free apps and smartwatches already do it.",
        "هذه ميزة وليست شركة. التطبيقات المجانية والساعات الذكية تفعل ذلك أصلًا.",
      ),
    },
    {
      id: "d2",
      judgeId: "investor",
      stance: "agrees",
      replyTo: { turnId: "d1", judgeId: "skeptic" },
      text: l(
        "Agreed. I can't see a path to paying users at this price.",
        "أوافق. لا أرى طريقًا للحصول على مستخدمين يدفعون بهذا السعر.",
      ),
    },
    {
      id: "d3",
      judgeId: "local",
      stance: "builds_on",
      replyTo: { turnId: "d1", judgeId: "skeptic" },
      text: l(
        "In Cairo's summer heat, hydration matters, but people won't pay an app for it. Companies might pay for their staff, though.",
        "في حرّ صيف القاهرة، شرب الماء مهم، لكن الناس لن يدفعوا لتطبيق من أجله. ربما تدفع الشركات لموظفيها.",
      ),
    },
    {
      id: "d4",
      judgeId: "marketing",
      stance: "builds_on",
      replyTo: { turnId: "d3", judgeId: "local" },
      text: l(
        "That corporate angle is the only story I could sell: a wellness challenge for offices, not a consumer subscription.",
        "هذه الزاوية المؤسسية هي القصة الوحيدة التي يمكنني بيعها: تحدٍّ صحي للمكاتب، لا اشتراك للمستهلكين.",
      ),
    },
    {
      id: "d5",
      judgeId: "finance",
      stance: "disagrees",
      replyTo: { turnId: "d4", judgeId: "marketing" },
      text: l(
        "Corporate wellness budgets in Egypt are small. I'd need to see three companies ready to pay before I believe it.",
        "ميزانيات الصحة المؤسسية في مصر صغيرة. أحتاج أن أرى ثلاث شركات مستعدة للدفع قبل أن أصدّق ذلك.",
      ),
    },
    {
      id: "d6",
      judgeId: "local",
      stance: "disagrees",
      replyTo: { turnId: "d5", judgeId: "finance" },
      text: l(
        "Some multinationals in Smart Village and New Cairo already run wellness programs. It's narrow, but it's real.",
        "بعض الشركات متعددة الجنسيات في القرية الذكية والقاهرة الجديدة لديها برامج صحية بالفعل. السوق ضيق، لكنه حقيقي.",
      ),
    },
  ],

  verdicts: [
    {
      judgeId: "investor",
      decision: "out",
      reason: l(
        "No reason to pay when free apps do the same.",
        "لا سبب للدفع والتطبيقات المجانية تقوم بالشيء نفسه.",
      ),
    },
    {
      judgeId: "local",
      decision: "in",
      reason: l(
        "Only as a corporate wellness pilot for Cairo offices.",
        "فقط كتجربة صحية مؤسسية لمكاتب القاهرة.",
      ),
    },
    {
      judgeId: "marketing",
      decision: "out",
      reason: l("No clear audience or story to sell.", "لا جمهور واضح ولا قصة يمكن بيعها."),
    },
    {
      judgeId: "finance",
      decision: "out",
      reason: l(
        "Monthly billing in Egypt will bring heavy churn.",
        "الاشتراك الشهري في مصر سيؤدي إلى نسبة إلغاء عالية.",
      ),
    },
    {
      judgeId: "skeptic",
      decision: "out",
      reason: l("A feature, not a business.", "ميزة، وليست مشروعًا."),
    },
  ],

  report: {
    overallScore: score(28),
    scoreBreakdown: {
      demand: score(3),
      competition: score(2),
      purchasingPower: score(3),
      easeOfLaunch: score(7),
      scalability: score(4),
    },
    canSell: {
      verdict: "no",
      summary: l(
        "Not as a consumer subscription. Free alternatives do the same job, and few people in Egypt pay monthly for apps. The only opening is selling to companies.",
        "ليس كاشتراك للمستهلكين. البدائل المجانية تؤدي المهمة نفسها، وقليلون في مصر يدفعون شهريًا للتطبيقات. الفرصة الوحيدة هي البيع للشركات.",
      ),
    },
    whatMustChange: [
      l(
        "Sell to companies as a team wellness challenge instead of to individuals.",
        "البيع للشركات كتحدٍّ صحي للفرق بدل البيع للأفراد.",
      ),
      l(
        "Make the consumer app free and earn from sponsors such as bottled-water brands.",
        "اجعل التطبيق مجانيًا للمستهلكين واربح من رعاة مثل شركات المياه المعبأة.",
      ),
      l(
        "Prove demand with 3 paying companies before building more features.",
        "أثبت الطلب بثلاث شركات تدفع قبل بناء ميزات إضافية.",
      ),
    ],
    keyFigures: [
      {
        label: l(
          "Share of users likely to pay after a free trial",
          "نسبة المستخدمين المتوقع أن يدفعوا بعد التجربة المجانية",
        ),
        figure: percent(1.5, { low: 0.5, high: 3 }),
      },
      {
        label: l(
          "Large offices in Smart Village and New Cairo that could buy a pilot",
          "المكاتب الكبيرة في القرية الذكية والقاهرة الجديدة التي قد تشتري تجربة",
        ),
        figure: count(150, { low: 80, high: 250 }),
      },
    ],
    salesScenarios: [
      {
        kind: "pessimistic",
        monthly: monthlyRevenue(600, -0.06, EGP),
        assumptions: [
          l("Users cancel after the first month", "المستخدمون يلغون بعد الشهر الأول"),
          l("No company pilots", "لا توجد تجارب مع شركات"),
        ],
      },
      {
        kind: "realistic",
        monthly: monthlyRevenue(1500, 0.04, EGP),
        assumptions: [
          l("A few dozen paying users at most", "بضع عشرات من المستخدمين الدافعين على الأكثر"),
          l("High monthly churn", "نسبة إلغاء شهرية مرتفعة"),
        ],
      },
      {
        kind: "optimistic",
        monthly: monthlyRevenue(4000, 0.08, EGP),
        assumptions: [
          l("One or two small company pilots", "تجربة أو اثنتان مع شركات صغيرة"),
          l("A sponsor covers part of the costs", "راعٍ يغطي جزءًا من التكاليف"),
        ],
      },
    ],
    successReasons: [
      l("Cheap and fast to build.", "بناؤه رخيص وسريع."),
      l(
        "Hydration is a real concern in Cairo's summer.",
        "شرب الماء مصدر قلق حقيقي في صيف القاهرة.",
      ),
    ],
    failureReasons: [
      l(
        "Free apps and phone health features already do this.",
        "التطبيقات المجانية وميزات الصحة في الهواتف تقوم بذلك أصلًا.",
      ),
      l(
        "Most people in Egypt don't pay for app subscriptions.",
        "معظم الناس في مصر لا يدفعون لاشتراكات التطبيقات.",
      ),
      l(
        "Novelty fades fast; churn will be high.",
        "متعة التجربة تزول بسرعة؛ ونسبة الإلغاء ستكون عالية.",
      ),
      l("No clear target customer.", "لا يوجد زبون مستهدف واضح."),
    ],
    marketing: {
      summary: l(
        "Don't spend on ads for the consumer app. If you pivot, sell directly to HR teams and use a small budget to test the message.",
        "لا تنفق على إعلانات تطبيق المستهلكين. إذا غيّرت الاتجاه، بِع مباشرة لفرق الموارد البشرية واستخدم ميزانية صغيرة لاختبار الرسالة.",
      ),
      channels: [
        {
          channel: "partnerships",
          priority: 1,
          monthlyBudget: money(3000, EGP),
          rationale: l(
            "Direct outreach to HR teams in Smart Village and New Cairo.",
            "تواصل مباشر مع فرق الموارد البشرية في القرية الذكية والقاهرة الجديدة.",
          ),
        },
        {
          channel: "meta_ads",
          priority: 2,
          monthlyBudget: money(8000, EGP),
          expectedCac: money(400, EGP, {
            note: l(
              "Per paying user; likely higher than what they pay before cancelling.",
              "لكل مستخدم دافع؛ غالبًا أعلى مما يدفعه قبل أن يلغي.",
            ),
          }),
          rationale: l(
            "Only as a short test of whether anyone clicks 'subscribe'.",
            "فقط كاختبار قصير لمعرفة إن كان أحد سيضغط 'اشترك'.",
          ),
        },
        {
          channel: "influencers",
          priority: 3,
          monthlyBudget: money(6000, EGP),
          expectedCac: money(350, EGP),
          rationale: l(
            "Fitness creators on TikTok and Instagram, for a summer challenge.",
            "صانعو محتوى اللياقة على تيك توك وإنستغرام، لتحدٍّ صيفي.",
          ),
        },
      ],
      totalMonthlyBudget: money(17000, EGP),
    },
    location: {
      recommendation: "online",
      rationale: l(
        "It's an app; no physical location is needed.",
        "إنه تطبيق؛ لا حاجة لمكان فعلي.",
      ),
    },
    timing: {
      verdict: "late",
      rationale: l(
        "Water reminders are already built into free apps and wearables; the consumer market is saturated.",
        "التذكير بشرب الماء موجود أصلًا في تطبيقات مجانية وأجهزة قابلة للارتداء؛ سوق المستهلكين مشبع.",
      ),
      signals: [
        l(
          "Dozens of free reminder apps in the stores",
          "عشرات تطبيقات التذكير المجانية في المتاجر",
        ),
        l(
          "Health apps on phones already track water",
          "تطبيقات الصحة في الهواتف تتابع شرب الماء بالفعل",
        ),
      ],
    },
    localContext: {
      paymentMethods: [
        l("Fawry payment points", "منافذ الدفع فوري"),
        l("Mobile wallets such as Vodafone Cash", "المحافظ الإلكترونية مثل فودافون كاش"),
        l("InstaPay bank transfers", "التحويلات البنكية عبر إنستاباي"),
        l("Cards, used by a minority", "البطاقات، يستخدمها عدد قليل"),
      ],
      platforms: [
        l("Facebook", "فيسبوك"),
        l("WhatsApp", "واتساب"),
        l("TikTok", "تيك توك"),
        l("Instagram", "إنستغرام"),
      ],
      realities: [
        l(
          "Few people pay for apps; free with ads is the norm.",
          "قليلون يدفعون للتطبيقات؛ المجاني مع الإعلانات هو السائد.",
        ),
        l(
          "Price sensitivity is high after recent rises in the cost of living.",
          "الحساسية للأسعار عالية بعد ارتفاع تكاليف المعيشة مؤخرًا.",
        ),
      ],
    },
    globalFit: [
      {
        country: "EG",
        fit: score(28),
        reason: l("Low willingness to pay for apps.", "استعداد منخفض للدفع مقابل التطبيقات."),
      },
      {
        country: "SA",
        fit: score(40),
        reason: l(
          "Higher spending, but still a crowded app category.",
          "إنفاق أعلى، لكن فئة التطبيقات مزدحمة.",
        ),
      },
      {
        country: "AE",
        fit: score(42),
        reason: l("Corporate wellness budgets exist.", "توجد ميزانيات للصحة المؤسسية."),
      },
      {
        country: "US",
        fit: score(30),
        reason: l("Many established free and paid apps.", "تطبيقات مجانية ومدفوعة راسخة كثيرة."),
      },
      {
        country: "DE",
        fit: score(32),
        reason: l(
          "Users pay for apps, but competition is heavy.",
          "المستخدمون يدفعون للتطبيقات، لكن المنافسة شديدة.",
        ),
      },
    ],
    similarIdeas: [
      {
        name: "Plant Nanny",
        description: l(
          "Gamified water-reminder app where a virtual plant grows as you drink.",
          "تطبيق تذكير بشرب الماء بأسلوب الألعاب، تنمو فيه نبتة افتراضية كلما شربت.",
        ),
        status: "active",
      },
      {
        name: "WaterMinder",
        description: l(
          "Long-running water-tracking app with reminders and wearable support.",
          "تطبيق قديم لمتابعة شرب الماء مع تذكيرات ودعم للأجهزة القابلة للارتداء.",
        ),
        status: "active",
      },
      {
        name: "Samsung Health",
        description: l(
          "Free health app with a built-in water tracker, preinstalled on many Android phones in Egypt.",
          "تطبيق صحة مجاني فيه متتبع لشرب الماء، مثبّت مسبقًا على كثير من هواتف أندرويد في مصر.",
        ),
        status: "active",
      },
    ],
    improvements: [
      l(
        "Pivot to office hydration challenges with team leaderboards.",
        "تحوّل إلى تحديات شرب الماء للمكاتب مع لوحات ترتيب للفرق.",
      ),
      l(
        "Partner with bottled-water delivery companies in Cairo.",
        "تشارك مع شركات توصيل المياه المعبأة في القاهرة.",
      ),
      l("Drop the monthly price for consumers.", "ألغِ السعر الشهري للمستهلكين."),
    ],
    nextSteps: [
      {
        title: l("Interview 10 HR managers", "قابل 10 مديري موارد بشرية"),
        detail: l(
          "Ask what they spend on staff wellness today and what they'd pay for a 30-day challenge.",
          "اسألهم كم ينفقون على صحة الموظفين اليوم، وكم سيدفعون مقابل تحدٍّ لمدة 30 يومًا.",
        ),
      },
      {
        title: l("Run a free pilot with one office", "نفّذ تجربة مجانية مع مكتب واحد"),
        detail: l(
          "Measure daily use after week 2; that's the number that matters.",
          "قِس الاستخدام اليومي بعد الأسبوع الثاني؛ هذا هو الرقم المهم.",
        ),
      },
      {
        title: l("Pause app development", "أوقف تطوير التطبيق مؤقتًا"),
        detail: l(
          "Don't build more features until a company agrees to pay.",
          "لا تبنِ ميزات إضافية حتى توافق شركة على الدفع.",
        ),
      },
    ],
  },
};
