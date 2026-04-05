/**
 * Telos Fitness - Execution Score Quiz
 * Full interactive quiz with scoring, results, and lead capture
 */

document.addEventListener('DOMContentLoaded', function() {
  // ===== QUIZ STATE & DATA =====
  const quiz = {
    currentQuestion: 0,
    scores: [0, 0, 0, 0], // [Training, Nutrition, Recovery, Accountability]
    userEmail: '',
    userName: '',
    userPhone: '',

    questions: [
      // PILLAR 1 - TRAINING
      {
        pillar: 0,
        text: 'How many days per week do you currently train?',
        options: [
          { text: '0-1 days', points: 1 },
          { text: '2-3 days', points: 3 },
          { text: '4-5 days', points: 4 },
          { text: '6+ days', points: 5 }
        ]
      },
      {
        pillar: 0,
        text: 'Do you follow a structured program with progressive overload?',
        options: [
          { text: 'No program at all', points: 1 },
          { text: 'I have a loose plan', points: 2 },
          { text: 'Yes, but I don\'t track progress', points: 3 },
          { text: 'Yes, with tracked progression', points: 5 }
        ]
      },
      // PILLAR 2 - NUTRITION
      {
        pillar: 1,
        text: 'How would you describe your current nutrition?',
        options: [
          { text: 'Eat whatever, no plan', points: 1 },
          { text: 'Generally healthy but inconsistent', points: 2 },
          { text: 'Track loosely or follow guidelines', points: 3 },
          { text: 'Dialed in with macros/plan', points: 5 }
        ]
      },
      {
        pillar: 1,
        text: 'How often do you eat in a way that supports your goals?',
        options: [
          { text: 'Rarely', points: 1 },
          { text: 'A few days a week', points: 2 },
          { text: 'Most days', points: 4 },
          { text: 'Every day with flexibility', points: 5 }
        ]
      },
      // PILLAR 3 - RECOVERY
      {
        pillar: 2,
        text: 'How many hours of sleep do you average per night?',
        options: [
          { text: 'Under 5', points: 1 },
          { text: '5-6 hours', points: 2 },
          { text: '6-7 hours', points: 3 },
          { text: '7+ hours', points: 5 }
        ]
      },
      {
        pillar: 2,
        text: 'Do you have a wind-down routine or recovery protocol?',
        options: [
          { text: 'No', points: 1 },
          { text: 'Sometimes', points: 2 },
          { text: 'Most nights', points: 4 },
          { text: 'Yes, it\'s non-negotiable', points: 5 }
        ]
      },
      // PILLAR 4 - ACCOUNTABILITY
      {
        pillar: 3,
        text: 'Who holds you accountable to your fitness commitments?',
        options: [
          { text: 'No one', points: 1 },
          { text: 'I try to hold myself accountable', points: 2 },
          { text: 'A training partner or friend', points: 3 },
          { text: 'A coach or structured system', points: 5 }
        ]
      },
      {
        pillar: 3,
        text: 'When you miss a day, what happens?',
        options: [
          { text: 'The week is basically done', points: 1 },
          { text: 'I feel guilty but move on eventually', points: 2 },
          { text: 'I adjust and get back on track within a day', points: 4 },
          { text: 'It\'s already planned for - I have a system', points: 5 }
        ]
      }
    ],

    resultTiers: [
      {
        name: 'System Offline',
        description: 'Your structure has collapsed. You\'re running on willpower alone - and it\'s running out. You don\'t need more motivation. You need a system installed from the outside.',
        minScore: 0,
        maxScore: 15
      },
      {
        name: 'Running on Fumes',
        description: 'You have pieces, but nothing\'s connected. Some weeks look good, then everything falls apart. The issue isn\'t effort - it\'s that no one is enforcing your floor.',
        minScore: 16,
        maxScore: 25
      },
      {
        name: 'Almost Dialed',
        description: 'You\'re close. One or two weak links are dragging everything else down. You don\'t need an overhaul - you need someone to identify and fix the gaps.',
        minScore: 26,
        maxScore: 32
      },
      {
        name: 'Executing',
        description: 'Your system is solid. If you\'re still not seeing the results you want, the issue might be programming, not discipline. A structured audit could unlock the next level.',
        minScore: 33,
        maxScore: 40
      }
    ],

    pillarNames: ['Training', 'Nutrition', 'Recovery', 'Accountability'],
    pillarWeakMessages: {
      0: 'Your training has no structure. A coach-built program with progression is the foundation everything else sits on.',
      1: 'Your nutrition is undermining your training. A custom protocol - not a meal plan - is what changes this.',
      2: 'You\'re not recovering. Sleep and wind-down aren\'t luxuries - they\'re where the adaptation happens.',
      3: 'You have no external accountability. That\'s why momentum dies every time life gets busy.'
    }
  };

  // ===== CONTEXT DETECTION =====
  const quizOverlay = document.querySelector('.quiz-overlay');
  const pricingContent = document.getElementById('pricingContent');
  const isOnPricingPage = !!quizOverlay;

  // ===== DOM ELEMENTS =====
  const quizContainer = document.querySelector('.quiz-container');
  const quizIntro = quizContainer?.querySelector('.quiz-intro');
  const quizQuestionCard = quizContainer?.querySelector('.quiz-question-card');
  const quizLeadCapture = quizContainer?.querySelector('.quiz-lead-capture');
  const quizResults = quizContainer?.querySelector('.quiz-results');

  // ===== START QUIZ =====
  quizIntro?.querySelector('.quiz-start-btn')?.addEventListener('click', function() {
    quizIntro.style.display = 'none';
    quizQuestionCard.style.display = 'block';
    renderQuestion();
  });

  // ===== RENDER QUESTION =====
  function renderQuestion() {
    const currentQ = quiz.questions[quiz.currentQuestion];
    const progressPercent = ((quiz.currentQuestion + 1) / 8) * 100;

    // Update progress bar
    const progressBar = quizQuestionCard.querySelector('.quiz-progress-bar-fill');
    progressBar.style.width = progressPercent + '%';

    // Update question counter
    const questionCounter = quizQuestionCard.querySelector('.quiz-question-counter');
    questionCounter.textContent = `Question ${quiz.currentQuestion + 1} of 8`;

    // Update question text
    const questionText = quizQuestionCard.querySelector('.quiz-question-text');
    questionText.textContent = currentQ.text;

    // Render options
    const optionsContainer = quizQuestionCard.querySelector('.quiz-options');
    optionsContainer.innerHTML = '';

    currentQ.options.forEach((option, index) => {
      const optionBtn = document.createElement('button');
      optionBtn.className = 'quiz-option';
      optionBtn.textContent = option.text;

      optionBtn.addEventListener('click', function() {
        handleAnswerSelect(optionBtn, option, currentQ.pillar);
      });

      optionsContainer.appendChild(optionBtn);
    });

    // Add fade-in animation
    quizQuestionCard.style.opacity = '0';
    setTimeout(() => {
      quizQuestionCard.style.opacity = '1';
    }, 10);
  }

  // ===== HANDLE ANSWER SELECTION =====
  function handleAnswerSelect(button, option, pillar) {
    // Highlight selected option
    button.style.borderColor = '#C9A84C';
    button.style.borderWidth = '2px';

    // Add points to pillar
    quiz.scores[pillar] += option.points;

    // Auto-advance after 400ms
    setTimeout(() => {
      if (quiz.currentQuestion < 7) {
        quiz.currentQuestion++;
        renderQuestion();
      } else {
        // Show lead capture form
        quizQuestionCard.style.display = 'none';
        quizLeadCapture.style.display = 'block';
        setupLeadCapture();
      }
    }, 400);
  }

  // ===== LEAD CAPTURE FORM =====
  function setupLeadCapture() {
    const form = quizLeadCapture.querySelector('form');
    const submitBtn = quizLeadCapture.querySelector('.quiz-see-score-btn');

    submitBtn.addEventListener('click', function(e) {
      e.preventDefault();

      // Capture form data
      const nameInput = form.querySelector('input[name="name"]');
      const emailInput = form.querySelector('input[name="email"]');
      const phoneInput = form.querySelector('input[name="phone"]');

      quiz.userName = nameInput.value;
      quiz.userEmail = emailInput.value;
      quiz.userPhone = phoneInput.value;

      // Log to console (for now)
      console.log('Quiz Lead Capture:', {
        name: quiz.userName,
        email: quiz.userEmail,
        phone: quiz.userPhone,
        scores: quiz.scores,
        totalScore: getTotalScore()
      });

      // Store quiz completion in localStorage
      localStorage.setItem('telosQuizCompleted', 'true');
      localStorage.setItem('telosQuizData', JSON.stringify({
        name: quiz.userName,
        email: quiz.userEmail,
        phone: quiz.userPhone,
        scores: quiz.scores,
        totalScore: getTotalScore(),
        completedAt: new Date().toISOString()
      }));

      // Show results
      quizLeadCapture.style.display = 'none';
      quizResults.style.display = 'block';
      renderResults();
    });
  }

  // ===== CALCULATE TOTAL SCORE =====
  function getTotalScore() {
    return quiz.scores.reduce((a, b) => a + b, 0);
  }

  // ===== GET RESULT TIER =====
  function getResultTier(score) {
    return quiz.resultTiers.find(tier => score >= tier.minScore && score <= tier.maxScore);
  }

  // ===== GET WEAKEST PILLAR =====
  function getWeakestPillar() {
    let weakest = 0;
    let lowestScore = quiz.scores[0];

    for (let i = 1; i < 4; i++) {
      if (quiz.scores[i] < lowestScore) {
        lowestScore = quiz.scores[i];
        weakest = i;
      }
    }

    return weakest;
  }

  // ===== RENDER RESULTS =====
  function renderResults() {
    const totalScore = getTotalScore();
    const tier = getResultTier(totalScore);
    const weakestPillar = getWeakestPillar();

    // Score ring animation
    const scoreRing = quizResults.querySelector('.quiz-score-ring');
    const scoreNumber = quizResults.querySelector('.quiz-score-number');
    const tierName = quizResults.querySelector('.quiz-tier-name');
    const tierDescription = quizResults.querySelector('.quiz-tier-description');

    // Animate score count-up
    let currentCount = 0;
    const countDuration = 1200;
    const countInterval = countDuration / totalScore;
    const countUp = setInterval(() => {
      currentCount++;
      scoreNumber.textContent = currentCount;
      if (currentCount >= totalScore) clearInterval(countUp);
    }, countInterval);

    tierName.textContent = tier.name;
    tierDescription.textContent = tier.description;

    // Animate score ring (use stroke-dashoffset)
    const circumference = 2 * Math.PI * 42; // radius = 42
    const offset = circumference - (totalScore / 40) * circumference;
    setTimeout(() => {
      scoreRing.style.strokeDashoffset = offset;
    }, 200);

    // Render pillar breakdown bars using table for bulletproof column layout
    const pillarBarsContainer = quizResults.querySelector('.quiz-pillar-bars');

    let barsHTML = '<table style="width:100%;border-collapse:separate;border-spacing:0 14px;margin-bottom:40px;">';

    quiz.scores.forEach((score, index) => {
      const percentage = (score / 10) * 100;
      let barColor = '#e74c3c';
      let barGlow = 'rgba(231,76,60,0.3)';
      if (score >= 7) {
        barColor = '#C9A84C';
        barGlow = 'rgba(201,168,76,0.4)';
      } else if (score >= 4) {
        barColor = '#f39c12';
        barGlow = 'rgba(243,156,18,0.3)';
      }

      barsHTML += `
        <tr>
          <td style="width:110px;padding-right:12px;text-align:right;vertical-align:middle;">
            <span style="font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(242,239,233,0.5);">${quiz.pillarNames[index]}</span>
          </td>
          <td style="vertical-align:middle;">
            <div style="width:100%;height:10px;background:rgba(255,255,255,0.06);border-radius:5px;overflow:hidden;">
              <div id="bar-fill-${index}" style="height:100%;width:0%;background:${barColor};border-radius:5px;transition:width 0.8s cubic-bezier(0.22,1,0.36,1);box-shadow:0 0 8px ${barGlow};"></div>
            </div>
          </td>
          <td style="width:50px;padding-left:12px;text-align:left;vertical-align:middle;">
            <span style="font-family:'Bebas Neue',sans-serif;font-size:1.1rem;font-weight:700;color:#F2EFE9;">${score}/10</span>
          </td>
        </tr>`;
    });

    barsHTML += '</table>';
    pillarBarsContainer.innerHTML = barsHTML;

    // Animate bar fills with staggered delay
    quiz.scores.forEach((score, index) => {
      const percentage = (score / 10) * 100;
      setTimeout(() => {
        const fill = document.getElementById('bar-fill-' + index);
        if (fill) fill.style.width = percentage + '%';
      }, 400 + index * 200);
    });

    // Weakest link callout
    const weakestCallout = quizResults.querySelector('.quiz-weakest-link');
    weakestCallout.style.cssText = 'background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.25);border-left:3px solid #C9A84C;border-radius:8px;padding:24px 20px;margin-bottom:40px;text-align:left;';
    weakestCallout.innerHTML = `
      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.15rem;color:#C9A84C;margin:0 0 8px 0;">${quiz.pillarNames[weakestPillar]} - Your Weakest Link</h3>
      <p style="color:rgba(242,239,233,0.7);font-size:0.95rem;line-height:1.6;margin:0;">${quiz.pillarWeakMessages[weakestPillar]}</p>
    `;

    // Book consultation CTA (not present on pricing page)
    const ctaBtn = quizResults.querySelector('.quiz-cta-btn');
    if (ctaBtn) {
      ctaBtn.href = 'https://calendly.com/tkern-y-m5/1-1-growth-consultation-call-clone';
      ctaBtn.target = '_blank';
    }

    // Retake quiz button
    const retakeBtn = quizResults.querySelector('.quiz-retake-btn');
    retakeBtn.addEventListener('click', resetQuiz);

    // View Pricing button (pricing page only)
    if (isOnPricingPage) {
      const viewPricingBtn = quizResults.querySelector('.quiz-view-pricing-btn');
      if (viewPricingBtn) {
        viewPricingBtn.addEventListener('click', function() {
          quizOverlay.classList.add('hidden');
          pricingContent.style.display = 'flex';
          document.body.style.overflow = '';
          window.scrollTo({ top: 0, behavior: 'smooth' });
          // Trigger pricing card animations
          if (typeof revealPricing === 'function') revealPricing();
        });
      }
    }
  }

  // ===== RESET QUIZ =====
  function resetQuiz() {
    // Reset state
    quiz.currentQuestion = 0;
    quiz.scores = [0, 0, 0, 0];
    quiz.userName = '';
    quiz.userEmail = '';
    quiz.userPhone = '';

    // Reset DOM
    quizIntro.style.display = 'block';
    quizQuestionCard.style.display = 'none';
    quizLeadCapture.style.display = 'none';
    quizResults.style.display = 'none';

    // Clear form inputs
    const form = quizLeadCapture.querySelector('form');
    form.reset();

    // Pricing page: re-show overlay and hide pricing
    if (isOnPricingPage) {
      quizOverlay.classList.remove('hidden');
      pricingContent.style.display = 'none';
      document.body.style.overflow = 'hidden';
      localStorage.removeItem('telosQuizCompleted');
      localStorage.removeItem('telosQuizData');
    }
  }
});
