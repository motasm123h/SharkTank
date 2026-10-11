import { count, fact, money, monthlyRevenue, score } from "../helpers";
import { l } from "../localize";
import type { MockScenario } from "../scenario";

const INR = "INR";

export const mumbaiTutoring: MockScenario = {
  id: "mumbai-tutoring",
  countries: ["IN"],
  input: {
    idea: l(
      "A mobile app that connects Class 9–12 students in Mumbai with verified college-student tutors for live one-to-one doubt-solving sessions in maths and science, paid per session through UPI, in English, Hindi or Marathi.",
      "تطبيق جوال يربط طلاب الصفوف من التاسع إلى الثاني عشر في مومباي بمدرّسين موثّقين من طلاب الجامعات لجلسات مباشرة فردية لحل الأسئلة في الرياضيات والعلوم، مع الدفع لكل جلسة عبر UPI، وباللغة الإنجليزية أو الهندية أو الماراثية.",
    ),
    country: "IN",
    city: l("Mumbai", "مومباي"),
    budget: { min: 500000, max: 1500000, currency: INR },
    mode: "online",
    stage: "prototype",
  },

  questions: [
    {
      id: "q1",
      judgeId: "investor",
      text: l(
        "Vedantu, PhysicsWallah and others have raised huge sums here. Why would a student pick you over them?",
        "شركات مثل Vedantu وPhysicsWallah جمعت مبالغ ضخمة هنا. لماذا سيختارك الطالب بدلًا منها؟",
      ),
      ack: l(
        "Pay-per-doubt pricing and local languages are a real wedge.",
        "التسعير لكل سؤال واللغات المحلية ميزة حقيقية للدخول إلى السوق.",
      ),
      reactions: { marketing: "happy", skeptic: "skeptical" },
    },
    {
      id: "q2",
      judgeId: "local",
      text: l(
        "Mumbai parents pay for tuition, but trust comes first. How will they know your college tutors are safe and actually good?",
        "أهالي مومباي يدفعون للدروس الخصوصية، لكن الثقة أولًا. كيف سيعرفون أن مدرّسيك من طلاب الجامعات آمنون وأكفاء فعلًا؟",
      ),
      ack: l(
        "ID checks plus session recordings will reassure parents.",
        "التحقق من الهوية مع تسجيل الجلسات سيطمئن الأهالي.",
      ),
      reactions: { investor: "happy", finance: "thinking" },
    },
    {
      id: "q3",
      judgeId: "marketing",
      text: l(
        "Will you target students on Instagram and YouTube, or parents on WhatsApp and through schools and coaching classes?",
        "هل ستستهدف الطلاب على إنستغرام ويوتيوب، أم الأهالي على واتساب وعبر المدارس ومراكز الدروس؟",
      ),
      ack: l(
        "Both, with different messages for each. Good.",
        "الاثنان، برسالة مختلفة لكل منهما. جيد.",
      ),
      reactions: { local: "happy" },
    },
    {
      id: "q4",
      judgeId: "finance",
      text: l(
        "At ₹99 a session, after paying the tutor, UPI and server costs, what do you keep?",
        "بسعر 99 روبية للجلسة، وبعد دفع أجر المدرّس وتكاليف UPI والخوادم، كم يبقى لك؟",
      ),
      ack: l(
        "About ₹30 a session is thin, but it can work at volume.",
        "نحو 30 روبية للجلسة هامش ضعيف، لكنه قد ينجح مع حجم كبير.",
      ),
      reactions: { investor: "thinking", skeptic: "skeptical" },
    },
    {
      id: "q5",
      judgeId: "skeptic",
      text: l(
        "Free YouTube explanations and AI chatbots answer doubts instantly. Why would anyone pay?",
        "شروحات يوتيوب المجانية وروبوتات الذكاء الاصطناعي تجيب عن الأسئلة فورًا. لماذا سيدفع أحد؟",
      ),
      ack: l(
        "The exam-week panic use case is believable. Prove it.",
        "حالة الذعر في أسبوع الامتحانات مقنعة. أثبتها.",
      ),
      reactions: { marketing: "thinking", local: "thinking" },
    },
  ],

  debate: [
    {
      id: "d1",
      judgeId: "marketing",
      stance: "opens",
      text: l(
        "Exam season is the hook. Post reels of tutors solving board-exam questions in 60 seconds, then offer a ₹1 first session.",
        "موسم الامتحانات هو المدخل. انشر مقاطع قصيرة لمدرّسين يحلّون أسئلة امتحانات المجالس في 60 ثانية، ثم قدّم أول جلسة بروبية واحدة.",
      ),
    },
    {
      id: "d2",
      judgeId: "skeptic",
      stance: "disagrees",
      replyTo: { turnId: "d1", judgeId: "marketing" },
      text: l(
        "A ₹1 trial brings tourists, not customers. Indian edtech already learned what happens when you buy growth.",
        "تجربة بروبية واحدة تجلب زوّارًا لا زبائن. قطاع التعليم الرقمي في الهند تعلّم ما يحدث عندما تشتري النمو.",
      ),
    },
    {
      id: "d3",
      judgeId: "finance",
      stance: "agrees",
      replyTo: { turnId: "d2", judgeId: "skeptic" },
      text: l(
        "I agree we should be careful. Keep paid acquisition under ₹150 per paying student until repeat use is proven.",
        "أوافق على الحذر. أبقِ تكلفة اكتساب الطالب الدافع أقل من 150 روبية حتى يثبت الاستخدام المتكرر.",
      ),
    },
    {
      id: "d4",
      judgeId: "local",
      stance: "builds_on",
      replyTo: { turnId: "d1", judgeId: "marketing" },
      text: l(
        "Don't forget local coaching classes in Thane and Borivali. Partner with them for overflow doubts instead of competing.",
        "لا تنسَ مراكز الدروس المحلية في ثين وبوريفالي. تشارك معها لحل الأسئلة الزائدة بدل منافستها.",
      ),
    },
    {
      id: "d5",
      judgeId: "investor",
      stance: "agrees",
      replyTo: { turnId: "d4", judgeId: "local" },
      text: l(
        "That's the smartest channel here. Going through coaching classes lowers acquisition cost and builds trust.",
        "هذه أذكى قناة هنا. العمل عبر مراكز الدروس يخفض تكلفة الاكتساب ويبني الثقة.",
      ),
    },
    {
      id: "d6",
      judgeId: "skeptic",
      stance: "disagrees",
      replyTo: { turnId: "d5", judgeId: "investor" },
      text: l(
        "Coaching owners will see you as a threat. Expect them to demand a big share.",
        "أصحاب المراكز سيرونك تهديدًا. توقّع أن يطلبوا حصة كبيرة.",
      ),
    },
  ],

  verdicts: [
    {
      judgeId: "investor",
      decision: "in",
      reason: l(
        "Large market and a clear pay-per-doubt wedge.",
        "سوق كبير وميزة واضحة في الدفع لكل سؤال.",
      ),
    },
    {
      judgeId: "local",
      decision: "in",
      reason: l(
        "Multilingual tutors and UPI fit Mumbai families.",
        "المدرّسون متعددو اللغات والدفع عبر UPI يناسبان عائلات مومباي.",
      ),
    },
    {
      judgeId: "marketing",
      decision: "in",
      reason: l(
        "Short exam-season videos can bring students in cheaply.",
        "المقاطع القصيرة في موسم الامتحانات تجلب الطلاب بتكلفة قليلة.",
      ),
    },
    {
      judgeId: "finance",
      decision: "in",
      reason: l(
        "Thin margin per session, but repeat use makes it work.",
        "هامش الجلسة ضعيف، لكن الاستخدام المتكرر يجعله ناجحًا.",
      ),
    },
    {
      judgeId: "skeptic",
      decision: "out",
      reason: l(
        "Free AI and YouTube answers make paying a hard sell.",
        "الإجابات المجانية من الذكاء الاصطناعي ويوتيوب تجعل الدفع صعب الإقناع.",
      ),
    },
  ],

  report: {
    overallScore: score(74),
    scoreBreakdown: {
      demand: score(8),
      competition: score(4),
      purchasingPower: score(7),
      easeOfLaunch: score(7),
      scalability: score(8),
    },
    canSell: {
      verdict: "yes",
      summary: l(
        "Yes. Students preparing for board exams will pay small amounts for fast, human help, especially in their own language. Win on price per doubt and trust, not on content volume.",
        "نعم. طلاب امتحانات المجالس سيدفعون مبالغ صغيرة مقابل مساعدة بشرية سريعة، خاصة بلغتهم. تفوّق بالسعر لكل سؤال وبالثقة، لا بكمية المحتوى.",
      ),
    },
    salesPlan: {
      price: money(99, INR, {
        low: 79,
        high: 149,
        note: l("Per 15-minute session, paid with UPI.", "لكل جلسة مدتها 15 دقيقة، تُدفع عبر UPI."),
      }),
      pricingRationale: l(
        "Cheap enough for a student to pay without asking parents; packs of 10 for parents who want control.",
        "سعر منخفض يسمح للطالب بالدفع دون سؤال الأهل؛ وباقات من 10 جلسات للأهالي الذين يريدون التحكم.",
      ),
      channels: [
        l("Instagram reels and YouTube Shorts", "مقاطع إنستغرام القصيرة ويوتيوب شورتس"),
        l("Partnerships with local coaching classes", "شراكات مع مراكز الدروس المحلية"),
        l("Parent WhatsApp groups of schools", "مجموعات واتساب الأهالي في المدارس"),
      ],
      firstCustomers: [
        l(
          "Class 10 and 12 students preparing for board exams in Thane, Borivali and Andheri",
          "طلاب الصفين العاشر والثاني عشر الذين يستعدون لامتحانات المجالس في ثين وبوريفالي وأنديري",
        ),
        l("Students at 3 partner coaching classes", "طلاب 3 مراكز دروس شريكة"),
        l("Younger siblings and friends of your tutors", "الإخوة الأصغر وأصدقاء مدرّسيك"),
      ],
    },
    whatMustChange: [],
    keyFigures: [
      {
        label: l("Population of India (2024)", "عدد سكان الهند (2024)"),
        figure: fact(count(1_450_000_000), {
          title: "World Population Prospects 2024",
          publisher: "United Nations",
          url: "https://population.un.org/wpp/",
          year: 2024,
        }),
      },
      {
        label: l(
          "Class 9–12 students in the Mumbai Metropolitan Region",
          "طلاب الصفوف 9–12 في منطقة مومباي الكبرى",
        ),
        figure: count(1_200_000, { low: 900_000, high: 1_500_000 }),
      },
    ],
    salesScenarios: [
      {
        kind: "pessimistic",
        monthly: monthlyRevenue(40000, 0.06, INR),
        assumptions: [
          l("Most students use only the trial", "معظم الطلاب يستخدمون التجربة فقط"),
          l("Coaching classes refuse to partner", "مراكز الدروس ترفض الشراكة"),
        ],
      },
      {
        kind: "realistic",
        monthly: monthlyRevenue(120000, 0.14, INR),
        assumptions: [
          l("Two coaching-class partners by month 3", "شريكان من مراكز الدروس بحلول الشهر الثالث"),
          l("Each paying student books 4 sessions a month", "كل طالب دافع يحجز 4 جلسات شهريًا"),
        ],
      },
      {
        kind: "optimistic",
        monthly: monthlyRevenue(250000, 0.2, INR),
        assumptions: [
          l(
            "A reel goes viral during board-exam season",
            "مقطع ينتشر بقوة في موسم امتحانات المجالس",
          ),
          l("Expansion to Pune by month 9", "التوسع إلى بونه بحلول الشهر التاسع"),
        ],
      },
    ],
    successReasons: [
      l(
        "Huge, exam-driven demand that peaks every year.",
        "طلب ضخم مرتبط بالامتحانات ويبلغ ذروته كل عام.",
      ),
      l("UPI makes tiny payments effortless.", "UPI يجعل المدفوعات الصغيرة سهلة جدًا."),
      l(
        "Local-language tutors are hard for big players to match.",
        "المدرّسون باللغات المحلية ميزة يصعب على الكبار مجاراتها.",
      ),
    ],
    failureReasons: [
      l(
        "Free AI tools and YouTube cover many simple doubts.",
        "أدوات الذكاء الاصطناعي المجانية ويوتيوب تغطي كثيرًا من الأسئلة البسيطة.",
      ),
      l("Tutor quality is hard to keep consistent.", "يصعب الحفاظ على جودة ثابتة للمدرّسين."),
      l("Demand drops sharply after exams.", "الطلب ينخفض بشدة بعد الامتحانات."),
    ],
    marketing: {
      summary: l(
        "Partnerships with coaching classes first, then short videos for students. Meta ads only during exam season.",
        "الشراكات مع مراكز الدروس أولًا، ثم المقاطع القصيرة للطلاب. إعلانات ميتا فقط في موسم الامتحانات.",
      ),
      channels: [
        {
          channel: "partnerships",
          priority: 1,
          monthlyBudget: money(30000, INR),
          expectedCac: money(60, INR),
          rationale: l(
            "Revenue share with coaching classes for overflow doubts.",
            "تقاسم الإيرادات مع مراكز الدروس مقابل الأسئلة الزائدة.",
          ),
        },
        {
          channel: "influencers",
          priority: 2,
          monthlyBudget: money(60000, INR),
          expectedCac: money(120, INR),
          rationale: l(
            "Student YouTubers and education creators in Hindi and Marathi.",
            "صانعو محتوى تعليمي ويوتيوبرز طلاب بالهندية والماراثية.",
          ),
        },
        {
          channel: "meta_ads",
          priority: 3,
          monthlyBudget: money(50000, INR),
          expectedCac: money(150, INR),
          rationale: l(
            "Instagram reels ads during exam months only.",
            "إعلانات المقاطع القصيرة على إنستغرام في أشهر الامتحانات فقط.",
          ),
        },
        {
          channel: "whatsapp",
          priority: 4,
          monthlyBudget: money(10000, INR),
          rationale: l(
            "Session packs shared in school parent groups.",
            "باقات جلسات تُنشر في مجموعات أهالي المدارس.",
          ),
        },
      ],
      totalMonthlyBudget: money(150000, INR),
    },
    location: {
      recommendation: "online",
      rationale: l(
        "Everything happens in the app; no centre is needed. A small office for tutor training is optional.",
        "كل شيء يحدث داخل التطبيق؛ لا حاجة لمركز. مكتب صغير لتدريب المدرّسين اختياري.",
      ),
    },
    timing: {
      verdict: "right_time",
      rationale: l(
        "After the edtech slowdown, families want cheaper, pay-as-you-go help rather than expensive yearly courses.",
        "بعد تباطؤ قطاع التعليم الرقمي، تفضّل العائلات مساعدة أرخص تُدفع حسب الاستخدام بدل الدورات السنوية الغالية.",
      ),
      signals: [
        l(
          "Shift from big course bundles to smaller purchases",
          "تحوّل من باقات الدورات الكبيرة إلى مشتريات أصغر",
        ),
        l("Rising use of UPI by teenagers", "ازدياد استخدام المراهقين لـ UPI"),
      ],
    },
    localContext: {
      paymentMethods: [
        l(
          "UPI apps such as Google Pay, PhonePe and Paytm",
          "تطبيقات UPI مثل Google Pay وPhonePe وPaytm",
        ),
        l("Parents' debit cards for session packs", "بطاقات الخصم الخاصة بالأهالي لباقات الجلسات"),
      ],
      platforms: [l("WhatsApp", "واتساب"), l("Instagram", "إنستغرام"), l("YouTube", "يوتيوب")],
      realities: [
        l(
          "Board exams in February–March drive peak demand.",
          "امتحانات المجالس في فبراير ومارس تصنع ذروة الطلب.",
        ),
        l("Parents usually decide on paid education.", "الأهالي يقررون عادةً في التعليم المدفوع."),
        l(
          "Many students prefer Hindi or Marathi explanations.",
          "كثير من الطلاب يفضلون الشرح بالهندية أو الماراثية.",
        ),
      ],
    },
    globalFit: [
      {
        country: "IN",
        fit: score(74),
        reason: l(
          "Exam culture, UPI and local languages.",
          "ثقافة الامتحانات وUPI واللغات المحلية.",
        ),
      },
      {
        country: "BD",
        fit: score(66),
        reason: l(
          "Similar exam pressure and mobile payments like bKash.",
          "ضغط امتحانات مشابه ومدفوعات جوال مثل bKash.",
        ),
      },
      {
        country: "PK",
        fit: score(63),
        reason: l(
          "Large student base; payments via JazzCash and Easypaisa.",
          "عدد طلاب كبير؛ الدفع عبر JazzCash وEasypaisa.",
        ),
      },
      {
        country: "ID",
        fit: score(61),
        reason: l(
          "Big student market, strong local players.",
          "سوق طلاب كبير ومنافسون محليون أقوياء.",
        ),
      },
      {
        country: "NG",
        fit: score(58),
        reason: l(
          "Demand is high but payments and connectivity are uneven.",
          "الطلب مرتفع لكن الدفع والاتصال متفاوتان.",
        ),
      },
      {
        country: "EG",
        fit: score(57),
        reason: l(
          "Private tutoring is widespread; Arabic tutors would be needed.",
          "الدروس الخصوصية منتشرة جدًا؛ ستحتاج إلى مدرّسين بالعربية.",
        ),
      },
    ],
    similarIdeas: [
      {
        name: "Vedantu",
        description: l(
          "Live online tutoring platform, mainly courses and classes rather than single doubts.",
          "منصة دروس مباشرة عبر الإنترنت، تركز على الدورات والصفوف أكثر من الأسئلة المنفردة.",
        ),
        country: "IN",
        status: "active",
      },
      {
        name: "PhysicsWallah",
        description: l(
          "Low-cost exam-prep platform with a huge YouTube following.",
          "منصة تحضير للامتحانات منخفضة التكلفة مع جمهور ضخم على يوتيوب.",
        ),
        country: "IN",
        status: "active",
      },
      {
        name: "Filo",
        description: l(
          "Instant one-to-one tutoring app that connects students to tutors in seconds.",
          "تطبيق دروس فردية فورية يربط الطلاب بالمدرّسين خلال ثوانٍ.",
        ),
        country: "IN",
        status: "active",
      },
    ],
    improvements: [
      l(
        "Record every session so parents can review it.",
        "سجّل كل جلسة ليتمكن الأهالي من مراجعتها.",
      ),
      l(
        "Let students upload a photo of the question to match the right tutor faster.",
        "اسمح للطلاب برفع صورة السؤال لاختيار المدرّس المناسب بسرعة أكبر.",
      ),
      l("Sell exam-week packs at a discount.", "بِع باقات أسبوع الامتحانات بخصم."),
      l(
        "Rate tutors after each session and remove weak ones quickly.",
        "قيّم المدرّسين بعد كل جلسة واستبعد الضعفاء بسرعة.",
      ),
    ],
    nextSteps: [
      {
        title: l("Recruit 20 tutors from 2 colleges", "جنّد 20 مدرّسًا من كليتين"),
        detail: l(
          "Test them on board-exam questions and check their IDs.",
          "اختبرهم على أسئلة امتحانات المجالس وتحقق من هوياتهم.",
        ),
      },
      {
        title: l("Pitch 5 coaching classes in Thane", "اعرض الفكرة على 5 مراكز دروس في ثين"),
        detail: l(
          "Offer a revenue share for doubts their teachers can't cover.",
          "اعرض تقاسم الإيرادات مقابل الأسئلة التي لا يغطيها مدرّسوهم.",
        ),
      },
      {
        title: l("Post 10 'doubt in 60 seconds' reels", "انشر 10 مقاطع 'حل السؤال في 60 ثانية'"),
        detail: l(
          "Measure which subjects and languages get the most saves.",
          "قِس أي المواد واللغات تحصل على أكبر عدد من الحفظ.",
        ),
      },
    ],
  },
};
