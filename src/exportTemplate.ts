/**
 * Generates the fully self-contained HTML file for the horse racing betting game.
 * Designed for offline play and instant hosting on Cloudflare Pages.
 * Includes Tailwind CSS, custom animations, SVG assets, audio synthesizer, and local leaderboard storage.
 */
export function generateSingleHtml(highScores: Array<{ name: string; score: number; date: string }>): string {
  // Pass existing high scores to the template so they are bundled if exported
  const scoreDataJson = JSON.stringify(highScores);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>경마 그랑프리 배팅 게임</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <style>
    /* Customized Tailwind styles & keyframe animations */
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .font-title {
      font-family: 'Space Grotesk', 'Inter', sans-serif;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }

    @keyframes leg-swing {
      0%, 100% { transform: rotate(-25deg); }
      50% { transform: rotate(25deg); }
    }
    @keyframes gallop {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50% { transform: translateY(-6px) rotate(3deg); }
    }
    @keyframes grass-scroll {
      0% { background-position-x: 0px; }
      100% { background-position-x: -400px; }
    }

    .animate-leg-swing {
      animation: leg-swing 0.4s infinite ease-in-out;
    }
    .animate-gallop {
      animation: gallop 0.4s infinite ease-in-out;
    }
    .animate-grass-scroll {
      background-image: repeating-linear-gradient(90deg, #16a34a 0px, #16a34a 20px, #15803d 20px, #15803d 40px);
      background-size: 80px 100%;
      animation: grass-scroll 1s linear infinite;
    }

    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(30, 41, 59, 0.5);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(234, 179, 8, 0.4);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(234, 179, 8, 0.6);
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen overflow-x-hidden flex flex-col relative">

  <!-- Ambient Galloping Horse Background -->
  <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
    <div class="absolute bottom-10 left-0 right-0 h-40 flex items-center justify-around">
      <div class="animate-gallop text-emerald-400" style="animation-duration: 0.6s">
        <svg viewBox="0 0 100 80" class="w-24 h-24">
          <path d="M15,45 Q5,40 10,30 Q20,35 15,45" fill="currentColor" />
          <rect x="25" y="30" width="45" height="25" rx="10" fill="currentColor" />
          <path d="M60,35 L75,15 Q80,10 85,15 L90,25 Q92,30 85,35 L68,45 Z" fill="currentColor" />
          <path d="M75,15 L78,5 L82,14 Z" fill="currentColor" />
          <rect x="30" y="52" width="6" height="18" rx="3" fill="currentColor" class="animate-leg-swing origin-top" />
          <rect x="42" y="52" width="6" height="18" rx="3" fill="currentColor" class="animate-leg-swing origin-top" style="animation-delay: 0.1s" />
          <rect x="54" y="52" width="6" height="18" rx="3" fill="currentColor" class="animate-leg-swing origin-top" style="animation-delay: 0.2s" />
          <rect x="62" y="52" width="6" height="18" rx="3" fill="currentColor" class="animate-leg-swing origin-top" style="animation-delay: 0.3s" />
          <circle cx="82" cy="20" r="2.5" fill="white" />
          <circle cx="82.5" cy="19.5" r="1" fill="black" />
        </svg>
      </div>
      <div class="animate-gallop text-amber-500 hidden sm:block" style="animation-duration: 0.5s">
        <svg viewBox="0 0 100 80" class="w-32 h-32">
          <path d="M15,45 Q5,40 10,30 Q20,35 15,45" fill="currentColor" />
          <rect x="25" y="30" width="45" height="25" rx="10" fill="currentColor" />
          <path d="M60,35 L75,15 Q80,10 85,15 L90,25 Q92,30 85,35 L68,45 Z" fill="currentColor" />
          <path d="M75,15 L78,5 L82,14 Z" fill="currentColor" />
          <rect x="30" y="52" width="6" height="18" rx="3" fill="currentColor" class="animate-leg-swing origin-top" style="animation-delay: 0.15s" />
          <rect x="42" y="52" width="6" height="18" rx="3" fill="currentColor" class="animate-leg-swing origin-top" style="animation-delay: 0.25s" />
          <rect x="54" y="52" width="6" height="18" rx="3" fill="currentColor" class="animate-leg-swing origin-top" style="animation-delay: 0.35s" />
          <rect x="62" y="52" width="6" height="18" rx="3" fill="currentColor" class="animate-leg-swing origin-top" style="animation-delay: 0.05s" />
          <circle cx="82" cy="20" r="2.5" fill="white" />
          <circle cx="82.5" cy="19.5" r="1" fill="black" />
        </svg>
      </div>
    </div>
  </div>

  <!-- Main Container -->
  <main id="app-container" class="flex-1 w-full max-w-7xl mx-auto px-4 py-6 z-10 flex flex-col justify-center items-center">
    
    <!-- 1. LOGIN SCREEN -->
    <section id="screen-login" class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 mb-4 animate-bounce">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h1 class="text-2xl font-bold font-title tracking-tight text-white mb-2">경마 그랑프리 배팅 게임</h1>
        <p class="text-slate-400 text-sm">게임을 시작하기 위해 입장 비밀번호를 입력하세요.</p>
      </div>

      <form id="login-form" onsubmit="handleLogin(event)" class="space-y-4">
        <div>
          <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">비밀번호 입력</label>
          <input type="password" id="password" required placeholder="비밀번호를 입력하세요" class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all">
          <p id="login-error" class="text-red-400 text-xs mt-1.5 hidden">❌ 비밀번호가 올바르지 않습니다. 다시 시도하세요.</p>
        </div>
        <button type="submit" class="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 focus:ring-2 focus:ring-yellow-500 shadow-lg font-semibold transition-all">입장하기</button>
      </form>
    </section>

    <!-- 2. GAME LOBBY SCREEN (BETTING VIEW) -->
    <section id="screen-lobby" class="w-full flex-col gap-6 hidden">
      <!-- Header HUD -->
      <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-yellow-500/10 rounded-lg text-yellow-400 border border-yellow-500/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <div>
            <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">그랑프리 시즌</div>
            <div class="text-lg font-bold text-white flex items-center gap-2">
              <span id="lobby-round" class="text-yellow-400">Round 1/10</span>
              <span class="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-300">최종 10 라운드까지 진행</span>
            </div>
          </div>
        </div>

        <!-- Mute and Volume Synth Control -->
        <div class="flex items-center gap-2">
          <button onclick="toggleMute()" id="mute-btn" class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all" title="소리 켜기/끄기">
            <svg id="icon-unmuted" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
            <svg id="icon-muted" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zm12.364-1.414l4-4m0 4l-4-4"></path></svg>
          </button>
        </div>

        <div class="flex items-center gap-4 bg-slate-950 px-5 py-2.5 rounded-lg border border-slate-800">
          <div class="text-right">
            <div class="text-xs text-slate-400 uppercase font-semibold">내 보유 포인트</div>
            <div id="lobby-points" class="text-2xl font-bold text-yellow-400 font-mono">10,000 pts</div>
          </div>
          <div class="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/30">
            <svg class="w-6 h-6 animate-[spin_4s_linear_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
      </div>

      <!-- Main Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Horse List & Betting Station (Left/Center 2 cols) -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <!-- Betting Form Component -->
          <div class="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-xl relative">
            <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span class="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
              경주마 배팅 머신
            </h2>
            <p class="text-xs text-slate-400 mb-6">원하는 마필을 선택하고 투자할 포인트 금액을 배팅해 주세요. 다수 마필 복수 배팅도 가능합니다!</p>

            <div id="betting-horses" class="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              <!-- Rendered via JS -->
            </div>

            <!-- Current Bets Overview -->
            <div class="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block">총 배팅 포인트</span>
                <span id="lobby-total-bet" class="text-xl font-bold text-white font-mono">0 pts</span>
              </div>
              <button id="start-race-btn" onclick="startRace()" disabled class="px-8 py-3 bg-yellow-500 text-slate-950 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg transition-all flex items-center gap-2">
                경주 시작!
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Panels (Leaderboard, Stats & History) -->
        <div class="flex flex-col gap-6">
          <!-- Live Leaders Hall -->
          <div class="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-xl flex-1 flex flex-col">
            <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
              명예의 전당 (순위)
            </h2>
            <div id="leaderboard-list" class="space-y-2 flex-1 overflow-y-auto max-h-[250px] pr-1">
              <!-- Rendered via JS -->
            </div>
          </div>

          <!-- History Logs -->
          <div class="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-xl">
            <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              배팅 히스토리
            </h2>
            <div id="history-list" class="space-y-2 max-h-[200px] overflow-y-auto text-sm">
              <div class="text-center py-6 text-slate-500">배팅 기록이 아직 없습니다.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. RACING SCREEN -->
    <section id="screen-racing" class="w-full flex-col gap-6 hidden">
      <!-- Live Commentary & Speed Stats Header -->
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-3.5 h-3.5 bg-red-500 rounded-full animate-ping"></div>
          <span class="text-sm font-bold uppercase tracking-wider text-red-400 font-title">LIVE 중계방송</span>
        </div>
        <div id="commentary-ticker" class="text-sm text-yellow-300 font-medium truncate flex-1 text-center bg-slate-950 py-1 px-4 rounded border border-slate-800">
          "게이트 열렸습니다! 경기 출발합니다!"
        </div>
        <div class="text-xs font-mono text-slate-400">
          ROUND <span id="racing-round-num" class="text-white font-bold">1/10</span>
        </div>
      </div>

      <!-- Racetrack visualizer -->
      <div id="racetrack-box" class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <!-- Sky and sun decoration inside track background -->
        <div class="absolute inset-0 z-0 bg-gradient-to-b from-sky-950/20 via-slate-900/40 to-slate-950/80 pointer-events-none"></div>
        
        <!-- Track lanes -->
        <div id="lanes-container" class="relative z-10 space-y-5">
          <!-- Dynamic Lane content injected here -->
        </div>

        <!-- Finish Line overlay visual -->
        <div class="absolute top-0 bottom-0 right-[40px] w-2 border-l-2 border-r-2 border-dashed border-white/30 z-20 pointer-events-none flex flex-col justify-around">
          <div class="bg-red-500/80 text-[10px] text-white px-1 py-0.5 rounded transform rotate-90 translate-x-1 uppercase font-bold font-mono">FINISH</div>
          <div class="bg-red-500/80 text-[10px] text-white px-1 py-0.5 rounded transform rotate-90 translate-x-1 uppercase font-bold font-mono">FINISH</div>
        </div>
      </div>

      <!-- Completion Action Banner -->
      <div id="race-end-banner" class="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center space-y-4 hidden animate-fade-in shadow-xl">
        <h3 class="text-lg font-bold text-yellow-400">🏁 경주가 종료되었습니다!</h3>
        <p class="text-slate-300 text-sm">모든 마필이 결승선을 통과하였습니다. 결과를 확인하고 다음 단계로 진행하세요.</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button onclick="document.getElementById('modal-results').classList.remove('hidden')" class="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2">
            🔍 상세 결과 및 정산창 다시 보기
          </button>
          <button onclick="closeResultModal()" class="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-extrabold rounded-lg hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/10 transition-all cursor-pointer flex items-center justify-center gap-2">
            🚀 다음 라운드 진행하기
          </button>
        </div>
      </div>
    </section>

    <!-- 4. WINNER RESULTS POPUP (MODAL) -->
    <div id="modal-results" class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl relative overflow-hidden">
        <!-- Confetti Particle Container -->
        <div id="modal-confetti" class="absolute inset-0 pointer-events-none overflow-hidden z-0"></div>

        <div class="relative z-10 text-center space-y-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 mb-2 animate-bounce">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0L4 12m8 0l8-4m-8 4v4M4 12v4m16-4v4m-16 0h16"></path></svg>
          </div>
          
          <h2 class="text-2xl font-bold text-white font-title">경기 결과 발표</h2>
          
          <!-- Winner horse card -->
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-around">
            <div id="modal-winner-avatar" class="animate-gallop">
              <!-- Injected SVG -->
            </div>
            <div class="text-left">
              <div class="text-xs text-slate-400">우승마 (1위)</div>
              <div id="modal-winner-name" class="text-xl font-bold text-yellow-400">슈팅스타</div>
              <div id="modal-winner-odds" class="text-xs text-slate-500 mt-0.5">배당률: 3.5x</div>
            </div>
          </div>

          <!-- Payout overview -->
          <div id="modal-payout-box" class="bg-slate-950/60 rounded-xl p-5 border border-slate-800">
            <!-- Content dynamic based on win/loss -->
          </div>

          <div class="flex flex-col sm:flex-row gap-3 w-full">
            <button onclick="document.getElementById('modal-results').classList.add('hidden')" class="w-full sm:w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition-all cursor-pointer text-sm">
              닫기 (트랙 확인)
            </button>
            <button onclick="closeResultModal()" class="w-full sm:w-2/3 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-extrabold rounded-lg hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/10 transition-all cursor-pointer text-sm">
              다음 라운드로 도전 🚀
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. GAME OVER (FINAL CONGRATS) SCREEN -->
    <section id="screen-gameover" class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative hidden">
      <div class="absolute inset-0 pointer-events-none overflow-hidden z-0" id="gameover-confetti"></div>
      
      <div class="relative z-10 text-center space-y-6">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 mb-2 animate-pulse">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
        </div>

        <h1 class="text-3xl font-extrabold text-white font-title">최종 그랑프리 완료!</h1>
        <p class="text-slate-400 text-sm">총 10번의 치열한 레이스가 모두 종료되었습니다.<br>최종 획득 포인트를 명예의 전당에 기입하세요!</p>

        <div class="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <div class="text-xs text-slate-400 uppercase font-semibold">최종 스코어</div>
          <div id="gameover-final-score" class="text-4xl font-extrabold text-yellow-400 font-mono tracking-wider mt-1">0 pts</div>
        </div>

        <form id="save-score-form" onsubmit="handleSaveScore(event)" class="space-y-4">
          <div>
            <label for="nickname" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">플레이어 닉네임</label>
            <input type="text" id="nickname" maxlength="8" required placeholder="이름을 입력하세요 (최대 8자)" class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500">
          </div>
          <button type="submit" class="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 shadow-lg font-semibold transition-all">기록 등록 후 로비로</button>
        </form>

        <div class="pt-4 border-t border-slate-800 flex justify-center">
          <button onclick="resetGame()" class="text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.281"></path></svg>
            순위 등록 없이 바로 다시 시작하기
          </button>
        </div>
      </div>
    </section>

  </main>

  <!-- Export Floating Button & Developer Info Footer -->
  <footer class="w-full bg-slate-950/90 border-t border-slate-900 py-6 px-4 z-10 text-center relative space-y-4">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="text-left">
        <p class="text-sm font-semibold text-slate-400 flex items-center gap-1.5 justify-center md:justify-start">
          <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
          경마 그랑프리 배팅 시스템
        </p>
        <p class="text-xs text-slate-500 mt-0.5">클라우드플레어 Pages 및 정적 웹호스팅에 최적화된 독립형 Single HTML 패키지</p>
      </div>
      <button onclick="exportSingleHtmlFile()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        Cloudflare 배포용 단일 HTML 다운로드
      </button>
    </div>
  </footer>

  <!-- CLIENT JAVASCRIPT GAME LOGIC -->
  <script>
    // Config and state
    const PASSWORD_TARGET = "ehfhrhdtk";
    let isLoggedIn = false;
    let currentRound = 1;
    let points = 10000;
    let currentBets = {}; // { horseId: amount }
    let historyLogs = [];
    let isMuted = false;
    let isRacing = false;

    // 8 Horse specs
    const HORSES = [
      { id: "maximus", name: "막시무스", color: "#ef4444", textClass: "text-red-500", accessory: "👑", baseOdds: 3.0, description: "검투사처럼 돌진하는 막강한 체력의 명마" },
      { id: "tyranno", name: "티라노", color: "#22c55e", textClass: "text-green-500", accessory: "🦖", baseOdds: 4.5, description: "공룡의 스피드로 그라운드를 찢는 파괴마" },
      { id: "caesar", name: "시저", color: "#3b82f6", textClass: "text-blue-500", accessory: "🗡️", baseOdds: 2.8, description: "흔들림 없는 주행으로 황제를 노리는 명장마" },
      { id: "samsung", name: "삼성전자", color: "#1d4ed8", textClass: "text-indigo-500", accessory: "📱", baseOdds: 2.0, description: "압도적인 하이테크 스퍼트 초고속 질주" },
      { id: "semicon", name: "반도체", color: "#a855f7", textClass: "text-purple-500", accessory: "💾", baseOdds: 3.5, description: "나노 단위 정밀 제어로 완벽 주행하는 연산마" },
      { id: "antonius", name: "안토니우스", color: "#ec4899", textClass: "text-pink-500", accessory: "🛡️", baseOdds: 6.0, description: "전장을 지배했던 기개의 극적인 역전극 전문가" },
      { id: "guan_yu", name: "관우", color: "#f59e0b", textClass: "text-orange-500", accessory: "🐉", baseOdds: 1.8, description: "적토마의 기운을 이어받은 그랑프리 절대강자" },
      { id: "transport", name: "교통본부장", color: "#10b981", textClass: "text-emerald-500", accessory: "🚦", baseOdds: 5.5, description: "트랙 위의 흐름과 스피드를 지휘하는 통제마" }
    ];

    // Sound Synthesizer via Web Audio API
    const AudioSynth = {
      ctx: null,
      init() {
        if (!this.ctx) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
      },
      playStart() {
        if (isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 1.2);
          gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 1.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 1.2);
        } catch (e) { console.log(e); }
      },
      playStep() {
        if (isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(65, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.07);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.07);
        } catch (e) { console.log(e); }
      },
      playBoost() {
        if (isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(350, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.25);
        } catch (e) { console.log(e); }
      },
      playFanfare() {
        if (isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
          const notes = [261.63, 329.63, 392.00, 523.25];
          notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + i * 0.15 + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + i * 0.15);
            osc.stop(this.ctx.currentTime + i * 0.15 + 0.45);
          });
        } catch (e) { console.log(e); }
      }
    };

    // Leaderboard Management
    const initialSeed = ${scoreDataJson};
    let leaderScores = JSON.parse(localStorage.getItem("horse_ranks_highscores")) || initialSeed;
    if (leaderScores.length === 0) {
      leaderScores = [
        { name: "골든게이트", score: 85000, date: "2026-07-06" },
        { name: "번개기수", score: 45000, date: "2026-07-06" },
        { name: "행운아", score: 25000, date: "2026-07-06" }
      ];
      localStorage.setItem("horse_ranks_highscores", JSON.stringify(leaderScores));
    }

    // Helper SVG Horse Renderer
    function getHorseSvg(color, accessory, classes = "", sizeClass = "w-11 h-11") {
      return \`
        <div class="relative \${sizeClass} \${classes}">
          <svg viewBox="0 0 100 80" class="w-full h-full drop-shadow-md">
            <path d="M15,45 Q5,40 10,30 Q20,35 15,45" fill="\${color}" />
            <rect x="25" y="30" width="45" height="25" rx="10" fill="\${color}" />
            <path d="M60,35 L75,15 Q80,10 85,15 L90,25 Q92,30 85,35 L68,45 Z" fill="\${color}" />
            <path d="M75,15 L78,5 L82,14 Z" fill="\${color}" />
            <rect x="30" y="52" width="6" height="18" rx="3" fill="\${color}" class="animate-leg-swing origin-top" />
            <rect x="42" y="52" width="6" height="18" rx="3" fill="\${color}" class="animate-leg-swing origin-top" style="animation-delay: 0.1s" />
            <rect x="54" y="52" width="6" height="18" rx="3" fill="\${color}" class="animate-leg-swing origin-top" style="animation-delay: 0.2s" />
            <rect x="62" y="52" width="6" height="18" rx="3" fill="\${color}" class="animate-leg-swing origin-top" style="animation-delay: 0.3s" />
            <circle cx="82" cy="20" r="2.5" fill="white" />
            <circle cx="82.5" cy="19.5" r="1" fill="black" />
            <path d="M62,30 Q65,15 75,15" stroke="\${color}" stroke-width="4" stroke-linecap="round" />
          </svg>
          <div class="absolute -top-1.5 -right-1 text-base leading-none select-none">\${accessory}</div>
        </div>
      \`;
    }

    // Screens switching helper
    function showScreen(screenId) {
      document.getElementById("screen-login").classList.add("hidden");
      document.getElementById("screen-lobby").classList.add("hidden");
      document.getElementById("screen-racing").classList.add("hidden");
      document.getElementById("screen-gameover").classList.add("hidden");
      
      document.getElementById(screenId).classList.remove("hidden");
      if (screenId === "screen-lobby") {
        document.getElementById("screen-lobby").style.display = "flex";
      } else if (screenId === "screen-racing") {
        document.getElementById("screen-racing").style.display = "flex";
      }
    }

    // Event: Login handler
    function handleLogin(e) {
      e.preventDefault();
      const pwd = document.getElementById("password").value;
      if (pwd === PASSWORD_TARGET) {
        isLoggedIn = true;
        document.getElementById("login-error").classList.add("hidden");
        AudioSynth.playStart();
        initLobby();
        showScreen("screen-lobby");
      } else {
        const err = document.getElementById("login-error");
        err.classList.remove("hidden");
        err.style.animation = "shake 0.3s ease-in-out";
        setTimeout(() => err.style.animation = "", 300);
      }
    }

    // Toggle mute
    function toggleMute() {
      isMuted = !isMuted;
      document.getElementById("icon-unmuted").classList.toggle("hidden", isMuted);
      document.getElementById("icon-muted").classList.toggle("hidden", !isMuted);
    }

    // Init Lobby UI elements
    function initLobby() {
      // Clear current bets
      currentBets = {};
      HORSES.forEach(h => currentBets[h.id] = 0);

      // Render info headers
      document.getElementById("lobby-round").innerText = \`Round \${currentRound}/10\`;
      document.getElementById("lobby-points").innerText = \`\${points.toLocaleString()} pts\`;
      document.getElementById("lobby-total-bet").innerText = "0 pts";
      
      // Render Horse panel
      const horseBox = document.getElementById("betting-horses");
      horseBox.innerHTML = "";

      HORSES.forEach(h => {
        const horseRow = document.createElement("div");
        horseRow.className = "bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:border-slate-700";
        horseRow.innerHTML = \`
          <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="p-1 bg-slate-900 rounded border border-slate-800">
              \${getHorseSvg(h.color, h.accessory)}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-white">\${h.name}</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/25">
                  배당: 1등 2x / 2등 1x / 3등 0.5x
                </span>
              </div>
              <div class="text-xs text-slate-400 mt-1">\${h.description}</div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <!-- Quick preset increments -->
            <div class="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button onclick="changeBet('\${h.id}', 1000)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-slate-300">+1K</button>
              <button onclick="changeBet('\${h.id}', 5000)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-slate-300">+5K</button>
              <button onclick="setBetPercent('\${h.id}', 0.5)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-slate-300">50%</button>
              <button onclick="setBetPercent('\${h.id}', 1.0)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-slate-300">All-in</button>
              <button onclick="clearBet('\${h.id}')" class="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-bold text-red-400">지우기</button>
            </div>
            
            <div class="relative w-full sm:w-36">
              <input type="number" id="input-bet-\${h.id}" value="0" min="0" max="\${points}" onchange="manualBet('\${h.id}', this.value)"
                     class="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-800 rounded text-white text-right font-mono font-bold focus:outline-none focus:border-yellow-500">
              <span class="absolute right-3 top-2 text-xs text-slate-500 font-bold uppercase">pts</span>
            </div>
          </div>
        \`;
        horseBox.appendChild(horseRow);
      });

      renderLeaderboard();
      renderHistory();
      validateStartButton();
    }

    // Change Bet logic
    function changeBet(id, amount) {
      const currentAssigned = currentBets[id] || 0;
      const totalOtherBets = Object.keys(currentBets)
        .filter(k => k !== id)
        .reduce((sum, k) => sum + currentBets[k], 0);

      const maxAvailable = points - totalOtherBets;
      const target = Math.min(currentAssigned + amount, maxAvailable);
      
      currentBets[id] = target;
      document.getElementById(\`input-bet-\${id}\`).value = target;
      updateTotalBetHUD();
    }

    function setBetPercent(id, pct) {
      const totalOtherBets = Object.keys(currentBets)
        .filter(k => k !== id)
        .reduce((sum, k) => sum + currentBets[k], 0);

      const available = points - totalOtherBets;
      const target = Math.floor(available * pct);
      
      currentBets[id] = target;
      document.getElementById(\`input-bet-\${id}\`).value = target;
      updateTotalBetHUD();
    }

    function clearBet(id) {
      currentBets[id] = 0;
      document.getElementById(\`input-bet-\${id}\`).value = 0;
      updateTotalBetHUD();
    }

    function manualBet(id, val) {
      const parsed = Math.max(0, parseInt(val) || 0);
      const totalOtherBets = Object.keys(currentBets)
        .filter(k => k !== id)
        .reduce((sum, k) => sum + currentBets[k], 0);

      const available = points - totalOtherBets;
      const finalVal = Math.min(parsed, available);

      currentBets[id] = finalVal;
      document.getElementById(\`input-bet-\${id}\`).value = finalVal;
      updateTotalBetHUD();
    }

    function updateTotalBetHUD() {
      const total = Object.values(currentBets).reduce((sum, v) => sum + v, 0);
      document.getElementById("lobby-total-bet").innerText = \`\${total.toLocaleString()} pts\`;
      validateStartButton();
    }

    function validateStartButton() {
      const total = Object.values(currentBets).reduce((sum, v) => sum + v, 0);
      const btn = document.getElementById("start-race-btn");
      btn.disabled = total <= 0;
    }

    // Render Sidebars
    function renderLeaderboard() {
      const container = document.getElementById("leaderboard-list");
      container.innerHTML = "";
      
      // Sort scores descending
      leaderScores.sort((a, b) => b.score - a.score);
      const top3Trophies = ["🥇", "🥈", "🥉"];

      leaderScores.slice(0, 10).forEach((s, idx) => {
        const item = document.createElement("div");
        item.className = "flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg text-sm";
        
        const rankPrefix = idx < 3 ? top3Trophies[idx] : \`\${idx + 1}.\`;
        const dateStr = s.date || "2026-07-06";

        item.innerHTML = \`
          <div class="flex items-center gap-2">
            <span class="w-6 text-center text-sm font-semibold">\${rankPrefix}</span>
            <span class="font-bold text-slate-200">\${s.name}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-yellow-400 font-bold font-mono">\${s.score.toLocaleString()}</span>
            <span class="text-[10px] text-slate-500 font-mono">\${dateStr}</span>
          </div>
        \`;
        container.appendChild(item);
      });
    }

    function renderHistory() {
      const container = document.getElementById("history-list");
      container.innerHTML = "";
      
      if (historyLogs.length === 0) {
        container.innerHTML = \`<div class="text-center py-6 text-slate-500">배팅 기록이 아직 없습니다.</div>\`;
        return;
      }

      historyLogs.forEach(h => {
        const item = document.createElement("div");
        item.className = "flex flex-col gap-1 p-2 bg-slate-950/40 border border-slate-900 rounded-lg";
        
        const changeText = h.isWin 
          ? \`<span class="text-green-400 font-bold font-mono">+\${h.net.toLocaleString()} pts</span>\`
          : \`<span class="text-red-400 font-bold font-mono">-\${h.net.toLocaleString()} pts</span>\`;

        item.innerHTML = \`
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-bold font-title">Round \${h.round} 결과</span>
            <span>\${changeText}</span>
          </div>
          <div class="text-[10px] text-slate-500 truncate mt-0.5">
            우승마: <span class="text-slate-300 font-semibold">\${h.winnerName}</span> | 배팅총액: \${h.totalBet.toLocaleString()}
          </div>
        \`;
        container.appendChild(item);
      });
    }

    // Racing variables
    let raceInterval = null;
    let raceHorses = [];
    const raceCommentaryDatabase = [
      "초반 스타트와 함께 모든 마필 힘차게 문을 열었습니다!",
      "선두권 다툼이 치열합니다! 손에 땀을 쥐게 하는 속도 대결!",
      "안쪽 코스에서 거침없이 돌진하고 있는 마필이 보입니다!",
      "후반부 대역전극이 일어날 것인가?! 코너를 통과하고 있습니다!",
      "드디어 마지막 직선 주로! 채찍질이 바빠집니다!",
      "마지막 관중들의 함성소리와 함께 결승선을 코앞에 두고 있습니다!"
    ];

    function startRace() {
      const totalBetAmount = Object.values(currentBets).reduce((sum, v) => sum + v, 0);
      points -= totalBetAmount; // deduct points

      showScreen("screen-racing");
      document.getElementById("racing-round-num").innerText = \`\${currentRound}/10\`;
      document.getElementById("race-end-banner").classList.add("hidden");
      
      // Synthesize start sounds
      AudioSynth.playStart();

      // Init racers with dynamic parameters
      raceHorses = HORSES.map(h => ({
        ...h,
        progress: 3, // start with minor spacing
        speed: 1.2 + Math.random() * 0.4,
        boostCooldown: 10 + Math.random() * 12,
        finished: false,
        finishTime: 0,
        rank: null
      }));

      // Render lanes inside racetrack
      const lanesBox = document.getElementById("lanes-container");
      lanesBox.innerHTML = "";

      raceHorses.forEach((rh, idx) => {
        const lane = document.createElement("div");
        lane.id = \`lane-\${rh.id}\`;
        lane.className = "relative h-12 bg-slate-950/90 border border-slate-800 rounded-lg flex items-center";
        
        lane.innerHTML = \`
          <!-- Starting Gate banner -->
          <div class="absolute left-0 w-8 h-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs border-r border-slate-700 font-mono select-none">
            \${idx + 1}
          </div>

          <!-- Galloping track layout lane scroll -->
          <div class="absolute inset-x-8 h-1 bottom-0.5 animate-grass-scroll opacity-25"></div>

          <!-- Horse Runner visual -->
          <div id="runner-\${rh.id}" class="absolute left-[32px] transition-all duration-75 flex items-center gap-1.5" style="transform: translateX(0px)">
            \${getHorseSvg(rh.color, rh.accessory, "animate-gallop", "w-9 h-9")}
            <div class="text-[10px] font-bold px-1 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 leading-none truncate max-w-[80px]">
              \${rh.name}
            </div>
            <!-- Dynamic Spurt notification -->
            <div id="spurt-\${rh.id}" class="hidden text-[8px] text-yellow-400 font-extrabold uppercase animate-ping absolute -top-4 left-4">UP!</div>
          </div>
        \`;
        lanesBox.appendChild(lane);
      });

      // Run loop
      let timer = 0;
      let rankingCounter = 1;
      let gallopSoundCounter = 0;

      // Update commentary periodic
      const commentTimer = setInterval(() => {
        if (!isRacing) return;
        const comment = raceCommentaryDatabase[Math.floor(Math.random() * raceCommentaryDatabase.length)];
        document.getElementById("commentary-ticker").innerText = comment;
      }, 800);

      isRacing = true;

      raceInterval = setInterval(() => {
        timer += 50;
        gallopSoundCounter++;
        
        // Gallop sound effects
        if (gallopSoundCounter % 4 === 0) {
          AudioSynth.playStep();
        }

        // Get track width bounds
        const containerWidth = document.getElementById("racetrack-box").clientWidth;
        const maxTranslate = containerWidth - 160; // offset for start gate and horse size

        let allFinished = true;

        raceHorses.forEach(rh => {
          if (rh.finished) return;

          allFinished = false;

          // Adjust speed with random fluctuation & booster sparks
          let accel = (Math.random() - 0.45) * 0.45;
          
          // Boost code
          rh.boostCooldown--;
          if (rh.boostCooldown <= 0) {
            accel += 1.5; // major spurt!
            rh.boostCooldown = 20 + Math.random() * 15; // reset cooldown
            AudioSynth.playBoost();
            
            // Trigger boost popups
            const spurtNode = document.getElementById(\`spurt-\${rh.id}\`);
            if (spurtNode) {
              spurtNode.classList.remove("hidden");
              setTimeout(() => spurtNode.classList.add("hidden"), 600);
            }
          }

          // Slow runner catch-up help (keeps race exciting)
          const slowestProg = Math.min(...raceHorses.map(other => other.progress));
          if (rh.progress === slowestProg) {
            accel += 0.15;
          }

          rh.speed = Math.max(0.8, Math.min(3.5, rh.speed + accel * 0.12));
          rh.progress += rh.speed;

          // Cap progress to 100%
          if (rh.progress >= 95) {
            rh.progress = 95;
            rh.finished = true;
            rh.finishTime = timer;
            rh.rank = rankingCounter++;
          }

          // Apply visual offset translate
          const currentLeft = (rh.progress / 100) * maxTranslate;
          const runnerNode = document.getElementById(\`runner-\${rh.id}\`);
          if (runnerNode) {
            runnerNode.style.transform = \`translateX(\${currentLeft}px)\`;
          }
        });

        if (allFinished) {
          clearInterval(raceInterval);
          clearInterval(commentTimer);
          isRacing = false;
          handleRaceEnd();
        }
      }, 50);
    }

    // Process payouts and show winner pop-ups
    function handleRaceEnd() {
      AudioSynth.playFanfare();
      
      // Sort racers by rank
      raceHorses.sort((a, b) => a.rank - b.rank);
      const winner = raceHorses[0];

      // Calculate bet payouts
      let earnings = 0;
      const totalPlacedBets = Object.values(currentBets).reduce((sum, v) => sum + v, 0);

      raceHorses.forEach(rh => {
        const betAmt = currentBets[rh.id] || 0;
        if (betAmt > 0) {
          if (rh.rank === 1) earnings += Math.floor(betAmt * 2.0);
          else if (rh.rank === 2) earnings += Math.floor(betAmt * 1.0);
          else if (rh.rank === 3) earnings += Math.floor(betAmt * 0.5);
        }
      });

      const netGain = earnings - totalPlacedBets;
      const isWin = earnings > 0;

      // Update total points balance
      points += earnings;

      // Add to history
      historyLogs.unshift({
        round: currentRound,
        winnerId: winner.id,
        winnerName: winner.name,
        totalBet: totalPlacedBets,
        payout: earnings,
        net: Math.abs(netGain),
        isWin: netGain >= 0
      });

      // Update Result Modal Info
      document.getElementById("modal-winner-avatar").innerHTML = getHorseSvg(winner.color, winner.accessory, "animate-bounce w-16 h-16");
      document.getElementById("modal-winner-name").innerText = winner.name;
      document.getElementById("modal-winner-odds").innerText = "배당률: 1등 2x / 2등 1x / 3등 0.5x";

      const payoutBox = document.getElementById("modal-payout-box");
      
      // Build rankings HTML
      let rankingsHtml = '<div class="space-y-1.5 text-left mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">';
      raceHorses.forEach(rh => {
        const betAmt = currentBets[rh.id] || 0;
        let multText = "0x";
        let rhPayout = 0;
        if (rh.rank === 1) { multText = "2.0x"; rhPayout = betAmt * 2; }
        else if (rh.rank === 2) { multText = "1.0x"; rhPayout = betAmt * 1; }
        else if (rh.rank === 3) { multText = "0.5x"; rhPayout = betAmt * 0.5; }

        let badgeColor = "bg-slate-900 text-slate-500 border border-slate-850";
        if (rh.rank === 1) badgeColor = "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20";
        else if (rh.rank === 2) badgeColor = "bg-slate-500/15 text-slate-300 border border-slate-500/20";
        else if (rh.rank === 3) badgeColor = "bg-amber-700/15 text-amber-500 border border-amber-500/20";

        rankingsHtml += '  <div class="flex items-center justify-between py-1 border-b border-slate-900 last:border-0">';
        rankingsHtml += '    <div class="flex items-center gap-2">';
        rankingsHtml += '      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ' + badgeColor + '">' + rh.rank + '위</span>';
        rankingsHtml += '      <span class="font-semibold text-slate-300">' + rh.name + '</span>';
        rankingsHtml += '    </div>';
        rankingsHtml += '    <div class="flex items-center gap-2 font-mono">';
        if (betAmt > 0) {
          rankingsHtml += '      <span class="text-[10px] text-slate-400">배팅 ' + betAmt.toLocaleString() + ' → <span class="text-yellow-400 font-semibold">' + rhPayout.toLocaleString() + ' pts</span></span>';
        } else {
          rankingsHtml += '      <span class="text-[10px] text-slate-600">배팅 없음</span>';
        }
        rankingsHtml += '      <span class="font-bold text-slate-400">' + multText + '</span>';
        rankingsHtml += '    </div>';
        rankingsHtml += '  </div>';
      });
      rankingsHtml += '</div>';

      let summaryHtml = "";
      if (isWin) {
        summaryHtml = '  <div class="text-green-400 text-base font-bold">🎉 정산 완료: 배팅금 환급 성공!</div>' +
                      '  <div class="text-xs text-slate-300 mt-2">' +
                      '    총 획득금액: <span class="font-mono text-yellow-400 font-extrabold">' + earnings.toLocaleString() + ' pts</span><br>' +
                      '    순손익: <span class="font-mono ' + (netGain >= 0 ? "text-green-400" : "text-red-400") + ' font-semibold">' + (netGain >= 0 ? "+" : "") + netGain.toLocaleString() + ' pts</span>' +
                      '  </div>';
        triggerConfetti("modal-confetti");
      } else {
        summaryHtml = '  <div class="text-slate-400 text-base font-bold">😢 아쉬운 결과입니다.</div>' +
                      '  <div class="text-xs text-slate-300 mt-2">' +
                      '    순위권(1~3등)에 진입한 마필 중 배팅한 내역이 없습니다.<br>' +
                      '    손실액: <span class="font-mono text-red-400 font-bold">-' + totalPlacedBets.toLocaleString() + ' pts</span>' +
                      '  </div>';
      }

      payoutBox.innerHTML = rankingsHtml + summaryHtml;

      // Show result modal after small delay
      setTimeout(() => {
        document.getElementById("modal-results").classList.remove("hidden");
        document.getElementById("race-end-banner").classList.remove("hidden");
      }, 600);
    }

    function closeResultModal() {
      document.getElementById("modal-results").classList.add("hidden");
      document.getElementById("race-end-banner").classList.add("hidden");
      
      if (currentRound >= 10) {
        // Trigger gameover final ranking
        showScreen("screen-gameover");
        document.getElementById("gameover-final-score").innerText = points.toLocaleString() + " pts";
        triggerConfetti("gameover-confetti");
      } else {
        // Move to next round
        currentRound++;
        points += 2000; // 매 라운드 추가 자금 +2,000 pts (2k) 제공
        initLobby();
        showScreen("screen-lobby");
      }
    }

    // High Score saving
    function handleSaveScore(e) {
      e.preventDefault();
      const nick = document.getElementById("nickname").value.trim();
      const score = points;
      const today = new Date().toISOString().split('T')[0];

      leaderScores.push({ name: nick || "무명기수", score, date: today });
      // Keep only top 15
      leaderScores.sort((a, b) => b.score - a.score);
      leaderScores = leaderScores.slice(0, 15);
      localStorage.setItem("horse_ranks_highscores", JSON.stringify(leaderScores));

      resetGame();
    }

    function resetGame() {
      currentRound = 1;
      points = 10000;
      historyLogs = [];
      initLobby();
      showScreen("screen-lobby");
    }

    // Confetti particles generator
    function triggerConfetti(containerId) {
      const container = document.getElementById(containerId);
      container.innerHTML = "";
      
      const colors = ["#facc15", "#06b6d4", "#eab308", "#f97316", "#c084fc", "#ec4899", "#22c55e"];
      
      for (let i = 0; i < 45; i++) {
        const particle = document.createElement("div");
        particle.className = "absolute rounded-sm";
        particle.style.width = \`\${4 + Math.random() * 8}px\`;
        particle.style.height = \`\${6 + Math.random() * 12}px\`;
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = \`\${Math.random() * 100}%\`;
        particle.style.top = \`-\${Math.random() * 20}px\`;
        
        // CSS animations
        const duration = 1.5 + Math.random() * 2;
        const delay = Math.random() * 0.5;
        const rot = Math.random() * 360;
        
        particle.style.transform = \`rotate(\${rot}deg)\`;
        particle.style.animation = \`fall \${duration}s \${delay}s linear infinite\`;
        
        container.appendChild(particle);
      }

      // Add falling keyframe style on active fly
      if (!document.getElementById("confetti-css-rules")) {
        const style = document.createElement("style");
        style.id = "confetti-css-rules";
        style.innerHTML = \`
          @keyframes fall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
        \`;
        document.head.appendChild(style);
      }
    }

    // Function to trigger direct Single-File HTML exporter
    function exportSingleHtmlFile() {
      // Create clone code of this exact single page
      const htmlContent = document.documentElement.outerHTML;
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "index.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  </script>
</body>
</html>`;
}
